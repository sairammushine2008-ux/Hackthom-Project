import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';

export async function getSourceDocs(req, res) {
  try {
    const { projectId } = req.params;
    const docsRes = await db.query(
      `SELECT d.*, u.name as author_name 
       FROM source_documents d 
       LEFT JOIN users u ON d.author_id = u.id 
       WHERE d.project_id = $1 
       ORDER BY d.created_at ASC`,
      [projectId]
    );

    // Format paragraphs with IDs for clear UI inspection and quoting
    const formattedDocs = docsRes.rows.map(doc => {
      const paragraphs = doc.content
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0)
        .map((text, idx) => ({
          paragraphId: `Paragraph ${idx + 1}`,
          text
        }));

      return {
        ...doc,
        paragraphs
      };
    });

    res.json(formattedDocs);
  } catch (err) {
    console.error('[Get Docs Error]', err);
    res.status(500).json({ error: 'Failed to retrieve source documents.' });
  }
}

export async function createSourceDoc(req, res) {
  try {
    const { projectId } = req.params;
    const { title, content } = req.validatedBody;

    // Check version
    const existingRes = await db.query('SELECT version FROM source_documents WHERE project_id = $1 ORDER BY version DESC LIMIT 1', [projectId]);
    const nextVersion = existingRes.rows.length > 0 ? existingRes.rows[0].version + 1 : 1;

    const docId = `doc-${uuidv4().slice(0, 8)}`;
    const newDocRes = await db.query(
      `INSERT INTO source_documents (id, project_id, title, content, author_id, version)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [docId, projectId, title, content, req.user.id, nextVersion]
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
        'DOCUMENT_UPLOADED',
        'SourceDocument',
        docId,
        JSON.stringify({ title, version: nextVersion, characterCount: content.length })
      ]
    );

    res.status(201).json(newDocRes.rows[0]);
  } catch (err) {
    console.error('[Create Doc Error]', err);
    res.status(500).json({ error: 'Failed to add source document.' });
  }
}
