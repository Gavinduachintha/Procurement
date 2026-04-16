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

  async upsertItemDecision({
    purchaseRequestId,
    lineNo,
    approverId,
    decision,
    message,
  }) {
    const { rows } = await query(
      `INSERT INTO approval_item_decisions (
         purchase_request_id,
         line_no,
         approver_id,
         decision,
         message,
         decided_at
       ) VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (purchase_request_id, line_no, approver_id)
       DO UPDATE SET
         decision = EXCLUDED.decision,
         message = EXCLUDED.message,
         decided_at = NOW()
       RETURNING *`,
      [purchaseRequestId, lineNo, approverId, decision, message || null],
    );

    return rows[0] || null;
  },

  async listItemDecisionsByRequestAndApprover(purchaseRequestId, approverId) {
    const { rows } = await query(
      `SELECT *
       FROM approval_item_decisions
       WHERE purchase_request_id = $1 AND approver_id = $2
       ORDER BY line_no ASC`,
      [purchaseRequestId, approverId],
    );

    return rows;
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

  async findByRequestAndApprover(purchaseRequestId, approverId) {
    const { rows } = await query(
      `SELECT *
       FROM approvals
       WHERE purchase_request_id = $1 AND approver_id = $2
       LIMIT 1`,
      [purchaseRequestId, approverId],
    );

    return rows[0] || null;
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
       WHERE a.approver_id = $1
         AND a.decision = 'PENDING'
         AND pr.status IN ('APPROVAL_PENDING', 'CLARIFICATION_REQUESTED')
       ORDER BY pr.updated_at DESC`,
      [approverId],
    );
    console.log(
      "🔍 Backend: Querying pending approvals for approver:",
      approverId,
    );
    console.log("✅ Backend: Found", rows.length, "pending approvals");
    if (rows.length > 0) {
      console.log("📋 Backend: First pending approval:", {
        requestId: rows[0].request_id,
        status: rows[0].status,
      });
    }
    return rows;
  },
};
