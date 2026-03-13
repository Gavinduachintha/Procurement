import { approvalRepository } from "../repositories/approvalRepository.js";
import { requestRepository } from "../repositories/requestRepository.js";
import { ApiError } from "../utils/apiError.js";
import { APPROVER_ROLES, REQUEST_STATUS } from "../utils/constants.js";
import { notificationService } from "./notificationService.js";

export const approvalService = {
  async decide(user, requestId, payload) {
    if (!APPROVER_ROLES.includes(user.role)) {
      throw new ApiError(403, "Only approval officials can make this decision");
    }

    const request = await requestRepository.findById(requestId);
    if (!request) {
      throw new ApiError(404, "Request not found");
    }

    if (![REQUEST_STATUS.APPROVAL_PENDING, REQUEST_STATUS.CLARIFICATION_REQUESTED].includes(request.status)) {
      throw new ApiError(400, "Request is not in approval state");
    }

    const decision = payload.decision;
    if (!["APPROVED", "REJECTED", "CLARIFICATION_REQUESTED"].includes(decision)) {
      throw new ApiError(400, "Invalid decision");
    }

    const updatedApproval = await approvalRepository.decide({
      purchaseRequestId: request.id,
      approverId: user.id,
      decision,
      comments: payload.comments,
    });

    if (!updatedApproval) {
      throw new ApiError(404, "Approval slot not found for this approver");
    }

    const summary = await approvalRepository.getApprovalSummary(request.id);

    let nextStatus = REQUEST_STATUS.APPROVAL_PENDING;

    if (Number(summary.rejected_count) > 0) {
      nextStatus = REQUEST_STATUS.REJECTED;
    } else if (Number(summary.clarification_count) > 0) {
      nextStatus = REQUEST_STATUS.CLARIFICATION_REQUESTED;
    } else if (Number(summary.approved_count) === Number(summary.total_count)) {
      nextStatus = REQUEST_STATUS.APPROVED;
    }

    const updatedRequest = await requestRepository.updateStatus(request.id, nextStatus);

    await notificationService.notifyUsers([request.requester_id], {
      eventType: "APPROVAL_UPDATED",
      subject: `Approval update (${request.request_id})`,
      message: `Approval decision recorded for ${request.request_id}. Current status: ${nextStatus}.`,
    });

    return {
      request: updatedRequest,
      approval: updatedApproval,
      summary,
    };
  },

  async myPending(userId) {
    return approvalRepository.listPendingByApprover(userId);
  },
};
