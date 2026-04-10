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

    const normalizeItemType = (value) =>
      String(value || "")
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_");

    const itemRows = Array.isArray(payload.items)
      ? payload.items
      : [
          {
            item_type: payload.item_type || payload.itemType,
            item_name: payload.item_name || payload.itemName,
            item_description:
              payload.item_description || payload.itemDescription || "",
            technical_specifications:
              payload.technical_specifications ||
              payload.technicalSpecifications,
            quantity: payload.quantity,
            estimated_cost: payload.estimated_cost || payload.estimatedCost,
          },
        ];

    if (!itemRows.length) {
      throw new ApiError(400, "At least one item is required");
    }

    const normalizedItems = itemRows.map((item, index) => {
      const itemType = normalizeItemType(item.item_type || item.itemType);
      const itemName = String(item.item_name || item.itemName || "").trim();
      const itemDescription = String(
        item.item_description || item.itemDescription || "",
      ).trim();
      const technicalSpecifications = String(
        item.technical_specifications || item.technicalSpecifications || "",
      ).trim();
      const quantity = Number(item.quantity);
      const estimatedCost = Number(item.estimated_cost || item.estimatedCost);

      if (!["IT", "NON_IT"].includes(itemType)) {
        throw new ApiError(
          400,
          `Invalid item type for item #${index + 1}. Use IT or NON_IT`,
        );
      }

      if (!itemName) {
        throw new ApiError(400, `Item name is required for item #${index + 1}`);
      }

      if (!technicalSpecifications) {
        throw new ApiError(
          400,
          `Technical specifications are required for item #${index + 1}`,
        );
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new ApiError(
          400,
          `Quantity must be greater than zero for item #${index + 1}`,
        );
      }

      if (!Number.isFinite(estimatedCost) || estimatedCost < 0) {
        throw new ApiError(
          400,
          `Estimated cost must be zero or positive for item #${index + 1}`,
        );
      }

      return {
        itemType,
        itemName,
        itemDescription,
        technicalSpecifications,
        quantity,
        estimatedCost,
      };
    });

    const groupedByType = normalizedItems.reduce((acc, item) => {
      if (!acc[item.itemType]) {
        acc[item.itemType] = [];
      }
      acc[item.itemType].push(item);
      return acc;
    }, {});

    const approvers = (
      await Promise.all(
        APPROVER_ROLES.map((role) => userRepository.findByRole(role)),
      )
    ).flat();

    console.log("✅ Backend: Found", approvers.length, "approver(s)");

    const createdRequests = [];

    for (const [itemType, itemsForType] of Object.entries(groupedByType)) {
      const checkerRole =
        itemType === "IT"
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

      const totalQuantity = itemsForType.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      const totalEstimatedCost = Number(
        itemsForType
          .reduce((sum, item) => sum + item.estimatedCost, 0)
          .toFixed(2),
      );
      const firstItem = itemsForType[0];

      const transformedPayload = {
        requesterId: user.id,
        itemName:
          itemsForType.length === 1
            ? firstItem.itemName
            : `${firstItem.itemName} (+${itemsForType.length - 1} more items)`,
        itemDescription:
          itemsForType.length === 1
            ? firstItem.itemDescription || null
            : `Multi-item ${itemType} request containing ${itemsForType.length} items`,
        technicalSpecifications: itemsForType
          .map(
            (item, index) =>
              `${index + 1}. ${item.itemName}: ${item.technicalSpecifications}`,
          )
          .join("\n"),
        itemType,
        quantity: totalQuantity,
        estimatedCost: totalEstimatedCost,
        fundingSource: payload.funding_source || payload.fundingSource,
        justification: payload.justification,
        department: payload.department || user.department || "General",
        requiredDate: payload.required_date || payload.requiredDate,
        attachments: payload.attachments || [],
        items: itemsForType,
        status: "SUBMITTED",
      };

      console.log("💾 Backend: Creating purchase request with data:", {
        itemType,
        itemName: transformedPayload.itemName,
        quantity: transformedPayload.quantity,
        estimatedCost: transformedPayload.estimatedCost,
      });

      const created = await requestRepository.create(transformedPayload);

      const year = new Date(created.created_at).getFullYear();
      const requestNumber = buildRequestNumber({ year, serial: created.id });
      const saved = await requestRepository.updateRequestId(
        created.id,
        requestNumber,
      );

      const assigned = await requestRepository.assignSpecificationChecker(
        saved.id,
        checkers[0].id,
        REQUEST_STATUS.SPEC_REVIEW_PENDING,
      );

      await approvalRepository.ensureApprovalSlots(assigned.id, approvers);

      await notificationService.notifyUsers(
        [
          user.id,
          assigned.specification_checker_id,
          ...approvers.map((a) => a.id),
        ],
        {
          eventType: "REQUEST_SUBMITTED",
          subject: `Purchase request submitted (${assigned.request_id})`,
          message: `Request ${assigned.request_id} (${itemType}) has been submitted and sent for specification checking.`,
        },
      );

      createdRequests.push(assigned);
    }

    console.log(
      "✅ Backend: Request submission complete. Created requests:",
      createdRequests.map((request) => request.request_id),
    );

    if (createdRequests.length === 1) {
      return createdRequests[0];
    }

    return {
      splitByItemType: true,
      requests: createdRequests,
    };
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

    const items = await requestRepository.listItemsByRequestId(request.id);
    return {
      ...request,
      items,
    };
  },

  async approvedRequestsWithoutJobs() {
    return requestRepository.listApprovedWithoutJobs();
  },
};
