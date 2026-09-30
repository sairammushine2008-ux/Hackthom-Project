import bcrypt from 'bcryptjs';
import db from './index.js';
import { fileURLToPath } from 'url';

export async function runSeeds() {
  console.log('[SEED] Seeding database with Acme Logistics sample records & personas...');

  const passwordHash = bcrypt.hashSync('Password123!', 10);
  const orgId = 'org-acme-01';

  // 1. Create Organization
  const existingOrg = await db.query('SELECT * FROM organizations WHERE id = $1', [orgId]);
  if (existingOrg.rows.length === 0) {
    await db.query(
      'INSERT INTO organizations (id, name) VALUES ($1, $2)',
      [orgId, 'Acme Logistics Onboarding Hub']
    );
  }

  // 2. Seed Users
  const users = [
    {
      id: 'usr-mgr-01',
      name: 'Sarah Connor',
      email: 'manager@launchops.ai',
      role: 'Manager',
      department: 'Customer Success'
    },
    {
      id: 'usr-sales-01',
      name: 'Alex Rivera',
      email: 'sales@launchops.ai',
      role: 'Member',
      department: 'Sales'
    },
    {
      id: 'usr-it-01',
      name: 'David Kim',
      email: 'it@launchops.ai',
      role: 'Member',
      department: 'IT'
    },
    {
      id: 'usr-fin-01',
      name: 'Elena Rostova',
      email: 'finance@launchops.ai',
      role: 'Member',
      department: 'Finance'
    },
    {
      id: 'usr-adm-01',
      name: 'Marcus Vance',
      email: 'admin@launchops.ai',
      role: 'Administrator',
      department: 'Operations'
    }
  ];

  for (const u of users) {
    const existing = await db.query('SELECT * FROM users WHERE email = $1', [u.email]);
    if (existing.rows.length === 0) {
      await db.query(
        'INSERT INTO users (id, organization_id, name, email, password_hash, role, department) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [u.id, orgId, u.name, u.email, passwordHash, u.role, u.department]
      );
    }
  }

  // 3. Seed Acme Logistics Project
  const projectId = 'proj-acme-01';
  const existingProj = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
  if (existingProj.rows.length === 0) {
    await db.query(
      'INSERT INTO projects (id, organization_id, customer_name, target_launch_date, status, manager_id, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [projectId, orgId, 'Acme Logistics', '2026-11-15', 'Blocked', 'usr-mgr-01', 'usr-sales-01']
    );
  }

  // 4. Seed Source Document
  const docId = 'sales-handoff-01';
  const existingDoc = await db.query('SELECT * FROM source_documents WHERE id = $1', [docId]);
  const docContent = `Paragraph 1: Acme Logistics contract executed for 500 enterprise seats. The requested target launch date is November 15, 2026.
Paragraph 2: Single sign-on (SSO) configuration via Okta is strictly mandatory for IT provisioning and company-wide access.
Paragraph 3: Note from kickoff: Finance has not received the customer billing contact or purchase order (PO) number yet. Invoicing cannot proceed without this.
Paragraph 4: IT architecture and API endpoint provisioning must strictly wait for Security and Compliance approval before any production credentials are generated.
Paragraph 5: Customer Success needs to schedule the Executive Kickoff Call and establish bi-weekly onboarding syncs.`;

  if (existingDoc.rows.length === 0) {
    await db.query(
      'INSERT INTO source_documents (id, project_id, title, content, author_id, version) VALUES ($1, $2, $3, $4, $5, $6)',
      [docId, projectId, 'Sales Handoff & Kickoff Notes', docContent, 'usr-sales-01', 1]
    );
  }

  // 5. Seed Pre-approved Tasks showcasing dependencies & blockers
  const task1Id = 'tsk-sec-01'; // Security approval
  const task2Id = 'tsk-sso-02'; // SSO Config (Blocked by Task 1)
  const task3Id = 'tsk-fin-03'; // Billing contact
  const task4Id = 'tsk-cs-04';  // Executive kickoff

  const existingTask1 = await db.query('SELECT * FROM tasks WHERE id = $1', [task1Id]);
  if (existingTask1.rows.length === 0) {
    // Task 1: Security & Compliance
    await db.query(
      'INSERT INTO tasks (id, project_id, title, description, department, owner_id, status, due_date, proposal_id, source_references) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [
        task1Id,
        projectId,
        'Complete Security & Compliance Review',
        'Review vendor questionnaires and security architecture before issuing production credentials.',
        'Security',
        'usr-it-01',
        'In Progress',
        '2026-10-15',
        null,
        JSON.stringify([
          {
            documentId: docId,
            paragraphId: 'Paragraph 4',
            quote: 'IT architecture and API endpoint provisioning must strictly wait for Security and Compliance approval before any production credentials are generated.'
          }
        ])
      ]
    );

    // Task 2: Configure Okta Single Sign-On (Blocked by Security)
    await db.query(
      'INSERT INTO tasks (id, project_id, title, description, department, owner_id, status, due_date, proposal_id, source_references) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [
        task2Id,
        projectId,
        'Configure Okta Single Sign-On (SSO)',
        'Set up SAML/OIDC integration with Acme Okta tenant. Requires security sign-off first.',
        'IT',
        'usr-it-01',
        'Blocked',
        '2026-10-22',
        null,
        JSON.stringify([
          {
            documentId: docId,
            paragraphId: 'Paragraph 2',
            quote: 'Single sign-on (SSO) configuration via Okta is strictly mandatory for IT provisioning and company-wide access.'
          }
        ])
      ]
    );

    // Link dependency: Task 2 depends on Task 1
    await db.query(
      'INSERT INTO task_dependencies (id, task_id, prerequisite_task_id) VALUES ($1, $2, $3)',
      ['dep-01', task2Id, task1Id]
    );

    // Task 3: Billing contact (Finance)
    await db.query(
      'INSERT INTO tasks (id, project_id, title, description, department, owner_id, status, due_date, proposal_id, source_references) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [
        task3Id,
        projectId,
        'Collect Customer Billing Contact & Purchase Order',
        'Reach out to Acme accounting team to obtain official billing email, invoicing address, and PO number.',
        'Finance',
        'usr-fin-01',
        'In Progress',
        '2026-10-10',
        null,
        JSON.stringify([
          {
            documentId: docId,
            paragraphId: 'Paragraph 3',
            quote: 'Finance has not received the customer billing contact or purchase order (PO) number yet. Invoicing cannot proceed without this.'
          }
        ])
      ]
    );

    // Task 4: Executive Kickoff (Customer Success)
    await db.query(
      'INSERT INTO tasks (id, project_id, title, description, department, owner_id, status, due_date, proposal_id, source_references) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [
        task4Id,
        projectId,
        'Schedule Executive Onboarding Kickoff Call',
        'Host joint kickoff with VP of Supply Chain at Acme and establish bi-weekly cadence.',
        'Customer Success',
        'usr-mgr-01',
        'Completed',
        '2026-10-05',
        null,
        JSON.stringify([
          {
            documentId: docId,
            paragraphId: 'Paragraph 5',
            quote: 'Customer Success needs to schedule the Executive Kickoff Call and establish bi-weekly onboarding syncs.'
          }
        ])
      ]
    );
  }

  // 6. Seed Discussion Comments
  const existingComments = await db.query('SELECT * FROM comments WHERE project_id = $1', [projectId]);
  if (existingComments.rows.length === 0) {
    await db.query(
      'INSERT INTO comments (id, project_id, task_id, author_id, content) VALUES ($1, $2, $3, $4, $5)',
      ['cmt-01', projectId, task3Id, 'usr-fin-01', 'I reached out to the Acme procurement lead. Awaiting their response on billing entity details.']
    );
    await db.query(
      'INSERT INTO comments (id, project_id, task_id, author_id, content) VALUES ($1, $2, $3, $4, $5)',
      ['cmt-02', projectId, task2Id, 'usr-it-01', 'Okta metadata is ready. As soon as Security & Compliance approval is marked Complete, I will execute the SSO exchange.']
    );
  }

  // 7. Seed Initial Notifications
  const existingNotifs = await db.query('SELECT * FROM notifications WHERE user_id = $1', ['usr-mgr-01']);
  if (existingNotifs.rows.length === 0) {
    await db.query(
      'INSERT INTO notifications (id, user_id, organization_id, project_id, task_id, title, message) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        'notif-01',
        'usr-mgr-01',
        orgId,
        projectId,
        task2Id,
        'Task Blocked Alert',
        'Task "Configure Okta Single Sign-On (SSO)" is blocked waiting on "Complete Security & Compliance Review".'
      ]
    );
  }

  // 8. Seed Audit Log
  const existingAudits = await db.query('SELECT * FROM audit_events WHERE project_id = $1', [projectId]);
  if (existingAudits.rows.length === 0) {
    await db.query(
      'INSERT INTO audit_events (id, organization_id, project_id, actor_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        'aud-01',
        orgId,
        projectId,
        'usr-sales-01',
        'PROJECT_CREATED',
        'Project',
        projectId,
        JSON.stringify({ customer: 'Acme Logistics', targetLaunchDate: '2026-11-15' })
      ]
    );
    await db.query(
      'INSERT INTO audit_events (id, organization_id, project_id, actor_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        'aud-02',
        orgId,
        projectId,
        'usr-mgr-01',
        'PLAN_APPROVED',
        'AI_Plan',
        'initial-plan',
        JSON.stringify({ approvedTasksCount: 4 })
      ]
    );
  }

  console.log('[SEED] Seeding completed successfully!');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeeds()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
