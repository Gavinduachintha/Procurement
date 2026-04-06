import { approvalRepository } from "../repositories/approvalRepository.js";
import { ApiError } from "../utils/apiError.js";
import { APPROVER_ROLES } from "../utils/constants.js";

export const approvalService = {
  async decide(user) {
    if (!APPROVER_ROLES.includes(user.role)) {
      throw new ApiError(403, "Only approval officials can access this area");
    }

    throw new ApiError(
      403,
      "Manual approvals are disabled. Approver roles are view and notification only.",
    );
  },

  async myPending(userId) {
    return approvalRepository.listPendingByApprover(userId);
  },
};
