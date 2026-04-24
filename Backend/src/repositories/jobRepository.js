import { pool, query } from "../config/db.js";
import { buildJobNumber } from "../utils/jobNumber.js";

export const jobRepository = {
  async createWithGeneratedNumber({ purchaseRequestId, procurementMethod }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const year = new Date().getFullYear();
      const lockKey = `${procurementMethod}-${year}`;
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        lockKey,
      ]);

      const nextSerialResult = await client.query(
        `SELECT COALESCE(MAX(serial_number), 0) + 1 AS next_serial
         FROM jobs
         WHERE procurement_method = $1 AND year = $2`,
        [procurementMethod, year],
      );
      const serial = Number(nextSerialResult.rows[0].next_serial);
      const jobNumber = buildJobNumber({
        method: procurementMethod,
        year,
        serial,
      });

      const insertResult = await client.query(
        `INSERT INTO jobs (purchase_request_id, procurement_method, year, serial_number, job_number)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [purchaseRequestId, procurementMethod, year, serial, jobNumber],
      );

      await client.query("COMMIT");
      return insertResult.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async findById(jobId) {
    const { rows } = await query("SELECT * FROM jobs WHERE id = $1", [jobId]);
    return rows[0] || null;
  },

  async findByRequestId(purchaseRequestId) {
    const { rows } = await query(
      "SELECT * FROM jobs WHERE purchase_request_id = $1",
      [purchaseRequestId],
    );
    return rows[0] || null;
  },

  async assignClerk(jobId, clerkId) {
    const { rows } = await query(
      `UPDATE jobs
       SET assigned_clerk_id = $2, status = 'CLERK_ASSIGNED'
       WHERE id = $1
       RETURNING *`,
      [jobId, clerkId],
    );
    return rows[0];
  },

  async setProcurementMethod(jobId, procurementMethod) {
    const { rows } = await query(
      `UPDATE jobs
       SET procurement_method = $2, status = 'METHOD_SELECTED'
       WHERE id = $1
       RETURNING *`,
      [jobId, procurementMethod],
    );
    return rows[0];
  },

  async setSupplierCategory(jobId, category) {
    const { rows } = await query(
      `UPDATE jobs
       SET supplier_category = $2, status = 'CATEGORY_SELECTED'
       WHERE id = $1
       RETURNING *`,
      [jobId, category],
    );
    return rows[0];
  },

  async openSchedule(jobId, submissionDeadline) {
    const { rows } = await query(
      `UPDATE jobs
       SET schedule_status = 'OPEN',
           schedule_created_at = COALESCE(schedule_created_at, NOW()),
           schedule_deadline = $2,
           schedule_frozen_at = NULL,
           status = 'QUOTATION_REQUESTS_GENERATED'
       WHERE id = $1
       RETURNING *`,
      [jobId, submissionDeadline],
    );
    return rows[0] || null;
  },

  async freezeSchedule(jobId) {
    const { rows } = await query(
      `UPDATE jobs
       SET schedule_status = 'FROZEN',
           schedule_frozen_at = NOW(),
           status = 'SCHEDULE_FROZEN'
       WHERE id = $1
       RETURNING *`,
      [jobId],
    );
    return rows[0] || null;
  },

  async updateStatus(jobId, status) {
    const { rows } = await query(
      `UPDATE jobs
       SET status = $2
       WHERE id = $1
       RETURNING *`,
      [jobId, status],
    );
    return rows[0] || null;
  },

  async setCommitteeSummary(jobId, committeeType, totalAmount, status) {
    const { rows } = await query(
      `UPDATE jobs
       SET committee_type = $2,
           total_amount = $3,
           status = $4
       WHERE id = $1
       RETURNING *`,
      [jobId, committeeType, totalAmount, status],
    );
    return rows[0] || null;
  },

  async listBySupplyBranchView() {
    const { rows } = await query(
      `SELECT j.*, pr.request_id, pr.item_name, pr.item_description, pr.technical_specifications,
              pr.item_type, pr.quantity, pr.funding_source, pr.justification,
              pr.required_date, pr.attachments, pr.checked_specifications,
              pr.department, pr.status AS request_status,
              pr.estimated_cost AS request_amount,
              COALESCE(j.total_amount, pr.estimated_cost) AS display_amount,
              COALESCE(ri.request_items, '[]'::json) AS request_items,
              COALESCE(js.selected_suppliers, '[]'::json) AS selected_suppliers,
              u.full_name AS assigned_clerk_name
       FROM jobs j
       JOIN purchase_requests pr ON pr.id = j.purchase_request_id
       LEFT JOIN LATERAL (
         SELECT json_agg(
           json_build_object(
             'id', pri.id,
             'line_no', pri.line_no,
             'item_type', pri.item_type,
             'item_name', pri.item_name,
             'item_description', pri.item_description,
             'technical_specifications', pri.technical_specifications,
             'quantity', pri.quantity,
             'estimated_cost', pri.estimated_cost,
             'funding_source', pri.funding_source,
             'department', pri.department,
             'required_date', pri.required_date
           )
           ORDER BY pri.line_no ASC
         ) AS request_items
         FROM purchase_request_items pri
         WHERE pri.purchase_request_id = pr.id
       ) ri ON TRUE
       LEFT JOIN LATERAL (
         SELECT json_agg(
           json_build_object(
             'id', s.id,
             'name', s.name,
             'email', s.email,
             'category', s.category,
             'quoted_price', jss.quoted_price,
             'quotation_received', jss.quotation_received,
             'submission_date', jss.submission_date,
             'evaluation_result', jss.evaluation_result
           )
           ORDER BY s.name ASC
         ) AS selected_suppliers
         FROM job_suppliers jss
         JOIN suppliers s ON s.id = jss.supplier_id
         WHERE jss.job_id = j.id
       ) js ON TRUE
       LEFT JOIN users u ON u.id = j.assigned_clerk_id
       ORDER BY j.created_at DESC`,
    );
    return rows;
  },

  async listByAssignedClerk(clerkId) {
    const { rows } = await query(
      `SELECT j.*, pr.request_id, pr.item_name, pr.item_description, pr.technical_specifications,
              pr.item_type, pr.quantity, pr.funding_source, pr.justification,
              pr.required_date, pr.attachments, pr.checked_specifications,
              pr.department, pr.status AS request_status,
              pr.estimated_cost AS request_amount,
              COALESCE(j.total_amount, pr.estimated_cost) AS display_amount,
              COALESCE(ri.request_items, '[]'::json) AS request_items,
              COALESCE(js.selected_suppliers, '[]'::json) AS selected_suppliers,
              u.full_name AS assigned_clerk_name
       FROM jobs j
       JOIN purchase_requests pr ON pr.id = j.purchase_request_id
       LEFT JOIN LATERAL (
         SELECT json_agg(
           json_build_object(
             'id', pri.id,
             'line_no', pri.line_no,
             'item_type', pri.item_type,
             'item_name', pri.item_name,
             'item_description', pri.item_description,
             'technical_specifications', pri.technical_specifications,
             'quantity', pri.quantity,
             'estimated_cost', pri.estimated_cost,
             'funding_source', pri.funding_source,
             'department', pri.department,
             'required_date', pri.required_date
           )
           ORDER BY pri.line_no ASC
         ) AS request_items
         FROM purchase_request_items pri
         WHERE pri.purchase_request_id = pr.id
       ) ri ON TRUE
       LEFT JOIN LATERAL (
         SELECT json_agg(
           json_build_object(
             'id', s.id,
             'name', s.name,
             'email', s.email,
             'category', s.category,
             'quoted_price', jss.quoted_price,
             'quotation_received', jss.quotation_received,
             'submission_date', jss.submission_date,
             'evaluation_result', jss.evaluation_result
           )
           ORDER BY s.name ASC
         ) AS selected_suppliers
         FROM job_suppliers jss
         JOIN suppliers s ON s.id = jss.supplier_id
         WHERE jss.job_id = j.id
       ) js ON TRUE
       LEFT JOIN users u ON u.id = j.assigned_clerk_id
       WHERE j.assigned_clerk_id = $1
       ORDER BY j.created_at DESC`,
      [clerkId],
    );
    return rows;
  },

  async listAssignedClerkIdsByMethod(procurementMethod) {
    const { rows } = await query(
      `SELECT DISTINCT assigned_clerk_id
       FROM jobs
       WHERE procurement_method = $1
         AND assigned_clerk_id IS NOT NULL`,
      [procurementMethod],
    );

    return rows
      .map((row) => Number(row.assigned_clerk_id))
      .filter((id) => Number.isFinite(id));
  },
};
