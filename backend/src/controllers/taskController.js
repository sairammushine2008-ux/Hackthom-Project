import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { handleTaskStatusChange } from '../services/workflowEngine.js';

export async function getTasks(req, res) {
  try {
    const { projectId } = req.params;
    const tasksRes = await db.query(
      `SELECT t.*, u.name as owner_name, u.email as owner_email, u.department as owner_dept 
       FROM tasks t 
       LEFT JOIN users u ON t.owner_id = u.id 
       WHERE t.project_id = $1 
       ORDER BY t.created_at ASC`,
      [projectId]
    );

    const tasks = tasksRes.rows;

    // Attach dependencies to each task
    for (const task of tasks) {
      const depsRes = await db.query(
        `SELECT td.id as dependency_id, td.prerequisite_task_id, pt.title as prerequisite_title, pt.status as prerequisite_status 
         FROM task_dependencies td 
         JOIN tasks pt ON td.prerequisite_task_id = pt.id 
         WHERE td.task_id = $1`,
        [task.id]
      );
      task.dependencies = depsRes.rows;
      task.source_references = typeof task.source_references === 'string' ? JSON.parse(task.source_references) : (task.source_references || []);
    }

    res.json(tasks);
  } catch (err) {
    console.error('[Get Tasks Error]', err);
    res.status(500).json({ error: 'Failed to retrieve tasks.' });
  }
}

export async function getMyTasks(req, res) {
  try {
    const userId = req.user.id;
    const userDept = req.user.department;

    const tasksRes = await db.query(
      `SELECT t.*, p.customer_name, p.target_launch_date 
       FROM tasks t 
       JOIN projects p ON t.project_id = p.id 
       WHERE p.organization_id = $1 
         AND (t.owner_id = $2 OR t.department = $3)
       ORDER BY t.due_date ASC NULLS LAST, t.created_at ASC`,
      [req.user.organization_id, userId, userDept]
    );

    const tasks = tasksRes.rows.map(t => ({
      ...t,
      source_references: typeof t.source_references === 'string' ? JSON.parse(t.source_references) : (t.source_references || [])
    }));

    res.json(tasks);
  } catch (err) {
    console.error('[Get My Tasks Error]', err);
    res.status(500).json({ error: 'Failed to retrieve user tasks.' });
  }
}

export async function createTask(req, res) {
  try {
    const { projectId } = req.params;
    const { title, description, department, ownerId, status = 'Not Started', dueDate } = req.body;

    const taskId = `tsk-${uuidv4().slice(0, 8)}`;
    const taskRes = await db.query(
      `INSERT INTO tasks (id, project_id, title, description, department, owner_id, status, due_date, source_references)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [taskId, projectId, title, description || '', department, ownerId || null, status, dueDate || null, '[]']
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
        'TASK_CREATED',
        'Task',
        taskId,
        JSON.stringify({ title, department })
      ]
    );

    res.status(201).json(taskRes.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task.' });
  }
}

export async function updateTask(req, res) {
  try {
    const { id } = req.params;
    const { title, description, department, ownerId, status, dueDate } = req.validatedBody;

    const taskRes = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskRes.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const task = taskRes.rows[0];
    const previousStatus = task.status;

    // Check workspace ownership via project
    const projRes = await db.query('SELECT organization_id FROM projects WHERE id = $1', [task.project_id]);
    if (projRes.rows.length === 0 || projRes.rows[0].organization_id !== req.user.organization_id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const updatedTaskRes = await db.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           department = COALESCE($3, department),
           owner_id = COALESCE($4, owner_id),
           status = COALESCE($5, status),
           due_date = COALESCE($6, due_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [title, description, department, ownerId, status, dueDate, id]
    );

    const updatedTask = updatedTaskRes.rows[0];

    // Trigger Workflow Automation Engine on status change
    let releasedTasks = [];
    if (status && status !== previousStatus) {
      releasedTasks = await handleTaskStatusChange(updatedTask, previousStatus, req.user);
    }

    // Audit Event
    await db.query(
      `INSERT INTO audit_events (id, organization_id, project_id, actor_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        uuidv4(),
        req.user.organization_id,
        task.project_id,
        req.user.id,
        'TASK_UPDATED',
        'Task',
        id,
        JSON.stringify({
          previousStatus,
          newStatus: updatedTask.status,
          title: updatedTask.title,
          releasedTasksCount: releasedTasks.length
        })
      ]
    );

    res.json({
      task: updatedTask,
      releasedTasks,
      notification: releasedTasks.length > 0 
        ? `Workflow Automation: Completing "${updatedTask.title}" released ${releasedTasks.length} dependent task(s)!`
        : null
    });
  } catch (err) {
    console.error('[Update Task Error]', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
}
