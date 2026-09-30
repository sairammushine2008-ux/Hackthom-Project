import test from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../src/db/index.js';
import { runSeeds } from '../src/db/seed.js';
import { handleTaskStatusChange } from '../src/services/workflowEngine.js';
import { validateSourceReferences, generateOnboardingPlan, explainBlockers } from '../src/services/aiService.js';
import { approvePlan } from '../src/controllers/aiController.js';

test('LaunchOps AI Workflow and Boundaries Test Suite', async (t) => {
  // Initialize seeds
  await runSeeds();

  await t.test('1. Authentication: Password hashing with bcrypt and JWT verification', async () => {
    const password = 'Password123!';
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', ['manager@launchops.ai']);
    assert.strictEqual(userRes.rows.length, 1);
    
    const user = userRes.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    assert.strictEqual(passwordMatches, true, 'bcrypt should verify valid password');

    const JWT_SECRET = process.env.JWT_SECRET || 'launchops-dev-secret-key-super-secure-token-2025';
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, organization_id: user.organization_id }, JWT_SECRET);
    const decoded = jwt.verify(token, JWT_SECRET);
    assert.strictEqual(decoded.email, 'manager@launchops.ai');
    assert.strictEqual(decoded.role, 'Manager');
  });

  await t.test('2. Source Reference Verification: Validates citations exist in document text', async () => {
    const docsRes = await db.query('SELECT * FROM source_documents WHERE id = $1', ['sales-handoff-01']);
    assert.strictEqual(docsRes.rows.length, 1);
    const docs = docsRes.rows;

    const validRefs = [
      {
        documentId: 'sales-handoff-01',
        paragraphId: 'Paragraph 2',
        quote: 'Single sign-on (SSO) configuration via Okta is strictly mandatory for IT provisioning and company-wide access.'
      }
    ];

    const validated = validateSourceReferences(validRefs, docs);
    assert.strictEqual(validated.length, 1);
    assert.strictEqual(validated[0].documentId, 'sales-handoff-01');

    // Cross check missing doc reference is omitted
    const invalidDocRef = [{ documentId: 'non-existent-doc', paragraphId: 'p1', quote: 'fake' }];
    const validatedInvalid = validateSourceReferences(invalidDocRef, docs);
    assert.strictEqual(validatedInvalid.length, 0, 'Non-existent document references should be filtered out');
  });

  await t.test('3. AI Plan Generation: Proposes tasks and identifies missing information', async () => {
    const projRes = await db.query('SELECT * FROM projects WHERE id = $1', ['proj-acme-01']);
    const docsRes = await db.query('SELECT * FROM source_documents WHERE project_id = $1', ['proj-acme-01']);
    
    const plan = await generateOnboardingPlan(projRes.rows[0], docsRes.rows);
    assert.ok(plan.proposedTasks.length >= 3, 'Should generate at least 3 proposed tasks');
    assert.ok(plan.missingInformationAlerts.length >= 1, 'Should flag missing billing contact');
    
    // Check that Finance task exists
    const financeTask = plan.proposedTasks.find(t => t.department === 'Finance');
    assert.ok(financeTask, 'Finance task should be proposed');
    assert.strictEqual(financeTask.suggestedOwnerId, null, 'Suggested owner should be null pending manager assignment');
  });

  await t.test('4. Workflow Automation: Completing prerequisite automatically unblocks dependent task and notifies owner', async () => {
    // Current state: tsk-sso-02 is Blocked by tsk-sec-01
    const prereqRes = await db.query('SELECT * FROM tasks WHERE id = $1', ['tsk-sec-01']);
    const prereqTask = prereqRes.rows[0];

    const targetRes = await db.query('SELECT * FROM tasks WHERE id = $1', ['tsk-sso-02']);
    const targetTask = targetRes.rows[0];
    assert.strictEqual(targetTask.status, 'Blocked', 'Target task should initially be Blocked');

    // Simulate completing the prerequisite task
    await db.query('UPDATE tasks SET status = $1 WHERE id = $2', ['Completed', prereqTask.id]);
    prereqTask.status = 'Completed';

    const actorUser = { id: 'usr-mgr-01', organization_id: 'org-acme-01', name: 'Sarah Connor' };
    const released = await handleTaskStatusChange(prereqTask, 'In Progress', actorUser);

    assert.strictEqual(released.length, 1, 'Should release 1 dependent task');
    assert.strictEqual(released[0].id, 'tsk-sso-02');
    assert.strictEqual(released[0].status, 'In Progress', 'Released task should now be In Progress');

    // Check that in-app notification was dispatched
    const notifsRes = await db.query('SELECT * FROM notifications WHERE task_id = $1', ['tsk-sso-02']);
    assert.ok(notifsRes.rows.length >= 1, 'In-app notification should be generated for unblocked task');
    assert.ok(notifsRes.rows[0].title.includes('Ready') || notifsRes.rows[0].title.includes('Dependency Cleared'));
  });

  await t.test('5. Duplicate Approval Protection: Repeated approval rejects duplicate creation', async () => {
    // Create a mock proposal
    const testPropId = 'prop-test-01';
    await db.query(
      'INSERT INTO ai_proposals (id, project_id, version, status, structured_data, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
      [testPropId, 'proj-acme-01', 1, 'Pending', JSON.stringify({ summary: 'test' }), 'usr-mgr-01']
    );

    const mockReq = {
      params: { projectId: 'proj-acme-01' },
      body: { proposalId: testPropId },
      validatedBody: {
        tasks: [
          {
            title: 'Test Approved Task 1',
            department: 'IT',
            status: 'Not Started',
            sourceReferences: []
          }
        ]
      },
      user: { id: 'usr-mgr-01', name: 'Sarah Connor', role: 'Manager', organization_id: 'org-acme-01' }
    };

    let status1 = null;
    let json1 = null;
    const mockRes1 = {
      status: (s) => { status1 = s; return mockRes1; },
      json: (j) => { json1 = j; return mockRes1; }
    };

    await approvePlan(mockReq, mockRes1);
    assert.strictEqual(status1, 200, 'First approval should succeed');

    // Attempt second approval on the same proposal
    let status2 = null;
    let json2 = null;
    const mockRes2 = {
      status: (s) => { status2 = s; return mockRes2; },
      json: (j) => { json2 = j; return mockRes2; }
    };

    await approvePlan(mockReq, mockRes2);
    assert.strictEqual(status2, 400, 'Second approval on already approved proposal must return 400 Bad Request');
    assert.ok(json2.error.includes('already been approved'), 'Error must indicate plan is already approved');
  });

  await t.test('6. Blocker Explanation: Grounded response itemizes blockers and source citations', async () => {
    const projRes = await db.query('SELECT * FROM projects WHERE id = $1', ['proj-acme-01']);
    const tasksRes = await db.query('SELECT * FROM tasks WHERE project_id = $1', ['proj-acme-01']);
    const docsRes = await db.query('SELECT * FROM source_documents WHERE project_id = $1', ['proj-acme-01']);

    const explanation = await explainBlockers(projRes.rows[0], tasksRes.rows, docsRes.rows, 'What is preventing Acme from launching?');
    assert.ok(typeof explanation === 'string');
    assert.ok(explanation.includes('Acme Logistics'), 'Explanation should cite customer name');
    assert.ok(explanation.includes('Finance') || explanation.includes('billing') || explanation.includes('Security'), 'Should mention departmental blockers');
  });
});
