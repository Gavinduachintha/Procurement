import { query } from "../config/db.js";

export const approvalRepository = {
  async ensureApprovalSlots(purchaseRequestId, approvers) {
    for (const approver of approvers) {
      await query(
        `INSERT INTO approvals (purchase_request_id, approver_id, approver_role, decision)
         VALUES ($1, $2, $3, 'PENDING')
         ON CONFLICT (purchase_request_id, approver_id) DO NOTHING`,
        [purchaseRequestId, approver.id, approver.role],
      );
    }
  },

  async decide({ purchaseRequestId, approverId, decision, comments }) {
    const { rows } = await query(
      `UPDATE approvals
       SET decision = $3, comments = $4, decided_at = NOW()
       WHERE purchase_request_id = $1 AND approver_id = $2
       RETURNING *`,
      [purchaseRequestId, approverId, decision, comments || null],
    );
    return rows[0] || null;
  },

  async listByRequest(purchaseRequestId) {
    const { rows } = await query(
      `SELECT a.*, u.full_name
       FROM approvals a
       JOIN users u ON a.approver_id = u.id
       WHERE purchase_request_id = $1
       ORDER BY a.id ASC`,
      [purchaseRequestId],
    );
    return rows;
  },

  async getApprovalSummary(purchaseRequestId) {
    const { rows } = await query(
      `SELECT
         COUNT(*) FILTER (WHERE decision = 'APPROVED') AS approved_count,
         COUNT(*) FILTER (WHERE decision = 'REJECTED') AS rejected_count,
         COUNT(*) FILTER (WHERE decision = 'CLARIFICATION_REQUESTED') AS clarification_count,
         COUNT(*) FILTER (WHERE decision = 'PENDING') AS pending_count,
         COUNT(*) AS total_count
       FROM approvals
       WHERE purchase_request_id = $1`,
      [purchaseRequestId],
    );
    return rows[0];
  },

  async listPendingByApprover(approverId) {
    const { rows } = await query(
      `SELECT pr.*
       FROM approvals a
       JOIN purchase_requests pr ON pr.id = a.purchase_request_id
       WHERE a.approver_id = $1 AND a.decision = 'PENDING'
       ORDER BY pr.updated_at DESC`,
      [approverId],
    );
    return rows;
  },
};
