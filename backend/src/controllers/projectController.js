import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';

export async function getProjects(req, res) {
  try {
    const orgId = req.user.organization_id;
    const result = await db.query(
      `SELECT p.*, u.name as manager_name 
       FROM projects p 
       LEFT JOIN users u ON p.manager_id = u.id 
       WHERE p.organization_id = $1 
       ORDER BY p.target_launch_date ASC`,
      [orgId]
    );

    // Enrich with task statistics
    const projectsWithStats = await Promise.all(
      result.rows.map(async (project) => {
        const tasksRes = await db.query('SELECT status, due_date FROM tasks WHERE project_id = $1', [project.id]);
        const tasks = tasksRes.rows;
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'Completed').length;
        const blocked = tasks.filter(t => t.status === 'Blocked').length;
        const inProgress = tasks.filter(t => t.status === 'In Progress').length;

        // Calculate if any task is overdue
        const today = new Date().toISOString().split('T')[0];
        const overdue = tasks.filter(t => t.status !== 'Completed' && t.due_date && t.due_date < today).length;

        return {
          ...project,
          total_tasks: total,
          completed_tasks: completed,
          blocked_tasks: blocked,
          in_progress_tasks: inProgress,
          overdue_tasks: overdue,
          progress_percent: total > 0 ? Math.round((completed / total) * 100) : 0
        };
      })
    );

    res.json(projectsWithStats);
  } catch (err) {
    console.error('[Get Projects Error]', err);
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
}

export async function getProjectById(req, res) {
  try {
    const { id } = req.params;
    const projectRes = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const project = projectRes.rows[0];

    // Enforce workspace isolation
    if (project.organization_id !== req.user.organization_id) {
      return res.status(403).json({ error: 'Access denied to this workspace project.' });
    }

    const mgrRes = project.manager_id ? await db.query('SELECT name, email, department FROM users WHERE id = $1', [project.manager_id]) : { rows: [] };
    const manager = mgrRes.rows[0] || null;

    const tasksRes = await db.query('SELECT status, due_date FROM tasks WHERE project_id = $1', [project.id]);
    const tasks = tasksRes.rows;
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const blocked = tasks.filter(t => t.status === 'Blocked').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const today = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter(t => t.status !== 'Completed' && t.due_date && t.due_date < today).length;

    res.json({
      ...project,
      manager,
      stats: {
        total,
        completed,
        blocked,
        inProgress,
        overdue,
        progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project details.' });
  }
}

export async function createProject(req, res) {
  try {
    const { customerName, targetLaunchDate, managerId } = req.validatedBody;
    const projectId = `proj-${uuidv4().slice(0, 8)}`;
    const orgId = req.user.organization_id;

    const newProjectRes = await db.query(
      `INSERT INTO projects (id, organization_id, customer_name, target_launch_date, status, manager_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [projectId, orgId, customerName, targetLaunchDate, 'Planning', managerId || req.user.id, req.user.id]
    );

    // Audit Event
    await db.query(
      `INSERT INTO audit_events (id, organization_id, project_id, actor_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        uuidv4(),
        orgId,
        projectId,
        req.user.id,
        'PROJECT_CREATED',
        'Project',
        projectId,
        JSON.stringify({ customerName, targetLaunchDate })
      ]
    );

    res.status(201).json(newProjectRes.rows[0]);
  } catch (err) {
    console.error('[Create Project Error]', err);
    res.status(500).json({ error: 'Failed to create project.' });
  }
}

export async function updateProject(req, res) {
  try {
    const { id } = req.params;
    const { customerName, targetLaunchDate, status, managerId } = req.validatedBody;

    const existingRes = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const existing = existingRes.rows[0];
    if (existing.organization_id !== req.user.organization_id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const updatedRes = await db.query(
      `UPDATE projects 
       SET customer_name = COALESCE($1, customer_name),
           target_launch_date = COALESCE($2, target_launch_date),
           status = COALESCE($3, status),
           manager_id = COALESCE($4, manager_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [customerName, targetLaunchDate, status, managerId, id]
    );

    await db.query(
      `INSERT INTO audit_events (id, organization_id, project_id, actor_id, action, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        uuidv4(),
        req.user.organization_id,
        id,
        req.user.id,
        'PROJECT_UPDATED',
        'Project',
        id,
        JSON.stringify({ customerName, targetLaunchDate, status })
      ]
    );

    res.json(updatedRes.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project.' });
  }
}
