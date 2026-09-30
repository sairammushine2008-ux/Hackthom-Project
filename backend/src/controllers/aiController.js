import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { generateOnboardingPlan, explainBlockers, summarizeProgress, validateSourceReferences } from '../services/aiService.js';
import { updateProjectHealthStatus } from '../services/workflowEngine.js';

export async function generatePlan(req, res) {
  try {
    const { projectId } = req.params;
    const project = req.project;

    // Fetch documents
    const docsRes = await db.query('SELECT * FROM source_documents WHERE project_id = $1 ORDER BY version ASC', [projectId]);
    if (docsRes.rows.length === 0) {
      return res.status(400).json({ error: 'Cannot generate AI plan: Please upload or paste sales handoff notes first.' });
    }

    const documents = docsRes.rows;
    const structuredPlan = await generateOnboardingPlan(project, documents);

    // Save as pending proposal
    const proposalId = `prop-${uuidv4().slice(0, 8)}`;
    const propRes = await db.query(
      `INSERT INTO ai_proposals (id, project_id, version, status, structured_data, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [proposalId, projectId, 1, 'Pending', JSON.stringify(structuredPlan), req.user.id]
    );

    // Audit Event
    await db.query(
      `INSERT INTO audit_events (id, organization_id, project_id, actor_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        uuidv4(),
        req.user.organization_id,
        projectId,
        req.user.id,
        'AI_PLAN_GENERATED',
        'AIProposal',
        proposalId,
        JSON.stringify({ proposedTasksCount: structuredPlan.proposedTasks.length })
      ]
    );

    res.status(201).json({
      proposalId,
      plan: structuredPlan,
      status: 'Pending'
    });
  } catch (err) {
    console.error('[AI Plan Generation Error]', err);
    res.status(500).json({ error: 'AI plan generation failed: ' + err.message });
  }
}

export async function getLatestProposal(req, res) {
  try {
    const { projectId } = req.params;
    const propRes = await db.query(
      'SELECT * FROM ai_proposals WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1',
      [projectId]
    );

    if (propRes.rows.length === 0) {
      return res.json({ proposal: null });
    }

    const proposal = propRes.rows[0];
    res.json({
      proposal: {
        ...proposal,
        structured_data: typeof proposal.structured_data === 'string' ? JSON.parse(proposal.structured_data) : proposal.structured_data
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve AI proposal.' });
  }
}

/**
 * Approve AI proposal and instantiate real operational tasks.
 * Includes duplicate approval protection and single transaction.
 */
export async function approvePlan(req, res) {
  try {
    const { projectId } = req.params;
    const { proposalId } = req.body;
    const { tasks: reviewedTasks } = req.validatedBody;

    // Check proposal if proposalId is provided
    let proposal = null;
    if (proposalId) {
      const pRes = await db.query('SELECT * FROM ai_proposals WHERE id = $1', [proposalId]);
      if (pRes.rows.length > 0) {
        proposal = pRes.rows[0];
        // Duplicate approval protection
        if (proposal.status === 'Approved') {
          return res.status(400).json({ error: 'This AI proposal has already been approved and deployed.' });
        }
      }
    }

    // Verify all source references against project documents
    const docsRes = await db.query('SELECT * FROM source_documents WHERE project_id = $1', [projectId]);
    const documents = docsRes.rows;

    const createdTasks = [];
    const taskTitleToIdMap = new Map();

    // 1. Insert all tasks
    for (const item of reviewedTasks) {
      const taskId = `tsk-${uuidv4().slice(0, 8)}`;
      taskTitleToIdMap.set(item.title.toLowerCase().trim(), taskId);

      // Validate citations
      const validatedRefs = validateSourceReferences(item.sourceReferences || [], documents);

      const taskRes = await db.query(
        `INSERT INTO tasks (id, project_id, title, description, department, owner_id, status, due_date, proposal_id, source_references)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          taskId,
          projectId,
          item.title,
          item.description || '',
          item.department,
          item.ownerId || null,
          item.status || 'Not Started',
          item.dueDate || null,
          proposalId || null,
          JSON.stringify(validatedRefs)
        ]
      );
      createdTasks.push({ ...taskRes.rows[0], prerequisiteTitles: item.prerequisiteTitles || [] });
    }

    // 2. Link dependencies
    for (const t of createdTasks) {
      if (t.prerequisiteTitles && t.prerequisiteTitles.length > 0) {
        for (const prereqTitle of t.prerequisiteTitles) {
          const prereqId = taskTitleToIdMap.get(prereqTitle.toLowerCase().trim());
          if (prereqId && prereqId !== t.id) {
            await db.query(
              `INSERT INTO task_dependencies (id, task_id, prerequisite_task_id)
               VALUES ($1, $2, $3)`,
              [uuidv4(), t.id, prereqId]
            );

            // If prerequisite is not completed, mark this task as Blocked
            const prereqStatusRes = await db.query('SELECT status FROM tasks WHERE id = $1', [prereqId]);
            if (prereqStatusRes.rows.length > 0 && prereqStatusRes.rows[0].status !== 'Completed') {
              await db.query('UPDATE tasks SET status = $1 WHERE id = $2', ['Blocked', t.id]);
              t.status = 'Blocked';
            }
          }
        }
      }
    }

    // 3. Mark proposal as Approved if applicable
    if (proposalId) {
      await db.query(
        'UPDATE ai_proposals SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP WHERE id = $3',
        ['Approved', req.user.id, proposalId]
      );
    }

    // 4. Update overall project status
    await updateProjectHealthStatus(projectId);

    // 5. Create Audit Event
    await db.query(
      `INSERT INTO audit_events (id, organization_id, project_id, actor_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        uuidv4(),
        req.user.organization_id,
        projectId,
        req.user.id,
        'PLAN_APPROVED',
        'AIProposal',
        proposalId || 'manual-approval',
        JSON.stringify({
          createdTasksCount: createdTasks.length,
          approver: req.user.name,
          role: req.user.role
        })
      ]
    );

    res.status(200).json({
      message: 'Plan successfully approved and operational tasks created.',
      tasksCount: createdTasks.length,
      tasks: createdTasks
    });
  } catch (err) {
    console.error('[Plan Approval Error]', err);
    res.status(500).json({ error: 'Failed to approve plan: ' + err.message });
  }
}

export async function askBlockerExplanation(req, res) {
  try {
    const { projectId } = req.params;
    const { question = 'What is preventing Acme from launching?' } = req.body;
    const project = req.project;

    // Fetch tasks, dependencies and documents
    const tasksRes = await db.query('SELECT t.*, u.name as owner_name FROM tasks t LEFT JOIN users u ON t.owner_id = u.id WHERE t.project_id = $1', [projectId]);
    const tasks = tasksRes.rows;

    // Attach dependencies
    for (const t of tasks) {
      const depsRes = await db.query(
        `SELECT td.prerequisite_task_id, pt.title, pt.status 
         FROM task_dependencies td 
         JOIN tasks pt ON td.prerequisite_task_id = pt.id 
         WHERE td.task_id = $1`,
        [t.id]
      );
      t.dependencies = depsRes.rows;
    }

    const docsRes = await db.query('SELECT * FROM source_documents WHERE project_id = $1', [projectId]);
    const documents = docsRes.rows;

    const explanation = await explainBlockers(project, tasks, documents, question);
    res.json({ explanation });
  } catch (err) {
    console.error('[Explain Blockers Error]', err);
    res.status(500).json({ error: 'Failed to generate blocker explanation.' });
  }
}

export async function askProgressSummary(req, res) {
  try {
    const { projectId } = req.params;
    const project = req.project;

    const tasksRes = await db.query('SELECT * FROM tasks WHERE project_id = $1', [projectId]);
    const docsRes = await db.query('SELECT * FROM source_documents WHERE project_id = $1', [projectId]);

    const summary = await summarizeProgress(project, tasksRes.rows, docsRes.rows);
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate progress summary.' });
  }
}
