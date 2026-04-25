import { pool, query } from "../config/db.js";

export const masterProcurementPlanRepository = {
  async createWithGeneratedItemCode(payload) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        "LOCK TABLE master_procurement_plans IN SHARE ROW EXCLUSIVE MODE",
      );

      const serialResult = await client.query(
        `SELECT COALESCE(MAX(serial_no), 0) + 1 AS next_serial
         FROM master_procurement_plans
         WHERE plan_year = $1`,
        [payload.planYear],
      );

      const serialNo = Number(serialResult.rows[0]?.next_serial || 1);
      const itemCode = `${payload.departmentRank}.${payload.procurementCategoryRank}.${payload.procurementMethodRank}.${serialNo}`;

      const { rows } = await client.query(
        `INSERT INTO master_procurement_plans (
           item_code,
           serial_no,
           plan_year,
           department,
           sub_category,
           description,
           procurement_category,
           estimated_cost_mn,
           source_of_financing,
           donor_financier_name,
           procurement_method,
           level_of_authority,
           priority_status,
           current_status,
           commencement_yr1,
           commencement_yr2,
           commencement_yr3,
           completion_yr1,
           completion_yr2,
           completion_yr3,
           contract_period,
           reference_mtbf_corporate_plan,
           remark,
           record_status,
           created_by
         ) VALUES (
           $1, $2, $3, $4, $5,
           $6, $7, $8, $9, $10,
           $11, $12, $13, $14, $15,
           $16, $17, $18, $19, $20,
           $21, $22, $23, $24, $25
         ) RETURNING *`,
        [
          itemCode,
          serialNo,
          payload.planYear,
          payload.department,
          payload.subCategory,
          payload.description,
          payload.procurementCategory,
          payload.estimatedCostMn,
          payload.sourceOfFinancing,
          payload.donorFinancierName,
          payload.procurementMethod,
          payload.levelOfAuthority,
          payload.priorityStatus,
          payload.currentStatus,
          payload.commencementYr1,
          payload.commencementYr2,
          payload.commencementYr3,
          payload.completionYr1,
          payload.completionYr2,
          payload.completionYr3,
          payload.contractPeriod,
          payload.reference,
          payload.remark,
          payload.recordStatus,
          payload.createdBy,
        ],
      );

      await client.query("COMMIT");
      return rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async listByCreator(createdBy) {
    const { rows } = await query(
      `SELECT *
       FROM master_procurement_plans
       WHERE created_by = $1
       ORDER BY created_at DESC`,
      [createdBy],
    );

    return rows;
  },
};
