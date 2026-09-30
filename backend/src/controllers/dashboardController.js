import db from '../db/index.js';

export async function getDashboardMetrics(req, res) {
  try {
    const orgId = req.user.organization_id;

    // Fetch all projects for organization
    const projRes = await db.query('SELECT * FROM projects WHERE organization_id = $1', [orgId]);
    const projects = projRes.rows;

    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'In Progress' || p.status === 'Planning').length;
    const blockedProjects = projects.filter(p => p.status === 'Blocked').length;
    const readyProjects = projects.filter(p => p.status === 'Ready for Launch' || p.status === 'Launched').length;

    // Fetch all tasks for organization projects
    let allTasks = [];
    for (const p of projects) {
      const tRes = await db.query(
        `SELECT t.*, p.customer_name 
         FROM tasks t 
         JOIN projects p ON t.project_id = p.id 
         WHERE t.project_id = $1`,
        [p.id]
      );
      allTasks = allTasks.concat(tRes.rows);
    }

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'Completed').length;
    const blockedTasks = allTasks.filter(t => t.status === 'Blocked').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'In Progress').length;

    const today = new Date().toISOString().split('T')[0];
    const overdueTasks = allTasks.filter(t => t.status !== 'Completed' && t.due_date && t.due_date < today);

    // Departmental breakdown
    const departmentBreakdown = {};
    for (const t of allTasks) {
      if (!departmentBreakdown[t.department]) {
        departmentBreakdown[t.department] = { total: 0, completed: 0, blocked: 0 };
      }
      departmentBreakdown[t.department].total += 1;
      if (t.status === 'Completed') departmentBreakdown[t.department].completed += 1;
      if (t.status === 'Blocked') departmentBreakdown[t.department].blocked += 1;
    }

    // Projects summary with days to target
    const projectsSummary = projects.map(p => {
      const targetDate = new Date(p.target_launch_date);
      const diffTime = targetDate - new Date();
      const daysToLaunch = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const pTasks = allTasks.filter(t => t.project_id === p.id);
      const pCompleted = pTasks.filter(t => t.status === 'Completed').length;
      const pBlocked = pTasks.filter(t => t.status === 'Blocked').length;

      return {
        id: p.id,
        customerName: p.customer_name,
        targetLaunchDate: p.target_launch_date,
        daysToLaunch,
        status: p.status,
        totalTasks: pTasks.length,
        completedTasks: pCompleted,
        blockedTasks: pBlocked,
        progressPercent: pTasks.length > 0 ? Math.round((pCompleted / pTasks.length) * 100) : 0
      };
    });

    res.json({
      metrics: {
        totalProjects,
        activeProjects,
        blockedProjects,
        readyProjects,
        totalTasks,
        completedTasks,
        blockedTasks,
        inProgressTasks,
        overdueCount: overdueTasks.length,
        overallCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      overdueTasks,
      departmentBreakdown,
      projectsSummary
    });
  } catch (err) {
    console.error('[Dashboard Error]', err);
    res.status(500).json({ error: 'Failed to retrieve dashboard metrics.' });
  }
}

export async function getAuditEvents(req, res) {
  try {
    const { projectId } = req.params;
    const auditRes = await db.query(
      `SELECT a.*, u.name as actor_name 
       FROM audit_events a 
       LEFT JOIN users u ON a.actor_id = u.id 
       WHERE a.project_id = $1 
       ORDER BY a.created_at DESC 
       LIMIT 50`,
      [projectId]
    );

    res.json(auditRes.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit events.' });
  }
}
