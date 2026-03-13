import { query } from "../config/db.js";

export const specificationRepository = {
  async createReview({ purchaseRequestId, checkerId, reviewedSpecifications, reviewNotes, decision }) {
    const { rows } = await query(
      `INSERT INTO specification_reviews (
          purchase_request_id, checker_id, reviewed_specifications, review_notes, decision
       ) VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [purchaseRequestId, checkerId, reviewedSpecifications, reviewNotes || null, decision],
    );
    return rows[0];
  },

  async listByRequestId(purchaseRequestId) {
    const { rows } = await query(
      `SELECT sr.*, u.full_name AS checker_name
       FROM specification_reviews sr
       JOIN users u ON sr.checker_id = u.id
       WHERE purchase_request_id = $1
       ORDER BY created_at DESC`,
      [purchaseRequestId],
    );
    return rows;
  },
};
