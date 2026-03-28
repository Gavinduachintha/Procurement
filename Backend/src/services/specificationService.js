import { requestRepository } from "../repositories/requestRepository.js";
import { specificationRepository } from "../repositories/specificationRepository.js";
import { ApiError } from "../utils/apiError.js";
import { REQUEST_STATUS, USER_ROLES } from "../utils/constants.js";
import { notificationService } from "./notificationService.js";

export const specificationService = {
  async reviewSpecification(user, requestId, payload) {
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
      throw new ApiError(400, "Request is not in a specification review state");
    }

    await specificationRepository.createReview({
      purchaseRequestId: request.id,
      checkerId: user.id,
      reviewedSpecifications: payload.reviewedSpecifications,
      reviewNotes: payload.reviewNotes,
      decision: "RETURNED_TO_REQUESTER",
    });

    const updated = await requestRepository.updateSpecificationReviewResult(
      request.id,
      payload.reviewedSpecifications,
      REQUEST_STATUS.SPEC_RETURNED_TO_REQUESTER,
    );

    await notificationService.notifyUsers([request.requester_id], {
      eventType: "SPEC_REVIEW_COMPLETED",
      subject: `Specification reviewed (${request.request_id})`,
      message: `Specification review completed for ${request.request_id}. Requesting officer confirmation is required.`,
    });

    return updated;
  },

  async requesterConfirmation(user, requestId, payload) {
    if (user.role !== USER_ROLES.REQUESTING_OFFICER) {
      throw new ApiError(
        403,
        "Only requesting officers can confirm reviewed specifications",
      );
    }

    const request = await requestRepository.findById(requestId);
    if (!request) {
      throw new ApiError(404, "Request not found");
    }

    if (request.requester_id !== user.id) {
      throw new ApiError(403, "You can only act on your own requests");
    }

    if (request.status !== REQUEST_STATUS.SPEC_RETURNED_TO_REQUESTER) {
      throw new ApiError(
        400,
        "Request is not waiting for requester confirmation",
      );
    }

    const action = payload.action;
    if (action === "ACCEPT") {
      const updated = await requestRepository.updateStatus(
        request.id,
        REQUEST_STATUS.APPROVAL_PENDING,
      );

      await notificationService.notifyUsers([request.requester_id], {
        eventType: "SPEC_CONFIRMED",
        subject: `Specification accepted (${request.request_id})`,
        message: `Request ${request.request_id} moved to administrative approvals.`,
      });

      return updated;
    }

    if (action === "REQUEST_MODIFICATION") {
      const updated = await requestRepository.updateStatus(
        request.id,
        REQUEST_STATUS.SPEC_REWORK_REQUESTED,
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
