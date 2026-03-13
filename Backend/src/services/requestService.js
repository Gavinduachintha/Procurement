import { requestRepository } from "../repositories/requestRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import { approvalRepository } from "../repositories/approvalRepository.js";
import { ApiError } from "../utils/apiError.js";
import { buildRequestNumber } from "../utils/jobNumber.js";
import { APPROVER_ROLES, REQUEST_STATUS, USER_ROLES } from "../utils/constants.js";
import { notificationService } from "./notificationService.js";

export const requestService = {
  async submitRequest(user, payload) {
    if (user.role !== USER_ROLES.REQUESTING_OFFICER) {
      throw new ApiError(403, "Only requesting officers can submit requests");
    }

    const created = await requestRepository.create({
      ...payload,
      requesterId: user.id,
      status: REQUEST_STATUS.SUBMITTED,
      department: payload.department || user.department || "General",
    });

    const year = new Date(created.created_at).getFullYear();
    const requestNumber = buildRequestNumber({ year, serial: created.id });
    const saved = await requestRepository.updateRequestId(created.id, requestNumber);

    const checkerRole = payload.itemType === "IT" ? USER_ROLES.DIRECTOR_ICT : USER_ROLES.MAINTENANCE_ENGINEER;
    const checkers = await userRepository.findByRole(checkerRole);
    if (!checkers.length) {
      throw new ApiError(400, `No available specification checker for role ${checkerRole}`);
    }

    const assigned = await requestRepository.assignSpecificationChecker(
      saved.id,
      checkers[0].id,
      REQUEST_STATUS.SPEC_REVIEW_PENDING,
    );

    const approvers = (
      await Promise.all(APPROVER_ROLES.map((role) => userRepository.findByRole(role)))
    ).flat();
    await approvalRepository.ensureApprovalSlots(assigned.id, approvers);

    await notificationService.notifyUsers(
      [user.id, assigned.specification_checker_id, ...approvers.map((a) => a.id)],
      {
        eventType: "REQUEST_SUBMITTED",
        subject: `Purchase request submitted (${assigned.request_id})`,
        message: `Request ${assigned.request_id} has been submitted and sent for specification checking.`,
      },
    );

    return assigned;
  },

  async myRequests(userId) {
    return requestRepository.listByRequesterId(userId);
  },

  async getRequest(requestId) {
    const request = await requestRepository.findById(requestId);
    if (!request) {
      throw new ApiError(404, "Request not found");
    }
    return request;
  },
};
