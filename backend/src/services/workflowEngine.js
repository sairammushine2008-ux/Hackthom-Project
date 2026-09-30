import db from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Workflow Automation Engine
 * Automatically evaluates dependencies and releases blocked tasks upon prerequisite completion.
 */
export async function handleTaskStatusChange(task, previousStatus, actorUser) {
  if (task.status === previousStatus) return [];

  const releasedTasks = [];

  // If a task was marked Completed, check if any dependent tasks can now be unblocked
  if (task.status === 'Completed') {
    // 1. Find all dependencies where this task was a prerequisite
    const depRes = await db.query(
      'SELECT * FROM task_dependencies WHERE prerequisite_task_id = $1',
      [task.id]
    );

    for (const dep of depRes.rows) {
      const depTaskId = dep.task_id;
      
      // Fetch the dependent task
      const targetTaskRes = await db.query('SELECT * FROM tasks WHERE id = $1', [depTaskId]);
      if (targetTaskRes.rows.length === 0) continue;
      const targetTask = targetTaskRes.rows[0];

      // Check all prerequisites for this target task
      const allPrereqsRes = await db.query(
        'SELECT * FROM task_dependencies WHERE task_id = $1',
        [depTaskId]
      );

      let allPrereqsMet = true;
      for (const p of allPrereqsRes.rows) {
        const prereqTaskRes = await db.query('SELECT status FROM tasks WHERE id = $1', [p.prerequisite_task_id]);
        if (prereqTaskRes.rows.length === 0 || prereqTaskRes.rows[0].status !== 'Completed') {
          allPrereqsMet = false;
          break;
        }
      }

      // If all prerequisites are fulfilled and the task was Blocked, release it to In Progress!
      if (allPrereqsMet && (targetTask.status === 'Blocked' || targetTask.status === 'Not Started')) {
        await db.query(
          'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['In Progress', targetTask.id]
        );

        targetTask.status = 'In Progress';
        releasedTasks.push(targetTask);

        // Notify the task owner if assigned
        const recipientUserId = targetTask.owner_id || actorUser.id;
        await db.query(
          'INSERT INTO notifications (id, user_id, organization_id, project_id, task_id, title, message) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [
            uuidv4(),
            recipientUserId,
            actorUser.organization_id,
            targetTask.project_id,
            targetTask.id,
            'Dependency Cleared: Task Ready',
            `Prerequisite "${task.title}" is now Completed. Task "${targetTask.title}" has been unblocked and is ready to work!`
          ]
        );

        // Record Audit Event for Workflow Automation
        await db.query(
          'INSERT INTO audit_events (id, organization_id, project_id, actor_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [
            uuidv4(),
            actorUser.organization_id,
            targetTask.project_id,
            actorUser.id,
            'WORKFLOW_AUTO_RELEASE',
            'Task',
            targetTask.id,
            JSON.stringify({
              unblockedTaskId: targetTask.id,
              unblockedTaskTitle: targetTask.title,
              completedPrerequisiteId: task.id,
              completedPrerequisiteTitle: task.title
            })
          ]
        );
      }
    }
  }

  // Recalculate Project Status
  await updateProjectHealthStatus(task.project_id);

  return releasedTasks;
}

/**
 * Automatically update project status based on task states
 */
export async function updateProjectHealthStatus(projectId) {
  const tasksRes = await db.query('SELECT status FROM tasks WHERE project_id = $1', [projectId]);
  if (tasksRes.rows.length === 0) return;

  const tasks = tasksRes.rows;
  const anyBlocked = tasks.some(t => t.status === 'Blocked');
  const allCompleted = tasks.every(t => t.status === 'Completed');

  let newStatus = 'In Progress';
  if (allCompleted) {
    newStatus = 'Ready for Launch';
  } else if (anyBlocked) {
    newStatus = 'Blocked';
  }

  await db.query('UPDATE projects SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newStatus, projectId]);
}
