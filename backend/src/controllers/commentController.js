import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';

export async function getComments(req, res) {
  try {
    const { projectId } = req.params;
    const commentsRes = await db.query(
      `SELECT c.*, u.name as author_name, u.role as author_role, u.department as author_department 
       FROM comments c 
       JOIN users u ON c.author_id = u.id 
       WHERE c.project_id = $1 
       ORDER BY c.created_at ASC`,
      [projectId]
    );

    res.json(commentsRes.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve comments.' });
  }
}

export async function createComment(req, res) {
  try {
    const { projectId } = req.params;
    const { taskId, content } = req.validatedBody;

    const commentId = `cmt-${uuidv4().slice(0, 8)}`;
    const commentRes = await db.query(
      `INSERT INTO comments (id, project_id, task_id, author_id, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [commentId, projectId, taskId || null, req.user.id, content]
    );

    const fullComment = {
      ...commentRes.rows[0],
      author_name: req.user.name,
      author_role: req.user.role,
      author_department: req.user.department
    };

    res.status(201).json(fullComment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to post comment.' });
  }
}
