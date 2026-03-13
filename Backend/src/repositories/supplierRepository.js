import { query } from "../config/db.js";

export const supplierRepository = {
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
    for (const supplierId of supplierIds) {
      await query(
        `INSERT INTO job_suppliers (job_id, supplier_id)
         VALUES ($1, $2)
         ON CONFLICT (job_id, supplier_id) DO NOTHING`,
        [jobId, supplierId],
      );
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
};
