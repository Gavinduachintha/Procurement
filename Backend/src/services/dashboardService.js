import { query } from "../config/db.js";
import { jobRepository } from "../repositories/jobRepository.js";

export const dashboardService = {
  async requester(userId) {
    const { rows } = await query(
      `SELECT status, COUNT(*)::int AS count
       FROM purchase_requests
       WHERE requester_id = $1
       GROUP BY status`,
      [userId],
    );
    return rows;
  },

  async approver(userId) {
    const { rows } = await query(
      `SELECT a.decision, COUNT(*)::int AS count
       FROM approvals a
       WHERE a.approver_id = $1
       GROUP BY a.decision`,
      [userId],
    );
    return rows;
  },

  async supplyBranch() {
    return jobRepository.listBySupplyBranchView();
  },
};
