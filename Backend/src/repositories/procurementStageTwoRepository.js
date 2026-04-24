import { pool, query } from "../config/db.js";

export const procurementStageTwoRepository = {
  async listTecRecommendationsByJob(jobId) {
    const { rows } = await query(
      `SELECT tr.id,
              tr.job_id,
              tr.supplier_id,
              s.name AS supplier_name,
              tr.item_name,
              tr.item_description,
              tr.quantity,
              tr.unit_price,
              tr.decision_status,
              tr.is_recommended,
              tr.remarks,
              tr.created_by,
              tr.created_at
       FROM tec_recommendations tr
       JOIN suppliers s ON s.id = tr.supplier_id
       WHERE tr.job_id = $1
       ORDER BY tr.created_at ASC, tr.id ASC`,
      [jobId],
    );
    return rows;
  },

  async replaceTecRecommendations(jobId, recommendations, createdBy) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query("DELETE FROM tec_recommendations WHERE job_id = $1", [
        jobId,
      ]);

      for (const rec of recommendations) {
        await client.query(
          `INSERT INTO tec_recommendations (
             job_id,
             supplier_id,
             item_name,
             item_description,
             quantity,
             unit_price,
             decision_status,
             is_recommended,
             remarks,
             created_by
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            jobId,
            rec.supplierId,
            rec.itemName,
            rec.itemDescription || null,
            rec.quantity,
            rec.unitPrice,
            rec.decisionStatus,
            rec.isRecommended,
            rec.remarks || null,
            createdBy,
          ],
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return this.listTecRecommendationsByJob(jobId);
  },

  async upsertCommitteeReport({
    jobId,
    reportData,
    totalAmount,
    committeeType,
    generatedBy,
  }) {
    const { rows } = await query(
      `INSERT INTO committee_reports (
         job_id,
         report_data,
         total_amount,
         committee_type,
         generated_by
       ) VALUES ($1, $2::jsonb, $3, $4, $5)
       ON CONFLICT (job_id)
       DO UPDATE SET
         report_data = EXCLUDED.report_data,
         total_amount = EXCLUDED.total_amount,
         committee_type = EXCLUDED.committee_type,
         generated_by = EXCLUDED.generated_by,
         generated_at = NOW()
       RETURNING *`,
      [
        jobId,
        JSON.stringify(reportData),
        totalAmount,
        committeeType,
        generatedBy,
      ],
    );

    return rows[0] || null;
  },

  async getCommitteeReportByJob(jobId) {
    const { rows } = await query(
      `SELECT *
       FROM committee_reports
       WHERE job_id = $1`,
      [jobId],
    );
    return rows[0] || null;
  },
};
