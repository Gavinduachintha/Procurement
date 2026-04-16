import { requestRepository } from "../repositories/requestRepository.js";
import { approvalRepository } from "../repositories/approvalRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import { specificationRepository } from "../repositories/specificationRepository.js";
import { ApiError } from "../utils/apiError.js";
import {
  getApprovalRoleForUnit,
  REQUEST_STATUS,
  USER_ROLES,
} from "../utils/constants.js";
import { notificationService } from "./notificationService.js";

export const specificationService = {
  async reviewSpecification(user, requestId, payload) {
    try {
      console.log("📝 Backend: Specification review initiated");
      console.log("📋 Backend: User:", { id: user.id, role: user.role });
      console.log("📋 Backend: Request ID:", requestId);
      console.log("📋 Backend: Payload:", payload);

      if (
        ![
          USER_ROLES.DIRECTOR_ICT,
          USER_ROLES.MAINTENANCE_ENGINEER,
          USER_ROLES.SPECIFICATION_CHECKER,
        ].includes(user.role)
      ) {
        throw new ApiError(
          403,
          "Only specification checking officers can review specifications",
        );
      }

      const request = await requestRepository.findById(requestId);
      if (!request) {
        throw new ApiError(404, "Request not found");
      }

      if (request.specification_checker_id !== user.id) {
        throw new ApiError(
          403,
          "You are not assigned as the specification checker for this request",
        );
      }

      if (
        ![
          REQUEST_STATUS.SPEC_REVIEW_PENDING,
          REQUEST_STATUS.SPEC_REWORK_REQUESTED,
        ].includes(request.status)
      ) {
        throw new ApiError(
          400,
          "Request is not in a specification review state",
        );
      }

      const requestItems = await requestRepository.listItemsByRequestId(
        request.id,
      );
      if (!requestItems.length) {
        throw new ApiError(400, "Request has no items to review");
      }

      const itemDecisions = Array.isArray(payload?.itemDecisions)
        ? payload.itemDecisions
        : [];

      if (!itemDecisions.length) {
        throw new ApiError(
          400,
          "Item-level decisions are required for specification review",
        );
      }

      const validLineNos = new Set(
        requestItems.map((item) => Number(item.line_no)),
      );
      const normalizedItemDecisions = itemDecisions.map((entry, index) => {
        const lineNo = Number(entry.lineNo ?? entry.line_no);
        const decision = String(entry.decision || "")
          .trim()
          .toUpperCase();
        const message = String(entry.message || "").trim();

        if (!validLineNos.has(lineNo)) {
          throw new ApiError(
            400,
            `Invalid item line number at row #${index + 1}`,
          );
        }

        if (
          !["APPROVED", "REJECTED", "REQUEST_MODIFICATION"].includes(decision)
        ) {
          throw new ApiError(
            400,
            `Invalid decision for item line #${lineNo}. Use APPROVED, REJECTED, or REQUEST_MODIFICATION`,
          );
        }

        if (!message) {
          throw new ApiError(
            400,
            `Message is required for item line #${lineNo}`,
          );
        }

        return { lineNo, decision, message };
      });

      const uniqueLineNos = new Set(
        normalizedItemDecisions.map((entry) => entry.lineNo),
      );
      if (uniqueLineNos.size !== requestItems.length) {
        throw new ApiError(
          400,
          "You must submit a decision and message for each item",
        );
      }

      const decisionsText = normalizedItemDecisions
        .sort((a, b) => a.lineNo - b.lineNo)
        .map(
          (entry) =>
            `Item #${entry.lineNo}: ${entry.decision} - ${entry.message}`,
        )
        .join("\n");

      // Transform payload to use backend field names
      const reviewData = {
        purchaseRequestId: request.id,
        checkerId: user.id,
        reviewedSpecifications:
          payload.reviewedSpecifications ||
          payload.reviewed_specifications ||
          decisionsText,
        reviewNotes:
          payload.reviewNotes ||
          payload.notes ||
          payload.review_notes ||
          decisionsText,
        decision: "RETURNED_TO_REQUESTER",
      };

      console.log("📝 Backend: Review data prepared:", reviewData);

      await specificationRepository.createReview(reviewData);

      console.log("✅ Backend: Specification review saved");

      const updated = await requestRepository.updateSpecificationReviewResult(
        request.id,
        decisionsText,
        REQUEST_STATUS.SPEC_RETURNED_TO_REQUESTER,
      );

      console.log(
        "✅ Backend: Request status updated to SPEC_RETURNED_TO_REQUESTER",
      );

      // Notify Requesting Officer
      console.log("📧 Backend: Notifying requesting officer...");
      await notificationService.notifyUsers([request.requester_id], {
        eventType: "SPEC_REVIEWED",
        subject: `Specification reviewed (${request.request_id})`,
        message: `Item-level specification decisions for ${request.request_id}:\n${decisionsText}\n\nPlease confirm or request modification.`,
      });
      console.log("✅ Backend: Requesting officer notified");

      // Notify final approval stakeholders (Dean / Vice Chancellor)
      try {
        console.log("📧 Backend: Notifying stakeholders...");
        const stakeholderRoles = [USER_ROLES.DEAN, USER_ROLES.VICE_CHANCELLOR];

        // Get users for each stakeholder role
        const stakeholderResults = await Promise.all(
          stakeholderRoles.map((role) => {
            console.log("🔍 Backend: Looking for role:", role);
            return userRepository.findByRole(role).catch((err) => {
              console.error(
                "❌ Backend: Error finding role:",
                role,
                err.message,
              );
              return [];
            });
          }),
        );
        const stakeholders = stakeholderResults.flat();
        console.log("✅ Backend: Found", stakeholders.length, "stakeholders");

        if (stakeholders && stakeholders.length > 0) {
          const stakeholderIds = stakeholders.map((s) => s.id);
          console.log("📧 Backend: Notifying stakeholder IDs:", stakeholderIds);
          await notificationService.notifyUsers(stakeholderIds, {
            eventType: "REQUEST_WAITING_REQUESTER_CONFIRMATION",
            subject: `Requester confirmation pending (${request.request_id})`,
            message: `Request ${request.request_id} is waiting for requester confirmation after specification review.`,
          });
          console.log("✅ Backend: Stakeholders notified");
        }

        // Notify Supply Branch
        console.log("📧 Backend: Notifying supply branch...");
        const supplyBranch = await userRepository
          .findByRole(USER_ROLES.SUPPLY_BRANCH)
          .catch((err) => {
            console.error(
              "❌ Backend: Error finding supply branch:",
              err.message,
            );
            return [];
          });

        if (supplyBranch && supplyBranch.length > 0) {
          const supplyBranchIds = supplyBranch.map((s) => s.id);
          console.log(
            "📧 Backend: Notifying supply branch IDs:",
            supplyBranchIds,
          );
          await notificationService.notifyUsers(supplyBranchIds, {
            eventType: "REQUEST_IN_SPEC_CONFIRMATION",
            subject: `Request not yet ready for procurement (${request.request_id})`,
            message: `Request ${request.request_id} completed specification review and now waits for requester confirmation.`,
          });
          console.log("✅ Backend: Supply branch notified");
        }
      } catch (err) {
        console.error("⚠️ Backend: Error notifying stakeholders:", err.message);
        // Don't fail the request if notifications fail
      }

      console.log("✅ Backend: Specification review complete");
      return {
        ...updated,
        itemDecisions: normalizedItemDecisions,
      };
    } catch (err) {
      console.error("❌ Backend: Specification review error:", {
        message: err.message,
        stack: err.stack,
      });
      throw err;
    }
  },

  async requesterConfirmation(user, requestId, payload) {
    console.log("📝 Backend: Requester confirmation initiated");
    console.log("📋 Backend: User:", { id: user.id, role: user.role });
    console.log("📋 Backend: Request ID:", requestId);
    console.log("📋 Backend: Payload:", payload);

    if (user.role !== USER_ROLES.REQUESTING_OFFICER) {
      throw new ApiError(
        403,
        "Only requesting officers can confirm reviewed specifications",
      );
    }

    const request = await requestRepository.findById(requestId);
    console.log("📋 Backend: Found request:", {
      id: request?.id,
      requestId: request?.request_id,
      status: request?.status,
      requester_id: request?.requester_id,
    });

    if (!request) {
      throw new ApiError(404, "Request not found");
    }

    if (request.requester_id !== user.id) {
      throw new ApiError(403, "You can only act on your own requests");
    }

    if (request.status !== REQUEST_STATUS.SPEC_RETURNED_TO_REQUESTER) {
      console.log(
        "❌ Backend: Request status mismatch. Expected:",
        REQUEST_STATUS.SPEC_RETURNED_TO_REQUESTER,
        "Got:",
        request.status,
      );
      throw new ApiError(
        400,
        "Request is not waiting for requester confirmation",
      );
    }

    const action = payload.action;
    console.log("📋 Backend: Action:", action);

    if (action === "ACCEPT") {
      const approverRole = getApprovalRoleForUnit(request.department);

      const updated = await requestRepository.updateStatus(
        request.id,
        REQUEST_STATUS.APPROVAL_PENDING,
      );

      console.log("✅ Backend: Request status updated to APPROVAL_PENDING");

      await notificationService.notifyUsers([request.requester_id], {
        eventType: "SPEC_CONFIRMED",
        subject: `Specification accepted (${request.request_id})`,
        message: `Request ${request.request_id} is now pending final approval by ${approverRole}.`,
      });

      const approvalSlots = await approvalRepository.listByRequest(request.id);
      const targetedApproverIds = approvalSlots
        .filter(
          (slot) =>
            slot.approver_role === approverRole && slot.decision === "PENDING",
        )
        .map((slot) => slot.approver_id);

      await notificationService.notifyUsers(targetedApproverIds, {
        eventType: "REQUEST_APPROVAL_REQUIRED",
        subject: `Approval required (${request.request_id})`,
        message: `Request ${request.request_id} is awaiting your final approval for ${request.department}.`,
      });

      return updated;
    }

    if (action === "REQUEST_MODIFICATION") {
      const updated = await requestRepository.updateStatus(
        request.id,
        REQUEST_STATUS.SPEC_REWORK_REQUESTED,
      );

      console.log(
        "✅ Backend: Request status updated to SPEC_REWORK_REQUESTED",
      );

      await notificationService.notifyUsers(
        [request.specification_checker_id],
        {
          eventType: "SPEC_REWORK_REQUESTED",
          subject: `Specification rework requested (${request.request_id})`,
          message: `Requesting officer requested changes for ${request.request_id}.`,
        },
      );

      return updated;
    }

    throw new ApiError(
      400,
      "Invalid action. Use ACCEPT or REQUEST_MODIFICATION",
    );
  },
};
