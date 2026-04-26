import { approvalRepository } from "../repositories/approvalRepository.js";
import { requestRepository } from "../repositories/requestRepository.js";
import { ApiError } from "../utils/apiError.js";
import { REQUEST_STATUS, USER_ROLES } from "../utils/constants.js";
import { notificationService } from "./notificationService.js";

const FINAL_APPROVER_ROLES = [USER_ROLES.DEAN, USER_ROLES.VICE_CHANCELLOR];
const APPROVAL_DECISIONS = ["APPROVED", "REJECTED", "CLARIFICATION_REQUESTED"];

export const approvalService = {
  async decide(user, requestId, payload) {
    if (!FINAL_APPROVER_ROLES.includes(user.role)) {
      throw new ApiError(
        403,
        "Only Dean or Vice Chancellor can submit final approval decisions",
      );
    }

    const decision = String(payload?.decision || "")
      .trim()
      .toUpperCase();
    const comments = String(payload?.comments || "").trim();

    if (!APPROVAL_DECISIONS.includes(decision)) {
      throw new ApiError(
        400,
        "Invalid decision. Use APPROVED, REJECTED, or CLARIFICATION_REQUESTED",
      );
    }

    const request = await requestRepository.findById(requestId);
    if (!request) {
      throw new ApiError(404, "Request not found");
    }

    const approverSlot = await approvalRepository.findByRequestAndApprover(
      requestId,
      user.id,
    );

    if (!approverSlot) {
      throw new ApiError(
        403,
        "This request is not assigned to you for approval",
      );
    }

    if (approverSlot.decision !== "PENDING") {
      throw new ApiError(
        409,
        `You have already submitted a final decision for this request (${approverSlot.decision}).`,
      );
    }

    if (
      ![
        REQUEST_STATUS.APPROVAL_PENDING,
        REQUEST_STATUS.CLARIFICATION_REQUESTED,
      ].includes(request.status)
    ) {
      if (
        [REQUEST_STATUS.APPROVED, REQUEST_STATUS.REJECTED].includes(
          request.status,
        )
      ) {
        throw new ApiError(
          409,
          `Final decision is already completed for this request (current status: ${request.status}).`,
        );
      }

      throw new ApiError(
        400,
        `Request is currently in ${request.status}. Final approval is available only after the Requesting Officer accepts checked specifications.`,
      );
    }

    if (decision === "APPROVED") {
      const budgetSnapshot =
        await approvalRepository.getBudgetSnapshotForRequest(requestId);

      if (!budgetSnapshot) {
        throw new ApiError(404, "Unable to verify department allocation");
      }

      if (Number(budgetSnapshot.remaining_after_current_approval_amount) < 0) {
        throw new ApiError(
          400,
          "Approval exceeds department allocation. Remaining budget is insufficient for this request.",
        );
      }
    }

    const pendingForUser = await approvalRepository.listPendingByApprover(
      user.id,
    );
    const assigned = pendingForUser.some(
      (row) => Number(row.id) === Number(requestId),
    );
    if (!assigned) {
      throw new ApiError(
        403,
        "This request is not assigned to you for approval",
      );
    }

    const approval = await approvalRepository.decide({
      purchaseRequestId: requestId,
      approverId: user.id,
      decision,
      comments,
    });

    if (!approval) {
      throw new ApiError(404, "Approval slot not found for this approver");
    }

    const summary = await approvalRepository.getApprovalSummary(requestId);
    const rejectedCount = Number(summary?.rejected_count || 0);
    const clarificationCount = Number(summary?.clarification_count || 0);
    const pendingCount = Number(summary?.pending_count || 0);

    let nextStatus = REQUEST_STATUS.APPROVAL_PENDING;
    if (rejectedCount > 0) {
      nextStatus = REQUEST_STATUS.REJECTED;
    } else if (clarificationCount > 0) {
      nextStatus = REQUEST_STATUS.CLARIFICATION_REQUESTED;
    } else if (pendingCount === 0) {
      nextStatus = REQUEST_STATUS.APPROVED;
    }

    const updatedRequest = await requestRepository.updateStatus(
      requestId,
      nextStatus,
    );

    await notificationService.notifyUsers([request.requester_id], {
      eventType: "FINAL_APPROVAL_DECISION",
      subject: `Final approval decision (${request.request_id})`,
      message: `Your request ${request.request_id} was marked ${nextStatus} by ${user.role}.${comments ? ` Comments: ${comments}` : ""}`,
    });

    if (nextStatus === REQUEST_STATUS.APPROVED) {
      await notificationService.notifyByRoles([USER_ROLES.SUPPLY_BRANCH], {
        eventType: "REQUEST_READY_FOR_PROCUREMENT",
        subject: `Request ready for procurement (${request.request_id})`,
        message: `Request ${request.request_id} is fully approved and ready for procurement workflow.`,
      });
    }

    return {
      request: updatedRequest,
      approval,
      summary,
    };
  },

  async myPending(userId) {
    return approvalRepository.listPendingByApprover(userId);
  },

  async myAll(userId) {
    return approvalRepository.listAllByApprover(userId);
  },
};
