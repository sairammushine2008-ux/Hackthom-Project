import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'launchops-dev-secret-key-super-secure-token-2025';

export async function register(req, res) {
  try {
    const { name, email, password, role = 'Member', department = 'Operations', organizationName } = req.validatedBody;

    // Check if email already registered
    const existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // Determine or create organization
    let orgId = 'org-acme-01';
    if (organizationName) {
      orgId = `org-${uuidv4().slice(0, 8)}`;
      await db.query(
        'INSERT INTO organizations (id, name) VALUES ($1, $2)',
        [orgId, organizationName]
      );
    } else {
      // Ensure default org exists
      const orgRes = await db.query('SELECT * FROM organizations LIMIT 1');
      if (orgRes.rows.length > 0) {
        orgId = orgRes.rows[0].id;
      } else {
        await db.query('INSERT INTO organizations (id, name) VALUES ($1, $2)', [orgId, 'Acme Logistics Onboarding Hub']);
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr-${uuidv4().slice(0, 8)}`;

    const userRes = await db.query(
      'INSERT INTO users (id, organization_id, name, email, password_hash, role, department) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, organization_id, name, email, role, department, created_at',
      [userId, orgId, name, email, passwordHash, role, department]
    );

    const newUser = userRes.rows[0];
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, organization_id: newUser.organization_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('[Register Error]', err);
    res.status(500).json({ error: 'Failed to register account: ' + err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.validatedBody;

    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = userRes.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, organization_id: user.organization_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        organization_id: user.organization_id
      }
    });
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const orgRes = await db.query('SELECT * FROM organizations WHERE id = $1', [req.user.organization_id]);
    const organization = orgRes.rows[0] || { id: req.user.organization_id, name: 'Workspace' };

    res.json({
      user: req.user,
      organization
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
}

export async function getOrganizationUsers(req, res) {
  try {
    const usersRes = await db.query(
      'SELECT id, name, email, role, department FROM users WHERE organization_id = $1 ORDER BY name ASC',
      [req.user.organization_id]
    );
    res.json(usersRes.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch organization users.' });
  }
}
