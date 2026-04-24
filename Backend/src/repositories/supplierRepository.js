import { pool, query } from "../config/db.js";

export const supplierRepository = {
  async create({ name, email, category }) {
    const { rows } = await query(
      `INSERT INTO suppliers (name, email, category)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, category, created_at`,
      [name, email, category],
    );
    return rows[0];
  },

  async listAll() {
    const { rows } = await query(
      `SELECT id, name, email, category, created_at
       FROM suppliers
       ORDER BY created_at DESC`,
    );
    return rows;
  },

  async listByCategory(category) {
    const { rows } = await query(
      `SELECT id, name, email, category, created_at
       FROM suppliers
       WHERE category = $1
       ORDER BY name ASC`,
      [category],
    );
    return rows;
  },

  async attachSuppliers(jobId, supplierIds) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `DELETE FROM quotation_requests
         WHERE job_id = $1
           AND NOT (supplier_id = ANY($2::bigint[]))`,
        [jobId, supplierIds],
      );

      await client.query(
        `DELETE FROM job_suppliers
         WHERE job_id = $1
           AND NOT (supplier_id = ANY($2::bigint[]))`,
        [jobId, supplierIds],
      );

      for (const supplierId of supplierIds) {
        await client.query(
          `INSERT INTO job_suppliers (job_id, supplier_id)
           VALUES ($1, $2)
           ON CONFLICT (job_id, supplier_id) DO NOTHING`,
          [jobId, supplierId],
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const { rows } = await query(
      `SELECT js.id, js.job_id, s.id AS supplier_id, s.name, s.email, s.category,
              js.quotation_received, js.quoted_price, js.submission_date, js.evaluation_result
       FROM job_suppliers js
       JOIN suppliers s ON s.id = js.supplier_id
       WHERE js.job_id = $1
       ORDER BY s.name ASC`,
      [jobId],
    );
    return rows;
  },

  async listSelectedForJob(jobId) {
    const { rows } = await query(
      `SELECT s.id, s.name, s.email, s.category,
              js.quotation_received, js.quoted_price, js.submission_date, js.evaluation_result
       FROM job_suppliers js
       JOIN suppliers s ON s.id = js.supplier_id
       WHERE js.job_id = $1
       ORDER BY s.name ASC`,
      [jobId],
    );
    return rows;
  },

  async createQuotationLetters(jobId, submissionDeadline, letterContent) {
    const suppliers = await this.listSelectedForJob(jobId);

    for (const supplier of suppliers) {
      await query(
        `INSERT INTO quotation_requests (job_id, supplier_id, letter_content, submission_deadline)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (job_id, supplier_id)
         DO UPDATE SET letter_content = EXCLUDED.letter_content,
                       submission_deadline = EXCLUDED.submission_deadline,
                       sent_at = NOW()`,
        [jobId, supplier.id, letterContent, submissionDeadline],
      );
    }

    return suppliers;
  },

  async updateJobSupplierQuotation(jobId, supplierId, payload) {
    const { quotationReceived, quotedPrice, submissionDate, evaluationResult } =
      payload;

    const { rows } = await query(
      `UPDATE job_suppliers
       SET quotation_received = $3,
           quoted_price = $4,
           submission_date = $5,
           evaluation_result = $6
       WHERE job_id = $1 AND supplier_id = $2
       RETURNING id, job_id, supplier_id, quotation_received, quoted_price, submission_date, evaluation_result`,
      [jobId, supplierId, quotationReceived, quotedPrice, submissionDate, evaluationResult],
    );

    return rows[0] || null;
  },
};
