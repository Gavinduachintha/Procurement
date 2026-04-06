import { requestRepository } from "../repositories/requestRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import { specificationRepository } from "../repositories/specificationRepository.js";
import { ApiError } from "../utils/apiError.js";
import { APPROVER_ROLES, REQUEST_STATUS, USER_ROLES } from "../utils/constants.js";
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

      // Transform payload to use backend field names
      const reviewData = {
        purchaseRequestId: request.id,
        checkerId: user.id,
        reviewedSpecifications:
          payload.reviewedSpecifications ||
          payload.reviewed_specifications ||
          request.technical_specifications,
        reviewNotes:
          payload.reviewNotes || payload.notes || payload.review_notes || "",
        decision: "RETURNED_TO_REQUESTER",
      };

      console.log("📝 Backend: Review data prepared:", reviewData);

      await specificationRepository.createReview(reviewData);

      console.log("✅ Backend: Specification review saved");

      const updated = await requestRepository.updateSpecificationReviewResult(
        request.id,
        reviewData.reviewedSpecifications,
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
        message: `Specifications for ${request.request_id} were reviewed. Please confirm or request modification.`,
      });
      console.log("✅ Backend: Requesting officer notified");

      // Notify all stakeholders (Dean, Registrar, Bursar, Vice Chancellor)
      try {
        console.log("📧 Backend: Notifying stakeholders...");
        const stakeholderRoles = [
          USER_ROLES.DEAN,
          USER_ROLES.REGISTRAR,
          USER_ROLES.BURSAR,
          USER_ROLES.VICE_CHANCELLOR,
        ];

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
      return updated;
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
      const updated = await requestRepository.updateStatus(
        request.id,
        REQUEST_STATUS.APPROVED,
      );

      console.log("✅ Backend: Request status updated to APPROVED");

      await notificationService.notifyUsers([request.requester_id], {
        eventType: "SPEC_CONFIRMED",
        subject: `Specification accepted (${request.request_id})`,
        message: `Request ${request.request_id} is approved and ready for procurement.`,
      });

      await notificationService.notifyByRoles(APPROVER_ROLES, {
        eventType: "REQUEST_APPROVED_VIEW_ONLY",
        subject: `Request available for view (${request.request_id})`,
        message: `Request ${request.request_id} has been approved. You can view request details and notifications (no action required).`,
      });

      await notificationService.notifyByRoles([USER_ROLES.SUPPLY_BRANCH], {
        eventType: "REQUEST_READY_FOR_PROCUREMENT",
        subject: `Request ready for procurement (${request.request_id})`,
        message: `Request ${request.request_id} is approved and ready for procurement workflow.`,
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
