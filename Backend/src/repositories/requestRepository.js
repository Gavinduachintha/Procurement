import { query } from "../config/db.js";

export const requestRepository = {
  async create(payload) {
    const { rows } = await query(
      `INSERT INTO purchase_requests (
          request_id, requester_id, item_name, item_description, technical_specifications,
          item_type, quantity, estimated_cost, funding_source, justification,
          department, required_date, attachments, status
       ) VALUES (
          NULL, $1, $2, $3, $4,
          $5, $6, $7, $8, $9,
          $10, $11, $12::jsonb, $13
       ) RETURNING *`,
      [
        payload.requesterId,
        payload.itemName,
        payload.itemDescription || null,
        payload.technicalSpecifications,
        payload.itemType,
        payload.quantity,
        payload.estimatedCost,
        payload.fundingSource,
        payload.justification,
        payload.department,
        payload.requiredDate,
        JSON.stringify(payload.attachments || []),
        payload.status,
      ],
    );
    return rows[0];
  },

  async updateRequestId(id, requestId) {
    const { rows } = await query(
      `UPDATE purchase_requests
       SET request_id = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, requestId],
    );
    return rows[0];
  },

  async listByRequesterId(requesterId) {
    const { rows } = await query(
      `SELECT pr.*, u.full_name AS specification_checker_name
       FROM purchase_requests pr
       LEFT JOIN users u ON pr.specification_checker_id = u.id
       WHERE requester_id = $1
       ORDER BY created_at DESC`,
      [requesterId],
    );
    return rows;
  },

  async listAssignedForSpecificationChecker(checkerId) {
    const { rows } = await query(
      `SELECT *
       FROM purchase_requests
       WHERE specification_checker_id = $1
         AND status IN ('SPEC_REVIEW_PENDING', 'SPEC_REWORK_REQUESTED')
       ORDER BY updated_at DESC`,
      [checkerId],
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await query(
      "SELECT * FROM purchase_requests WHERE id = $1",
      [id],
    );
    return rows[0] || null;
  },

  async findByRequestNumber(requestId) {
    const { rows } = await query(
      "SELECT * FROM purchase_requests WHERE request_id = $1",
      [requestId],
    );
    return rows[0] || null;
  },

  async assignSpecificationChecker(id, checkerId, status) {
    const { rows } = await query(
      `UPDATE purchase_requests
       SET specification_checker_id = $2, status = $3, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, checkerId, status],
    );
    return rows[0];
  },

  async updateSpecificationReviewResult(id, checkedSpecifications, status) {
    const { rows } = await query(
      `UPDATE purchase_requests
       SET checked_specifications = $2, status = $3, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, checkedSpecifications, status],
    );
    return rows[0];
  },

  async updateStatus(id, status) {
    const { rows } = await query(
      `UPDATE purchase_requests
       SET status = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, status],
    );
    return rows[0];
  },

  async listForApprovals() {
    const { rows } = await query(
      `SELECT * FROM purchase_requests
       WHERE status IN ('APPROVAL_PENDING', 'CLARIFICATION_REQUESTED')
       ORDER BY updated_at DESC`,
    );
    return rows;
  },

  async listApprovedWithoutJobs() {
    const { rows } = await query(
      `SELECT pr.*
       FROM purchase_requests pr
       LEFT JOIN jobs j ON j.purchase_request_id = pr.id
       WHERE pr.status = 'APPROVED' AND j.id IS NULL
       ORDER BY pr.updated_at DESC`,
    );
    return rows;
  },
};
