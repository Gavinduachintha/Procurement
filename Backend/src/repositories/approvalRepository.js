import { query } from "../config/db.js";

const DEFAULT_DEPARTMENT_ALLOCATION = 6000000;

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

  async replaceApprovalSlots(purchaseRequestId, approvers) {
    await query(
      `DELETE FROM approvals
       WHERE purchase_request_id = $1`,
      [purchaseRequestId],
    );

    await this.ensureApprovalSlots(purchaseRequestId, approvers);
  },

  async clearItemDecisionsByRequest(purchaseRequestId) {
    await query(
      `DELETE FROM approval_item_decisions
       WHERE purchase_request_id = $1`,
      [purchaseRequestId],
    );
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
      `SELECT
         pr.*,
         $2::numeric AS total_allocation_amount,
         COALESCE(consumed.approved_amount, 0)::numeric AS approved_consumed_amount,
         ($2::numeric - COALESCE(consumed.approved_amount, 0)::numeric) AS remaining_allocation_amount,
         ($2::numeric - COALESCE(consumed.approved_amount, 0)::numeric - pr.estimated_cost::numeric) AS remaining_after_current_approval_amount
       FROM approvals a
       JOIN purchase_requests pr ON pr.id = a.purchase_request_id
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(pr2.estimated_cost), 0) AS approved_amount
         FROM purchase_requests pr2
         WHERE pr2.department = pr.department
           AND pr2.status = 'APPROVED'
       ) consumed ON TRUE
       WHERE a.approver_id = $1
         AND a.decision = 'PENDING'
         AND pr.status IN ('APPROVAL_PENDING', 'CLARIFICATION_REQUESTED')
       ORDER BY pr.updated_at DESC`,
      [approverId, DEFAULT_DEPARTMENT_ALLOCATION],
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

  async listAllByApprover(approverId) {
    const { rows } = await query(
      `SELECT
         pr.*, 
         a.decision AS approval_decision,
         a.comments AS approval_comments,
         a.decided_at AS approval_decided_at,
         a.approver_role,
         $2::numeric AS total_allocation_amount,
         COALESCE(consumed.approved_amount, 0)::numeric AS approved_consumed_amount,
         ($2::numeric - COALESCE(consumed.approved_amount, 0)::numeric) AS remaining_allocation_amount,
         ($2::numeric - COALESCE(consumed.approved_amount, 0)::numeric - pr.estimated_cost::numeric) AS remaining_after_current_approval_amount
       FROM approvals a
       JOIN purchase_requests pr ON pr.id = a.purchase_request_id
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(pr2.estimated_cost), 0) AS approved_amount
         FROM purchase_requests pr2
         WHERE pr2.department = pr.department
           AND pr2.status = 'APPROVED'
       ) consumed ON TRUE
       WHERE a.approver_id = $1
       ORDER BY
         CASE WHEN a.decision = 'PENDING' THEN 0 ELSE 1 END,
         COALESCE(a.decided_at, pr.updated_at) DESC,
         pr.updated_at DESC`,
      [approverId, DEFAULT_DEPARTMENT_ALLOCATION],
    );

    return rows;
  },

  async getBudgetSnapshotForRequest(purchaseRequestId) {
    const { rows } = await query(
      `SELECT
         pr.id AS purchase_request_id,
         pr.department,
         pr.estimated_cost::numeric AS current_request_amount,
         $2::numeric AS total_allocation_amount,
         COALESCE(consumed.approved_amount, 0)::numeric AS approved_consumed_amount,
         ($2::numeric - COALESCE(consumed.approved_amount, 0)::numeric) AS remaining_allocation_amount,
         ($2::numeric - COALESCE(consumed.approved_amount, 0)::numeric - pr.estimated_cost::numeric) AS remaining_after_current_approval_amount
       FROM purchase_requests pr
       LEFT JOIN LATERAL (
         SELECT COALESCE(SUM(pr2.estimated_cost), 0) AS approved_amount
         FROM purchase_requests pr2
         WHERE pr2.department = pr.department
           AND pr2.status = 'APPROVED'
       ) consumed ON TRUE
       WHERE pr.id = $1
       LIMIT 1`,
      [purchaseRequestId, DEFAULT_DEPARTMENT_ALLOCATION],
    );

    return rows[0] || null;
  },
};
