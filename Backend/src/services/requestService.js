import { requestRepository } from "../repositories/requestRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import { approvalRepository } from "../repositories/approvalRepository.js";
import { ApiError } from "../utils/apiError.js";
import { buildRequestNumber } from "../utils/jobNumber.js";
import {
  APPROVER_ROLES,
  REQUEST_STATUS,
  USER_ROLES,
} from "../utils/constants.js";
import { notificationService } from "./notificationService.js";

export const requestService = {
  async submitRequest(user, payload) {
    if (user.role !== USER_ROLES.REQUESTING_OFFICER) {
      throw new ApiError(403, "Only requesting officers can submit requests");
    }

    console.log("📝 Backend: Request submission initiated");
    console.log("📋 Backend: Received payload:", payload);

    // Transform snake_case to camelCase for consistency with repository
    const transformedPayload = {
      requesterId: user.id,
      itemName: payload.item_name || payload.itemName,
      itemDescription: payload.item_description || payload.itemDescription,
      technicalSpecifications:
        payload.technical_specifications || payload.technicalSpecifications,
      itemType: payload.itemType || payload.item_type,
      quantity: payload.quantity,
      estimatedCost: payload.estimated_cost || payload.estimatedCost,
      fundingSource: payload.funding_source || payload.fundingSource,
      justification: payload.justification,
      department: payload.department || user.department || "General",
      requiredDate: payload.required_date || payload.requiredDate,
      attachments: payload.attachments || [],
      status: "SUBMITTED",
    };

    console.log("✅ Backend: Transformed payload:", transformedPayload);

    const rawItemType = transformedPayload.itemType;
    const normalizedItemType = String(rawItemType || "")
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "_");

    console.log(
      "🔄 Backend: ItemType normalized:",
      rawItemType,
      "->",
      normalizedItemType,
    );

    if (!["IT", "NON_IT"].includes(normalizedItemType)) {
      throw new ApiError(400, "Invalid item type. Use IT or NON_IT");
    }

    transformedPayload.itemType = normalizedItemType;

    const checkerRole =
      normalizedItemType === "IT"
        ? USER_ROLES.DIRECTOR_ICT
        : USER_ROLES.MAINTENANCE_ENGINEER;

    console.log("🔍 Backend: Looking for checker with role:", checkerRole);

    let checkers = await userRepository.findByRole(checkerRole);
    if (!checkers.length) {
      checkers = await userRepository.findByRole(
        USER_ROLES.SPECIFICATION_CHECKER,
      );
    }

    if (!checkers.length) {
      throw new ApiError(
        400,
        `No available specification checker for role ${checkerRole}`,
      );
    }

    console.log(
      "✅ Backend: Found",
      checkers.length,
      "specification checker(s)",
    );

    const approvers = (
      await Promise.all(
        APPROVER_ROLES.map((role) => userRepository.findByRole(role)),
      )
    ).flat();

    console.log("✅ Backend: Found", approvers.length, "approver(s)");
    console.log("💾 Backend: Creating purchase request with data:", {
      itemName: transformedPayload.itemName,
      quantity: transformedPayload.quantity,
      estimatedCost: transformedPayload.estimatedCost,
      requiredDate: transformedPayload.requiredDate,
    });

    const created = await requestRepository.create({
      ...transformedPayload,
      itemType: normalizedItemType,
    });

    console.log("✅ Backend: Request created with ID:", created.id);

    const year = new Date(created.created_at).getFullYear();
    const requestNumber = buildRequestNumber({ year, serial: created.id });
    const saved = await requestRepository.updateRequestId(
      created.id,
      requestNumber,
    );

    console.log("✅ Backend: Request number assigned:", requestNumber);

    const assigned = await requestRepository.assignSpecificationChecker(
      saved.id,
      checkers[0].id,
      REQUEST_STATUS.SPEC_REVIEW_PENDING,
    );

    console.log("✅ Backend: Specification checker assigned:", checkers[0].id);

    await approvalRepository.ensureApprovalSlots(assigned.id, approvers);

    console.log(
      "✅ Backend: Approval slots created for",
      approvers.length,
      "approvers",
    );

    await notificationService.notifyUsers(
      [
        user.id,
        assigned.specification_checker_id,
        ...approvers.map((a) => a.id),
      ],
      {
        eventType: "REQUEST_SUBMITTED",
        subject: `Purchase request submitted (${assigned.request_id})`,
        message: `Request ${assigned.request_id} has been submitted and sent for specification checking.`,
      },
    );

    console.log(
      "✅ Backend: Request submission complete, request ID:",
      assigned.request_id,
    );

    return assigned;
  },

  async myRequests(userId) {
    return requestRepository.listByRequesterId(userId);
  },

  async checkerAssignedRequests(checkerId) {
    return requestRepository.listAssignedForSpecificationChecker(checkerId);
  },

  async getRequest(requestId) {
    const request = await requestRepository.findById(requestId);
    if (!request) {
      throw new ApiError(404, "Request not found");
    }
    return request;
  },

  async approvedRequestsWithoutJobs() {
    return requestRepository.listApprovedWithoutJobs();
  },
};
