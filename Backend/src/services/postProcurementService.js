import { postProcurementRepository } from "../repositories/postProcurementRepository.js";
import { ApiError } from "../utils/apiError.js";
import {
  APPROVER_ROLES,
  COMMITTEE_DECISION,
  COMMITTEE_TYPE,
  JOB_STATUS,
  TEC_DECISION_STATUS,
  USER_ROLES,
} from "../utils/constants.js";
import { notificationService } from "./notificationService.js";

const ensureClerkAccess = (user, job) => {
  if (
    ![USER_ROLES.SUBJECT_CLERK, USER_ROLES.SUPPLY_BRANCH].includes(user.role)
  ) {
    throw new ApiError(
      403,
      "Only subject clerk or supply branch can perform this action",
    );
  }

  if (
    user.role === USER_ROLES.SUBJECT_CLERK &&
    Number(job.assigned_clerk_id) !== Number(user.id)
  ) {
    throw new ApiError(403, "You are not assigned to this job");
  }
};

const mapCommitteeDecisionToJobStatus = (decision) => {
  if (decision === COMMITTEE_DECISION.APPROVED) {
    return JOB_STATUS.COMMITTEE_APPROVED;
  }
  if (decision === COMMITTEE_DECISION.REJECTED) {
    return JOB_STATUS.COMMITTEE_REJECTED;
  }
  if (decision === COMMITTEE_DECISION.CLARIFICATION_REQUESTED) {
    return JOB_STATUS.COMMITTEE_CLARIFICATION_REQUESTED;
  }
  return JOB_STATUS.COMMITTEE_AMENDMENT_REQUESTED;
};

const buildCommitteeReport = (recommendations) => {
  const rows = recommendations.map((row) => ({
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    itemName: row.item_name,
    itemDescription: row.item_description,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    totalPrice: Number(row.quantity) * Number(row.unit_price),
    decisionStatus: row.decision_status,
    isRecommended: row.is_recommended,
    remarks: row.remarks,
  }));

  const supplierTotalsMap = new Map();
  for (const row of rows) {
    const key = `${row.supplierId}:${row.supplierName}`;
    supplierTotalsMap.set(
      key,
      (supplierTotalsMap.get(key) || 0) + row.totalPrice,
    );
  }

  const supplierTotals = [...supplierTotalsMap.entries()].map(
    ([key, total]) => {
      const [supplierId, supplierName] = key.split(":");
      return {
        supplierId: Number(supplierId),
        supplierName,
        totalAmount: Number(total.toFixed(2)),
      };
    },
  );

  const totalAmount = Number(
    supplierTotals.reduce((sum, row) => sum + row.totalAmount, 0).toFixed(2),
  );

  return {
    rows,
    supplierTotals,
    totalAmount,
  };
};

export const postProcurementService = {
  async sendScheduleToTec(user, jobId) {
    const job = await postProcurementRepository.findJobContext(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    ensureClerkAccess(user, job);

    const updated = await postProcurementRepository.updateJobStatus(
      jobId,
      JOB_STATUS.PENDING_TEC_DECISION,
    );

    await notificationService.notifyUsers(
      [job.requester_id, job.assigned_clerk_id],
      {
        eventType: "SCHEDULE_SENT_TO_TEC",
        subject: `Schedule sent to TEC (${job.job_number})`,
        message: `Procurement schedule for ${job.job_number} has been forwarded to TEC board for evaluation.`,
      },
    );

    await notificationService.notifyByRoles(
      [...APPROVER_ROLES, USER_ROLES.TEC_MEMBER],
      {
        eventType: "SCHEDULE_PENDING_TEC",
        subject: `TEC review pending (${job.job_number})`,
        message: `Job ${job.job_number} is now pending TEC decision entry.`,
      },
    );

    return updated;
  },

  async enterTecDecisions(user, jobId, payload) {
    const job = await postProcurementRepository.findJobContext(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    ensureClerkAccess(user, job);

    const decisions = payload.decisions || [];
    if (!Array.isArray(decisions) || !decisions.length) {
      throw new ApiError(400, "decisions array is required");
    }

    const normalized = decisions.map((row) => {
      const decisionStatus = String(row.decisionStatus || "")
        .trim()
        .toUpperCase();

      if (!TEC_DECISION_STATUS.includes(decisionStatus)) {
        throw new ApiError(
          400,
          `Invalid TEC decision status: ${decisionStatus}`,
        );
      }

      if (!row.supplierId) {
        throw new ApiError(400, "Each TEC decision must include supplierId");
      }

      const quantity = Number(row.quantity || job.quantity || 1);
      const unitPrice = Number(row.unitPrice || 0);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new ApiError(400, "Quantity must be greater than zero");
      }

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new ApiError(400, "unitPrice must be zero or a positive number");
      }

      const isRecommended =
        row.isRecommended === true || decisionStatus === "RECOMMENDED";

      return {
        supplierId: Number(row.supplierId),
        itemName: row.itemName || job.item_name,
        itemDescription: row.itemDescription || job.item_description,
        quantity,
        unitPrice,
        decisionStatus,
        isRecommended,
        remarks: row.remarks || "",
      };
    });

    if (!normalized.some((r) => r.isRecommended)) {
      throw new ApiError(
        400,
        "At least one supplier must be marked as recommended",
      );
    }

    const saved = await postProcurementRepository.replaceTecRecommendations({
      jobId,
      createdBy: user.id,
      recommendations: normalized,
    });

    const report = buildCommitteeReport(saved);
    const committeeType =
      report.totalAmount < postProcurementRepository.committeeThreshold
        ? COMMITTEE_TYPE.MINOR
        : COMMITTEE_TYPE.MAJOR;

    await postProcurementRepository.upsertCommitteeReport({
      jobId,
      reportData: report,
      totalAmount: report.totalAmount,
      committeeType,
      generatedBy: user.id,
    });

    await postProcurementRepository.updateJobStatus(
      jobId,
      JOB_STATUS.TEC_DECISION_ENTERED,
      {
        totalAmount: report.totalAmount,
        committeeType,
      },
    );

    return {
      jobId,
      committeeType,
      report,
    };
  },

  async getCommitteeReport(user, jobId) {
    const job = await postProcurementRepository.findJobContext(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    ensureClerkAccess(user, job);

    const report = await postProcurementRepository.getCommitteeReport(jobId);
    if (!report) {
      throw new ApiError(404, "Committee report not generated yet");
    }

    return report;
  },

  async routeToCommittee(user, jobId) {
    const job = await postProcurementRepository.findJobContext(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    ensureClerkAccess(user, job);

    const report = await postProcurementRepository.getCommitteeReport(jobId);
    if (!report) {
      throw new ApiError(400, "Generate committee report before routing");
    }

    const isMinor = report.committee_type === COMMITTEE_TYPE.MINOR;
    const status = isMinor
      ? JOB_STATUS.PENDING_MINOR_COMMITTEE_APPROVAL
      : JOB_STATUS.PENDING_MAJOR_COMMITTEE_APPROVAL;

    const updated = await postProcurementRepository.updateJobStatus(
      jobId,
      status,
      {
        committeeType: report.committee_type,
        totalAmount: report.total_amount,
      },
    );

    await notificationService.notifyByRoles(
      [isMinor ? USER_ROLES.MINOR_COMMITTEE : USER_ROLES.MAJOR_COMMITTEE],
      {
        eventType: "COMMITTEE_APPROVAL_REQUIRED",
        subject: `Committee approval required (${job.job_number})`,
        message: `Job ${job.job_number} has been routed to ${report.committee_type} committee for decision.`,
      },
    );

    await notificationService.notifyUsers(
      [job.requester_id, job.assigned_clerk_id],
      {
        eventType: "COMMITTEE_ROUTED",
        subject: `Job routed to committee (${job.job_number})`,
        message: `Job ${job.job_number} is now pending ${report.committee_type} committee approval.`,
      },
    );

    return updated;
  },

  async recordCommitteeDecision(user, jobId, payload) {
    const job = await postProcurementRepository.findJobContext(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    const report = await postProcurementRepository.getCommitteeReport(jobId);
    if (!report) {
      throw new ApiError(400, "Committee report not found");
    }

    const expectedRole =
      report.committee_type === COMMITTEE_TYPE.MINOR
        ? USER_ROLES.MINOR_COMMITTEE
        : USER_ROLES.MAJOR_COMMITTEE;

    if (user.role !== expectedRole) {
      throw new ApiError(403, `Only ${expectedRole} can decide this job`);
    }

    const decision = String(payload.decision || "")
      .trim()
      .toUpperCase();
    if (!Object.values(COMMITTEE_DECISION).includes(decision)) {
      throw new ApiError(400, "Invalid committee decision");
    }

    const saved = await postProcurementRepository.upsertCommitteeDecision({
      jobId,
      committeeType: report.committee_type,
      decision,
      remarks: payload.remarks || payload.comments || "",
      decidedBy: user.id,
    });

    const nextStatus = mapCommitteeDecisionToJobStatus(decision);
    await postProcurementRepository.updateJobStatus(jobId, nextStatus, {
      committeeType: report.committee_type,
      totalAmount: report.total_amount,
    });

    await notificationService.notifyByRoles(APPROVER_ROLES, {
      eventType: "COMMITTEE_DECISION_UPDATED",
      subject: `Committee decision recorded (${job.job_number})`,
      message: `${report.committee_type} committee recorded ${decision} for ${job.job_number}.`,
    });

    await notificationService.notifyUsers(
      [job.requester_id, job.assigned_clerk_id],
      {
        eventType: "COMMITTEE_DECISION_UPDATED",
        subject: `Committee decision recorded (${job.job_number})`,
        message: `Committee decision for ${job.job_number}: ${decision}.`,
      },
    );

    return saved;
  },

  async generatePurchaseOrders(user, jobId, payload) {
    if (user.role !== USER_ROLES.SUPPLY_BRANCH) {
      throw new ApiError(
        403,
        "Only supply branch can generate purchase orders",
      );
    }

    const job = await postProcurementRepository.findJobContext(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    const decision =
      await postProcurementRepository.getCommitteeDecision(jobId);
    if (!decision || decision.decision !== COMMITTEE_DECISION.APPROVED) {
      throw new ApiError(
        400,
        "Committee approval is required before purchase order generation",
      );
    }

    if (!payload.deliveryLocation) {
      throw new ApiError(400, "deliveryLocation is required");
    }

    const orders = await postProcurementRepository.createPurchaseOrders({
      jobId,
      issuedBy: user.id,
      deliveryLocation: payload.deliveryLocation,
      paymentTerms: payload.paymentTerms,
      deliveryDeadline: payload.deliveryDeadline,
    });

    await postProcurementRepository.updateJobStatus(
      jobId,
      JOB_STATUS.PURCHASE_ORDER_GENERATED,
    );

    await notificationService.notifyUsers(
      [job.requester_id, job.assigned_clerk_id],
      {
        eventType: "PURCHASE_ORDERS_GENERATED",
        subject: `Purchase orders generated (${job.job_number})`,
        message: `Purchase orders were generated for ${job.job_number}.`,
      },
    );

    return orders;
  },

  async listPurchaseOrders(user, jobId) {
    const job = await postProcurementRepository.findJobContext(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    if (
      ![
        USER_ROLES.SUPPLY_BRANCH,
        USER_ROLES.SUBJECT_CLERK,
        USER_ROLES.REQUESTING_OFFICER,
      ].includes(user.role)
    ) {
      throw new ApiError(403, "Not authorized to view purchase orders");
    }

    if (user.role === USER_ROLES.SUBJECT_CLERK) {
      ensureClerkAccess(user, job);
    }

    if (
      user.role === USER_ROLES.REQUESTING_OFFICER &&
      Number(job.requester_id) !== Number(user.id)
    ) {
      throw new ApiError(403, "You can only view your own job purchase orders");
    }

    return postProcurementRepository.listPurchaseOrdersByJob(jobId);
  },

  async getDeliveryConfirmationByToken(token) {
    const data = await postProcurementRepository.findDeliveryByToken(token);
    if (!data) {
      throw new ApiError(404, "Invalid or expired confirmation token");
    }

    return {
      token,
      jobNumber: data.job_number,
      purchaseOrderId: data.purchase_order_id,
      poNumber: data.po_number,
      supplierName: data.supplier_name,
      itemName: data.item_name,
      quantityOrdered: data.quantity,
      requestingDepartment: data.requesting_department,
      currentStatus: data.acceptance_status,
    };
  },

  async confirmDeliveryByToken(token, payload) {
    const data = await postProcurementRepository.findDeliveryByToken(token);
    if (!data) {
      throw new ApiError(404, "Invalid or expired confirmation token");
    }

    const quantityDelivered = Number(
      payload.quantityDelivered || data.quantity,
    );
    if (!Number.isFinite(quantityDelivered) || quantityDelivered <= 0) {
      throw new ApiError(400, "quantityDelivered must be greater than zero");
    }

    const acceptanceStatus = payload.accepted
      ? JOB_STATUS.ACCEPTED
      : JOB_STATUS.DELIVERED;

    await postProcurementRepository.confirmDeliveryByToken(token, {
      confirmedByUserId: payload.confirmedByUserId,
      quantityDelivered,
      deliveryDate:
        payload.deliveryDate || new Date().toISOString().slice(0, 10),
      remarks: payload.remarks,
      acceptanceStatus,
    });

    await postProcurementRepository.updateJobStatus(
      data.job_id,
      acceptanceStatus,
    );

    return {
      jobId: data.job_id,
      acceptanceStatus,
      quantityDelivered,
    };
  },

  async generateDeliveryNote(user, purchaseOrderId, payload) {
    if (
      ![USER_ROLES.SUPPLY_BRANCH, USER_ROLES.SUBJECT_CLERK].includes(user.role)
    ) {
      throw new ApiError(
        403,
        "Only supply branch or subject clerk can generate delivery note",
      );
    }

    const po =
      await postProcurementRepository.getPurchaseOrderById(purchaseOrderId);
    if (!po) {
      throw new ApiError(404, "Purchase order not found");
    }

    const delivery = await postProcurementRepository.findDeliveryByToken(
      payload.confirmationToken || "",
    );

    const noteContent = {
      jobId: po.job_id,
      poNumber: po.po_number,
      supplierName: po.supplier_name,
      department: po.requesting_department,
      itemName: po.item_name,
      quantityDelivered:
        payload.quantityDelivered ||
        delivery?.quantity_delivered ||
        po.quantity,
      deliveryDate:
        payload.deliveryDate ||
        delivery?.delivery_date ||
        new Date().toISOString().slice(0, 10),
      confirmedBy: payload.confirmedBy || user.id,
      remarks: payload.remarks || delivery?.remarks || null,
    };

    return postProcurementRepository.createDeliveryNote({
      purchaseOrderId,
      createdBy: user.id,
      noteContent,
    });
  },

  async generatePaymentVoucher(user, purchaseOrderId, payload) {
    if (
      ![
        USER_ROLES.SUBJECT_CLERK,
        USER_ROLES.SUPPLY_BRANCH,
        USER_ROLES.FINANCE_OFFICER,
      ].includes(user.role)
    ) {
      throw new ApiError(403, "Not authorized to generate payment voucher");
    }

    const po =
      await postProcurementRepository.getPurchaseOrderById(purchaseOrderId);
    if (!po) {
      throw new ApiError(404, "Purchase order not found");
    }

    const note =
      await postProcurementRepository.getDeliveryNoteByPurchaseOrderId(
        purchaseOrderId,
      );

    const voucher = await postProcurementRepository.createPaymentVoucher({
      purchaseOrderId,
      createdBy: user.id,
      invoiceReference: payload.invoiceReference,
      deliveryNoteReference: payload.deliveryNoteReference || note?.note_number,
      payableAmount: payload.payableAmount || po.total_amount,
      department: payload.department || po.requesting_department,
      voucherDate: payload.voucherDate || new Date().toISOString().slice(0, 10),
    });

    await postProcurementRepository.updateJobStatus(
      po.job_id,
      JOB_STATUS.PAYMENT_VOUCHER_GENERATED,
    );

    return voucher;
  },

  async quarterlyReport(user, filters) {
    if (
      ![
        USER_ROLES.SUPPLY_BRANCH,
        USER_ROLES.FINANCE_OFFICER,
        USER_ROLES.MINOR_COMMITTEE,
        USER_ROLES.MAJOR_COMMITTEE,
      ].includes(user.role)
    ) {
      throw new ApiError(403, "Not authorized to view quarterly report");
    }

    const year = Number(filters.year || new Date().getFullYear());
    const quarter = filters.quarter ? Number(filters.quarter) : undefined;
    if (quarter && ![1, 2, 3, 4].includes(quarter)) {
      throw new ApiError(400, "quarter must be 1, 2, 3 or 4");
    }

    return postProcurementRepository.quarterlyReport({
      year,
      quarter,
      department: filters.department,
      procurementMethod: filters.procurementMethod,
      status: filters.status,
    });
  },

  async annualReport(user, filters) {
    if (
      ![
        USER_ROLES.SUPPLY_BRANCH,
        USER_ROLES.FINANCE_OFFICER,
        USER_ROLES.MINOR_COMMITTEE,
        USER_ROLES.MAJOR_COMMITTEE,
      ].includes(user.role)
    ) {
      throw new ApiError(403, "Not authorized to view annual report");
    }

    const year = Number(filters.year || new Date().getFullYear());

    return postProcurementRepository.annualReport({
      year,
      department: filters.department,
      procurementMethod: filters.procurementMethod,
      fundingSource: filters.fundingSource,
      supplier: filters.supplier,
      status: filters.status,
    });
  },
};
