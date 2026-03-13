import { query } from "../config/db.js";

export const notificationRepository = {
  async createMany(userIds, payload) {
    if (!userIds.length) return [];

    const values = [];
    const placeholders = [];

    userIds.forEach((userId, index) => {
      const base = index * 4;
      placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
      values.push(userId, payload.eventType, payload.subject, payload.message);
    });

    const { rows } = await query(
      `INSERT INTO notifications (user_id, event_type, subject, message)
       VALUES ${placeholders.join(",")}
       RETURNING id, user_id, event_type, subject, message, is_read, created_at`,
      values,
    );

    return rows;
  },

  async listByUserId(userId) {
    const { rows } = await query(
      `SELECT id, event_type, subject, message, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );
    return rows;
  },
};
