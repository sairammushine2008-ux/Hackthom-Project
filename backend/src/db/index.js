import pg from 'pg';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const { Pool } = pg;

let pool = null;
let useMemoryStore = false;

// In-memory data store as fallback when DATABASE_URL is not provided or in testing
export const memoryStore = {
  organizations: [],
  users: [],
  projects: [],
  source_documents: [],
  ai_proposals: [],
  tasks: [],
  task_dependencies: [],
  comments: [],
  notifications: [],
  audit_events: []
};

if (process.env.DATABASE_URL) {
  try {
    const isLocalhost = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle pg client', err);
    });
    console.log('[DB] Configured PostgreSQL pool with DATABASE_URL.');
  } catch (err) {
    console.warn('[DB] Failed to initialize pg Pool, falling back to memory store:', err.message);
    useMemoryStore = true;
  }
} else {
  console.log('[DB] No DATABASE_URL provided. Running with high-fidelity in-memory store.');
  useMemoryStore = true;
}

/**
 * Execute a query against PostgreSQL or fallback store
 */
export async function query(text, params = []) {
  if (!useMemoryStore && pool) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      // If pool connection fails or table doesn't exist, we can fallback gracefully
      console.warn(`[DB] PG query error: ${err.message}.`);
      throw err;
    }
  }

  // Fallback memory store query router for local / test / demo mode
  return executeMemoryQuery(text, params);
}

/**
 * Execute transaction block
 */
export async function withTransaction(callback) {
  if (!useMemoryStore && pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // In memory fallback transaction
  return await callback({ query });
}

export function isUsingMemoryStore() {
  return useMemoryStore;
}

export function setUseMemoryStore(val) {
  useMemoryStore = val;
}

// In-memory query handler supporting the exact SQL patterns used in the controllers
function executeMemoryQuery(text, params) {
  const clean = text.trim().replace(/\s+/g, ' ');

  // SELECT * FROM users WHERE email = $1
  if (/SELECT \* FROM users WHERE email = \$1/i.test(clean)) {
    const user = memoryStore.users.find(u => u.email.toLowerCase() === params[0]?.toLowerCase());
    return { rows: user ? [user] : [] };
  }

  // SELECT * FROM users WHERE id = $1
  if (/SELECT \* FROM users WHERE id = \$1/i.test(clean)) {
    const user = memoryStore.users.find(u => u.id === params[0]);
    return { rows: user ? [user] : [] };
  }

  // SELECT id, name, email, role, department FROM users WHERE organization_id = $1
  if (/SELECT id, name, email, role, department FROM users WHERE organization_id = \$1/i.test(clean)) {
    const users = memoryStore.users
      .filter(u => u.organization_id === params[0])
      .map(({ id, name, email, role, department }) => ({ id, name, email, role, department }));
    return { rows: users };
  }

  // INSERT INTO users
  if (/INSERT INTO users/i.test(clean)) {
    const [id, organization_id, name, email, password_hash, role, department] = params;
    const newUser = {
      id: id || uuidv4(),
      organization_id,
      name,
      email,
      password_hash,
      role,
      department,
      created_at: new Date().toISOString()
    };
    memoryStore.users.push(newUser);
    return { rows: [newUser] };
  }

  // SELECT * FROM organizations WHERE id = $1
  if (/SELECT \* FROM organizations WHERE id = \$1/i.test(clean)) {
    const org = memoryStore.organizations.find(o => o.id === params[0]);
    return { rows: org ? [org] : [] };
  }

  // INSERT INTO organizations
  if (/INSERT INTO organizations/i.test(clean)) {
    const [id, name] = params;
    const newOrg = { id: id || uuidv4(), name, created_at: new Date().toISOString() };
    memoryStore.organizations.push(newOrg);
    return { rows: [newOrg] };
  }

  // SELECT projects
  if (/SELECT p\.\*, u\.name as manager_name.*FROM projects p/i.test(clean)) {
    const orgId = params[0];
    const orgProjects = memoryStore.projects.filter(p => p.organization_id === orgId);
    const enriched = orgProjects.map(p => {
      const mgr = memoryStore.users.find(u => u.id === p.manager_id);
      const projTasks = memoryStore.tasks.filter(t => t.project_id === p.id);
      const totalTasks = projTasks.length;
      const completedTasks = projTasks.filter(t => t.status === 'Completed').length;
      const blockedTasks = projTasks.filter(t => t.status === 'Blocked').length;
      return {
        ...p,
        manager_name: mgr ? mgr.name : 'Unassigned',
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        blocked_tasks: blockedTasks
      };
    });
    return { rows: enriched };
  }

  // SELECT * FROM projects WHERE id = $1
  if (/SELECT \* FROM projects WHERE id = \$1/i.test(clean)) {
    const proj = memoryStore.projects.find(p => p.id === params[0]);
    if (proj) {
      const mgr = memoryStore.users.find(u => u.id === proj.manager_id);
      return { rows: [{ ...proj, manager_name: mgr ? mgr.name : 'Unassigned' }] };
    }
    return { rows: [] };
  }

  // INSERT INTO projects
  if (/INSERT INTO projects/i.test(clean)) {
    const [id, organization_id, customer_name, target_launch_date, status, manager_id, created_by] = params;
    const newProj = {
      id: id || uuidv4(),
      organization_id,
      customer_name,
      target_launch_date,
      status: status || 'Planning',
      manager_id: manager_id || null,
      created_by: created_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryStore.projects.push(newProj);
    return { rows: [newProj] };
  }

  // UPDATE projects
  if (/UPDATE projects/i.test(clean)) {
    const projId = params[params.length - 1];
    const idx = memoryStore.projects.findIndex(p => p.id === projId);
    if (idx !== -1) {
      if (params.length === 5) {
        // customer_name, target_launch_date, status, manager_id, id
        memoryStore.projects[idx].customer_name = params[0] || memoryStore.projects[idx].customer_name;
        memoryStore.projects[idx].target_launch_date = params[1] || memoryStore.projects[idx].target_launch_date;
        memoryStore.projects[idx].status = params[2] || memoryStore.projects[idx].status;
        memoryStore.projects[idx].manager_id = params[3] !== undefined ? params[3] : memoryStore.projects[idx].manager_id;
      } else if (params.length === 2) {
        // status, id
        memoryStore.projects[idx].status = params[0];
      }
      memoryStore.projects[idx].updated_at = new Date().toISOString();
      return { rows: [memoryStore.projects[idx]] };
    }
    return { rows: [] };
  }

  // SELECT * FROM source_documents WHERE project_id = $1
  if (/SELECT \* FROM source_documents WHERE project_id = \$1/i.test(clean)) {
    const docs = memoryStore.source_documents.filter(d => d.project_id === params[0]);
    return { rows: docs };
  }

  // SELECT * FROM source_documents WHERE id = $1
  if (/SELECT \* FROM source_documents WHERE id = \$1/i.test(clean)) {
    const doc = memoryStore.source_documents.find(d => d.id === params[0]);
    return { rows: doc ? [doc] : [] };
  }

  // INSERT INTO source_documents
  if (/INSERT INTO source_documents/i.test(clean)) {
    const [id, project_id, title, content, author_id, version] = params;
    const newDoc = {
      id: id || uuidv4(),
      project_id,
      title,
      content,
      author_id,
      version: version || 1,
      created_at: new Date().toISOString()
    };
    memoryStore.source_documents.push(newDoc);
    return { rows: [newDoc] };
  }

  // SELECT * FROM ai_proposals WHERE id = $1
  if (/SELECT \* FROM ai_proposals WHERE id = \$1/i.test(clean)) {
    const prop = memoryStore.ai_proposals.find(p => p.id === params[0]);
    return { rows: prop ? [prop] : [] };
  }

  // SELECT * FROM ai_proposals WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1
  if (/SELECT \* FROM ai_proposals WHERE project_id = \$1/i.test(clean)) {
    const proposals = memoryStore.ai_proposals
      .filter(p => p.project_id === params[0])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: proposals.length > 0 ? [proposals[0]] : [] };
  }

  // INSERT INTO ai_proposals
  if (/INSERT INTO ai_proposals/i.test(clean)) {
    const [id, project_id, version, status, structured_data, created_by] = params;
    const newProposal = {
      id: id || uuidv4(),
      project_id,
      version: version || 1,
      status: status || 'Pending',
      structured_data: typeof structured_data === 'string' ? JSON.parse(structured_data) : structured_data,
      created_by,
      approved_by: null,
      approved_at: null,
      created_at: new Date().toISOString()
    };
    memoryStore.ai_proposals.push(newProposal);
    return { rows: [newProposal] };
  }

  // UPDATE ai_proposals SET status
  if (/UPDATE ai_proposals SET status/i.test(clean)) {
    const propId = params[params.length - 1];
    const prop = memoryStore.ai_proposals.find(p => p.id === propId);
    if (prop) {
      prop.status = params[0];
      prop.approved_by = params[1] || prop.approved_by;
      prop.approved_at = new Date().toISOString();
      return { rows: [prop] };
    }
    return { rows: [] };
  }

  // SELECT tasks for project (handles join with users as well as plain SELECT * FROM tasks WHERE project_id = $1)
  if (/SELECT .* FROM tasks.*WHERE.*project_id = \$1/i.test(clean)) {
    const projId = params[0];
    const tasks = memoryStore.tasks.filter(t => t.project_id === projId).map(t => {
      const owner = memoryStore.users.find(u => u.id === t.owner_id);
      // Fetch dependencies
      const deps = memoryStore.task_dependencies.filter(d => d.task_id === t.id);
      const prerequisites = deps.map(d => {
        const prereqTask = memoryStore.tasks.find(pt => pt.id === d.prerequisite_task_id);
        return {
          id: d.id,
          prerequisite_task_id: d.prerequisite_task_id,
          title: prereqTask ? prereqTask.title : 'Unknown',
          status: prereqTask ? prereqTask.status : 'Unknown'
        };
      });
      return {
        ...t,
        owner_name: owner ? owner.name : 'Unassigned',
        dependencies: prerequisites
      };
    });
    return { rows: tasks };
  }

  // SELECT task by id (handles SELECT * and SELECT status)
  if (/SELECT .* FROM tasks WHERE id = \$1/i.test(clean)) {
    const task = memoryStore.tasks.find(t => t.id === params[0]);
    return { rows: task ? [task] : [] };
  }

  // SELECT * FROM tasks WHERE owner_id = $1
  if (/SELECT \* FROM tasks WHERE owner_id = \$1/i.test(clean)) {
    const tasks = memoryStore.tasks.filter(t => t.owner_id === params[0]);
    return { rows: tasks };
  }

  // INSERT INTO tasks
  if (/INSERT INTO tasks/i.test(clean)) {
    const [id, project_id, title, description, department, owner_id, status, due_date, proposal_id, source_references] = params;
    const newTask = {
      id: id || uuidv4(),
      project_id,
      title,
      description: description || '',
      department,
      owner_id: owner_id || null,
      status: status || 'Not Started',
      due_date: due_date || null,
      proposal_id: proposal_id || null,
      source_references: typeof source_references === 'string' ? JSON.parse(source_references) : (source_references || []),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryStore.tasks.push(newTask);
    return { rows: [newTask] };
  }

  // UPDATE tasks
  if (/UPDATE tasks SET/i.test(clean)) {
    const taskId = params[params.length - 1];
    const task = memoryStore.tasks.find(t => t.id === taskId);
    if (task) {
      if (/status = \$1/i.test(clean) && params.length === 2) {
        task.status = params[0];
      } else {
        // Generic task update
        if (params[0] !== undefined) task.title = params[0];
        if (params[1] !== undefined) task.description = params[1];
        if (params[2] !== undefined) task.department = params[2];
        if (params[3] !== undefined) task.owner_id = params[3];
        if (params[4] !== undefined) task.status = params[4];
        if (params[5] !== undefined) task.due_date = params[5];
      }
      task.updated_at = new Date().toISOString();
      return { rows: [task] };
    }
    return { rows: [] };
  }

  // INSERT INTO task_dependencies
  if (/INSERT INTO task_dependencies/i.test(clean)) {
    const [id, task_id, prerequisite_task_id] = params;
    const existing = memoryStore.task_dependencies.find(d => d.task_id === task_id && d.prerequisite_task_id === prerequisite_task_id);
    if (!existing) {
      const newDep = {
        id: id || uuidv4(),
        task_id,
        prerequisite_task_id,
        created_at: new Date().toISOString()
      };
      memoryStore.task_dependencies.push(newDep);
      return { rows: [newDep] };
    }
    return { rows: [existing] };
  }

  // SELECT task_dependencies WHERE prerequisite_task_id = $1
  if (/SELECT \* FROM task_dependencies WHERE prerequisite_task_id = \$1/i.test(clean)) {
    const deps = memoryStore.task_dependencies.filter(d => d.prerequisite_task_id === params[0]);
    return { rows: deps };
  }

  // SELECT task_dependencies WHERE task_id = $1
  if (/SELECT \* FROM task_dependencies WHERE task_id = \$1/i.test(clean)) {
    const deps = memoryStore.task_dependencies.filter(d => d.task_id === params[0]);
    return { rows: deps };
  }

  // SELECT comments for project
  if (/SELECT c\.\*, u\.name as author_name.*FROM comments c/i.test(clean)) {
    const projId = params[0];
    const comments = memoryStore.comments
      .filter(c => c.project_id === projId)
      .map(c => {
        const author = memoryStore.users.find(u => u.id === c.author_id);
        return {
          ...c,
          author_name: author ? author.name : 'Unknown User',
          author_role: author ? author.role : 'Member',
          author_department: author ? author.department : 'Operations'
        };
      })
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return { rows: comments };
  }

  // INSERT INTO comments
  if (/INSERT INTO comments/i.test(clean)) {
    const [id, project_id, task_id, author_id, content] = params;
    const newComment = {
      id: id || uuidv4(),
      project_id,
      task_id: task_id || null,
      author_id,
      content,
      created_at: new Date().toISOString()
    };
    memoryStore.comments.push(newComment);
    return { rows: [newComment] };
  }

  // SELECT notifications
  if (/SELECT .* FROM notifications/i.test(clean)) {
    let notifs = memoryStore.notifications;
    if (/WHERE.*task_id = \$1/i.test(clean)) {
      notifs = notifs.filter(n => n.task_id === params[0]);
    } else if (/WHERE.*user_id = \$1/i.test(clean)) {
      notifs = notifs.filter(n => n.user_id === params[0]);
    }
    return { rows: notifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) };
  }

  // INSERT INTO notifications
  if (/INSERT INTO notifications/i.test(clean)) {
    const [id, user_id, organization_id, project_id, task_id, title, message] = params;
    const newNotif = {
      id: id || uuidv4(),
      user_id,
      organization_id,
      project_id: project_id || null,
      task_id: task_id || null,
      title,
      message,
      is_read: false,
      created_at: new Date().toISOString()
    };
    memoryStore.notifications.push(newNotif);
    return { rows: [newNotif] };
  }

  // UPDATE notifications SET is_read = TRUE WHERE id = $1
  if (/UPDATE notifications SET is_read = TRUE WHERE id = \$1/i.test(clean)) {
    const notif = memoryStore.notifications.find(n => n.id === params[0]);
    if (notif) notif.is_read = true;
    return { rows: notif ? [notif] : [] };
  }

  // SELECT audit_events
  if (/SELECT a\.\*, u\.name as actor_name FROM audit_events a/i.test(clean)) {
    const projId = params[0];
    const events = memoryStore.audit_events
      .filter(a => a.project_id === projId)
      .map(a => {
        const actor = memoryStore.users.find(u => u.id === a.actor_id);
        return {
          ...a,
          actor_name: actor ? actor.name : 'System'
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: events };
  }

  // INSERT INTO audit_events
  if (/INSERT INTO audit_events/i.test(clean)) {
    const [id, organization_id, project_id, actor_id, action, target_type, target_id, details] = params;
    const newEvent = {
      id: id || uuidv4(),
      organization_id,
      project_id: project_id || null,
      actor_id: actor_id || null,
      action,
      target_type,
      target_id,
      details: typeof details === 'string' ? JSON.parse(details) : (details || {}),
      created_at: new Date().toISOString()
    };
    memoryStore.audit_events.push(newEvent);
    return { rows: [newEvent] };
  }

  return { rows: [] };
}

export default {
  query,
  withTransaction,
  memoryStore,
  isUsingMemoryStore,
  setUseMemoryStore
};
