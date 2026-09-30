import db from '../db/index.js';

export async function getNotifications(req, res) {
  try {
    const notifsRes = await db.query(
      `SELECT n.*, p.customer_name 
       FROM notifications n 
       LEFT JOIN projects p ON n.project_id = p.id 
       WHERE n.user_id = $1 
       ORDER BY n.created_at DESC 
       LIMIT 30`,
      [req.user.id]
    );

    res.json(notifsRes.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
}

export async function markNotificationAsRead(req, res) {
  try {
    const { id } = req.params;
    await db.query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
}

export async function markAllNotificationsAsRead(req, res) {
  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all notifications as read.' });
  }
}
