import jwt from 'jsonwebtoken';
import db from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'launchops-dev-secret-key-super-secure-token-2025';

/**
 * Verify JWT token and attach user & organization to request
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userRes = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    const user = userRes.rows[0];
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      organization_id: user.organization_id
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired authentication token.' });
  }
}

/**
 * Enforce role-based access control
 * @param  {...string} allowedRoles ('Administrator', 'Manager', 'Member')
 */
export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Action forbidden for role '${req.user.role}'. Required one of: ${allowedRoles.join(', ')}.`
      });
    }
    next();
  };
}

/**
 * Verify requested project belongs to the user's workspace
 */
export async function requireWorkspaceProject(req, res, next) {
  const projectId = req.params.projectId || req.params.id || req.body.projectId;
  if (!projectId) {
    return res.status(400).json({ error: 'Project ID required for workspace verification.' });
  }

  try {
    const projectRes = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const project = projectRes.rows[0];
    if (project.organization_id !== req.user.organization_id) {
      return res.status(403).json({ error: 'Cross-workspace access denied. Project belongs to another organization.' });
    }

    req.project = project;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Error verifying workspace project ownership.' });
  }
}

/**
 * Zod validation middleware for request body
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return res.status(400).json({
        error: 'Validation failed',
        details: issues
      });
    }
    req.validatedBody = result.data;
    next();
  };
}
