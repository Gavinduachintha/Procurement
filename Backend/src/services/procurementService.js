import { jobRepository } from "../repositories/jobRepository.js";
import { requestRepository } from "../repositories/requestRepository.js";
import { procurementStageTwoRepository } from "../repositories/procurementStageTwoRepository.js";
import { supplierRepository } from "../repositories/supplierRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import { ApiError } from "../utils/apiError.js";
import {
  APPROVER_ROLES,
  COMMITTEE_TYPE,
  JOB_STATUS,
  PROCUREMENT_METHODS,
  REQUEST_STATUS,
  TEC_DECISION_STATUS,
  SCHEDULE_STATUS,
  USER_ROLES,
} from "../utils/constants.js";
import { notificationService } from "./notificationService.js";

const toIsoDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
};

const canManageScheduleForJob = (user, job) => {
  if (
    ![USER_ROLES.SUBJECT_CLERK, USER_ROLES.SUPPLY_BRANCH].includes(user.role)
  ) {
    return false;
  }

  if (user.role === USER_ROLES.SUPPLY_BRANCH) {
    return true;
  }

  return job.assigned_clerk_id === user.id;
};

const canClerkOrSupplyBranchManageJob = (user, job) => {
  if (
    ![USER_ROLES.SUBJECT_CLERK, USER_ROLES.SUPPLY_BRANCH].includes(user.role)
  ) {
    return false;
  }

  if (user.role === USER_ROLES.SUPPLY_BRANCH) {
    return true;
  }

  return job.assigned_clerk_id === user.id;
};

export const procurementService = {
  async createSupplier(user, payload) {
    if (user.role !== USER_ROLES.SUPPLY_BRANCH) {
      throw new ApiError(403, "Only supply branch can register suppliers");
    }

    return supplierRepository.create(payload);
  },

  async listSuppliers(user) {
    if (user.role !== USER_ROLES.SUPPLY_BRANCH) {
      throw new ApiError(403, "Only supply branch can view all suppliers");
    }

    return supplierRepository.listAll();
  },

  async chooseMethodAndCreateJob(user, requestId, procurementMethod) {
    if (user.role !== USER_ROLES.SUPPLY_BRANCH) {
      throw new ApiError(
        403,
        "Only supply branch users can choose procurement method",
      );
    }

    if (!PROCUREMENT_METHODS.includes(procurementMethod)) {
      throw new ApiError(400, "Invalid procurement method");
    }

    const request = await requestRepository.findById(requestId);
    if (!request) {
      throw new ApiError(404, "Request not found");
    }

    if (request.status !== REQUEST_STATUS.APPROVED) {
      throw new ApiError(400, "Only approved requests can start procurement");
    }

    const existing = await jobRepository.findByRequestId(request.id);
    if (existing) {
      throw new ApiError(409, "Job already exists for this request");
    }

    const job = await jobRepository.createWithGeneratedNumber({
      purchaseRequestId: request.id,
      procurementMethod,
    });

    await requestRepository.updateStatus(
      request.id,
      REQUEST_STATUS.PROCUREMENT_STARTED,
    );

    await notificationService.notifyUsers([request.requester_id], {
      eventType: "JOB_NUMBER_GENERATED",
      subject: `Job number generated (${job.job_number})`,
      message: `Procurement started for ${request.request_id}. Job number: ${job.job_number}.`,
    });

    return job;
  },

  async assignSubjectClerk(user, jobId, clerkId) {
    if (user.role !== USER_ROLES.SUPPLY_BRANCH) {
      throw new ApiError(403, "Only supply branch users can assign clerks");
    }

    const job = await jobRepository.findById(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    if (!job.procurement_method) {
      throw new ApiError(
        400,
        "Procurement method must be selected before assigning a clerk",
      );
    }

    const clerk = await userRepository.findById(clerkId);
    if (!clerk || clerk.role !== USER_ROLES.SUBJECT_CLERK) {
      throw new ApiError(400, "Selected user is not a subject clerk");
    }

    const existingSpecialistIds =
      await jobRepository.listAssignedClerkIdsByMethod(job.procurement_method);

    if (
      existingSpecialistIds.length > 0 &&
      !existingSpecialistIds.includes(Number(clerkId))
    ) {
      throw new ApiError(
        400,
        `This method already has a designated clerk specialist. Please assign the existing ${job.procurement_method} specialist.`,
      );
    }

    const clerkAssignedJobs = await jobRepository.listByAssignedClerk(clerkId);
    const clerkMethods = [
      ...new Set(
        clerkAssignedJobs
          .map((assignedJob) => assignedJob.procurement_method)
          .filter(Boolean),
      ),
    ];

    const hasDifferentSpecialization = clerkMethods.some(
      (method) => method !== job.procurement_method,
    );

    if (hasDifferentSpecialization) {
      throw new ApiError(
        400,
        `Selected clerk is specialized for ${clerkMethods.join(", ")} and cannot be assigned to ${job.procurement_method}.`,
      );
    }

    return jobRepository.assignClerk(jobId, clerkId);
  },

  async setProcurementMethod(user, jobId, procurementMethod) {
    if (user.role !== USER_ROLES.SUPPLY_BRANCH) {
      throw new ApiError(403, "Only supply branch can set procurement method");
    }

    if (!PROCUREMENT_METHODS.includes(procurementMethod)) {
      throw new ApiError(400, "Invalid procurement method");
    }

    const job = await jobRepository.findById(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    console.log("📝 Backend: Setting procurement method for job:", jobId);
    console.log("🔧 Backend: Method:", procurementMethod);

    const updated = await jobRepository.setProcurementMethod(
      jobId,
      procurementMethod,
    );

    console.log("✅ Backend: Procurement method updated successfully");

    return updated;
  },

  async selectSupplierCategory(user, jobId, category) {
    const job = await jobRepository.findById(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    if (
      ![USER_ROLES.SUBJECT_CLERK, USER_ROLES.SUPPLY_BRANCH].includes(user.role)
    ) {
      throw new ApiError(
        403,
        "Only subject clerk or supply branch can select supplier category",
      );
    }

    if (
      user.role === USER_ROLES.SUBJECT_CLERK &&
      job.assigned_clerk_id !== user.id
    ) {
      throw new ApiError(403, "You are not assigned to this job");
    }

    await jobRepository.setSupplierCategory(jobId, category);
    return supplierRepository.listByCategory(category);
  },

  async selectSuppliers(user, jobId, supplierIds) {
    const job = await jobRepository.findById(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    if (!job.supplier_category) {
      throw new ApiError(
        400,
        "Select supplier category before selecting suppliers",
      );
    }

    if (
      ![USER_ROLES.SUBJECT_CLERK, USER_ROLES.SUPPLY_BRANCH].includes(user.role)
    ) {
      throw new ApiError(
        403,
        "Only subject clerk or supply branch can select suppliers",
      );
    }

    if (
      user.role === USER_ROLES.SUBJECT_CLERK &&
      job.assigned_clerk_id !== user.id
    ) {
      throw new ApiError(403, "You are not assigned to this job");
    }

    if (!Array.isArray(supplierIds) || supplierIds.length === 0) {
      throw new ApiError(400, "At least one supplier must be selected");
    }

    const normalizedSupplierIds = [
      ...new Set(
        supplierIds
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value)),
      ),
    ];

    if (!normalizedSupplierIds.length) {
      throw new ApiError(400, "Supplier IDs are invalid");
    }

    const suppliersInCategory = await supplierRepository.listByCategory(
      job.supplier_category,
    );
    const validIds = new Set(
      suppliersInCategory
        .map((supplier) => Number(supplier.id))
        .filter((id) => Number.isFinite(id)),
    );
    const invalidIds = normalizedSupplierIds.filter((id) => !validIds.has(id));

    if (invalidIds.length) {
      throw new ApiError(
        400,
        "One or more selected suppliers do not belong to the chosen category",
      );
    }

    return supplierRepository.attachSuppliers(jobId, normalizedSupplierIds);
  },

  async generateQuotationLetters(user, jobId, payload) {
    const job = await jobRepository.findById(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    if (!canManageScheduleForJob(user, job)) {
      throw new ApiError(
        403,
        "You are not allowed to manage this job schedule",
      );
    }

    const submissionDeadline = toIsoDate(payload.submissionDeadline);
    if (!submissionDeadline) {
      throw new ApiError(400, "Valid submissionDeadline is required");
    }

    const selectedSuppliers = await supplierRepository.listSelectedForJob(
      job.id,
    );
    if (!selectedSuppliers.length) {
      throw new ApiError(
        400,
        "Select suppliers before generating quotation request letters",
      );
    }

    const request = await requestRepository.findById(job.purchase_request_id);
    const letterContent = [
      `University Procurement Unit`,
      `Job Number: ${job.job_number}`,
      `Item: ${request.item_name}`,
      `Description: ${request.item_description || "N/A"}`,
      `Technical Specifications: ${request.checked_specifications || request.technical_specifications}`,
      `Submission Deadline: ${submissionDeadline}`,
      `Contact: Supply Branch`,
    ].join("\n");

    const recipients = await supplierRepository.createQuotationLetters(
      jobId,
      submissionDeadline,
      letterContent,
    );

    await jobRepository.openSchedule(jobId, submissionDeadline);

    return {
      jobNumber: job.job_number,
      letterContent,
      submissionDeadline,
      recipients,
    };
  },

  async getProcurementSchedule(jobId) {
    const job = await jobRepository.findById(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    const request = await requestRepository.findById(job.purchase_request_id);
    const suppliers = await supplierRepository.listSelectedForJob(job.id);

    return {
      jobId: job.id,
      jobNumber: job.job_number,
      itemName: request.item_name,
      description: request.item_description,
      scheduleStatus: job.schedule_status || SCHEDULE_STATUS.NOT_CREATED,
      scheduleCreatedAt: job.schedule_created_at,
      submissionDeadline: job.schedule_deadline,
      scheduleFrozenAt: job.schedule_frozen_at,
      rows: suppliers.map((s) => ({
        supplierId: s.id,
        supplierName: s.name,
        quotationReceived: s.quotation_received,
        quotedPrice: s.quoted_price,
        submissionDate: s.submission_date,
        evaluationResult: s.evaluation_result,
      })),
    };
  },

  async updateProcurementScheduleLine(user, jobId, supplierId, payload) {
    const job = await jobRepository.findById(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    if (!canManageScheduleForJob(user, job)) {
      throw new ApiError(
        403,
        "You are not allowed to manage this job schedule",
      );
    }

    if (
      (job.schedule_status || SCHEDULE_STATUS.NOT_CREATED) ===
      SCHEDULE_STATUS.NOT_CREATED
    ) {
      throw new ApiError(
        400,
        "Generate quotation request letters before updating schedule",
      );
    }

    if (
      (job.schedule_status || SCHEDULE_STATUS.NOT_CREATED) ===
      SCHEDULE_STATUS.FROZEN
    ) {
      throw new ApiError(400, "Schedule is frozen and cannot be edited");
    }

    const today = new Date().toISOString().slice(0, 10);
    if (job.schedule_deadline && job.schedule_deadline < today) {
      await jobRepository.freezeSchedule(jobId);
      throw new ApiError(
        400,
        "Submission deadline has passed. Schedule is now frozen",
      );
    }

    const normalizedSupplierId = Number(supplierId);
    if (!Number.isFinite(normalizedSupplierId)) {
      throw new ApiError(400, "Supplier ID is invalid");
    }

    const quotationReceived = Boolean(payload.quotationReceived);
    const submissionDate = payload.submissionDate
      ? toIsoDate(payload.submissionDate)
      : null;

    if (payload.submissionDate && !submissionDate) {
      throw new ApiError(400, "submissionDate is invalid");
    }

    const normalizedQuotedPrice =
      payload.quotedPrice === null || payload.quotedPrice === ""
        ? null
        : Number(payload.quotedPrice);

    if (
      normalizedQuotedPrice !== null &&
      (!Number.isFinite(normalizedQuotedPrice) || normalizedQuotedPrice < 0)
    ) {
      throw new ApiError(400, "quotedPrice must be a non-negative number");
    }

    const updated = await supplierRepository.updateJobSupplierQuotation(
      jobId,
      normalizedSupplierId,
      {
        quotationReceived,
        quotedPrice: quotationReceived ? normalizedQuotedPrice : null,
        submissionDate: quotationReceived ? submissionDate : null,
        evaluationResult: payload.evaluationResult || null,
      },
    );

    if (!updated) {
      throw new ApiError(404, "Supplier line not found in this schedule");
    }

    return updated;
  },

  async freezeProcurementSchedule(user, jobId) {
    const job = await jobRepository.findById(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    if (!canManageScheduleForJob(user, job)) {
      throw new ApiError(
        403,
        "You are not allowed to manage this job schedule",
      );
    }

    if (
      (job.schedule_status || SCHEDULE_STATUS.NOT_CREATED) ===
      SCHEDULE_STATUS.NOT_CREATED
    ) {
      throw new ApiError(400, "Schedule has not been created yet");
    }

    if (
      (job.schedule_status || SCHEDULE_STATUS.NOT_CREATED) ===
      SCHEDULE_STATUS.FROZEN
    ) {
      return job;
    }

    const frozen = await jobRepository.freezeSchedule(jobId);
    if (!frozen) {
      throw new ApiError(500, "Failed to freeze schedule");
    }

    await notificationService.notifyUsers(
      [job.assigned_clerk_id].filter(Boolean),
      {
        eventType: "PROCUREMENT_SCHEDULE_FROZEN",
        subject: `Schedule frozen (${job.job_number})`,
        message: `Quotation schedule for job ${job.job_number} has been frozen for evaluation.`,
      },
    );

    return frozen;
  },

  async sendScheduleToTec(user, jobId) {
    const job = await jobRepository.findById(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    if (!canClerkOrSupplyBranchManageJob(user, job)) {
      throw new ApiError(403, "You are not allowed to forward this schedule");
    }

    if (
      (job.schedule_status || SCHEDULE_STATUS.NOT_CREATED) !==
      SCHEDULE_STATUS.FROZEN
    ) {
      throw new ApiError(400, "Freeze schedule before sending to TEC");
    }

    const updated = await jobRepository.updateStatus(
      jobId,
      JOB_STATUS.PENDING_TEC_DECISION,
    );

    const request = await requestRepository.findById(job.purchase_request_id);
    await notificationService.notifyByRoles(
      [USER_ROLES.TEC_MEMBER, ...APPROVER_ROLES],
      {
        eventType: "SCHEDULE_SENT_TO_TEC",
        subject: `Schedule sent to TEC (${job.job_number})`,
        message: `Procurement schedule for job ${job.job_number} is now pending TEC decision.`,
      },
    );

    await notificationService.notifyUsers(
      [job.assigned_clerk_id, request?.requester_id].filter(Boolean),
      {
        eventType: "SCHEDULE_SENT_TO_TEC",
        subject: `Schedule sent to TEC (${job.job_number})`,
        message: `Job ${job.job_number} schedule has been forwarded to TEC for technical evaluation.`,
      },
    );

    return updated;
  },

  async getTecRecommendations(user, jobId) {
    const job = await jobRepository.findById(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    if (
      ![
        USER_ROLES.SUBJECT_CLERK,
        USER_ROLES.SUPPLY_BRANCH,
        USER_ROLES.TEC_MEMBER,
        USER_ROLES.MINOR_COMMITTEE,
        USER_ROLES.MAJOR_COMMITTEE,
      ].includes(user.role)
    ) {
      throw new ApiError(
        403,
        "You are not allowed to view TEC recommendations",
      );
    }

    return procurementStageTwoRepository.listTecRecommendationsByJob(jobId);
  },

  async submitTecRecommendations(user, jobId, payload) {
    const job = await jobRepository.findById(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    if (user.role !== USER_ROLES.TEC_MEMBER) {
      throw new ApiError(403, "Only TEC members can submit TEC decisions");
    }

    if (
      ![
        JOB_STATUS.PENDING_TEC_DECISION,
        JOB_STATUS.TEC_DECISION_ENTERED,
      ].includes(job.status)
    ) {
      throw new ApiError(400, "Job is not in TEC decision stage");
    }

    const entries = Array.isArray(payload?.entries) ? payload.entries : [];
    if (!entries.length) {
      throw new ApiError(
        400,
        "At least one TEC recommendation entry is required",
      );
    }

    const selectedSuppliers =
      await supplierRepository.listSelectedForJob(jobId);
    const supplierIds = new Set(selectedSuppliers.map((row) => Number(row.id)));

    const normalizedEntries = entries.map((entry, index) => {
      const supplierId = Number(entry.supplierId);
      const quantity = Number(entry.quantity);
      const unitPrice = Number(entry.unitPrice);
      const decisionStatus = String(entry.decisionStatus || "").toUpperCase();
      const isRecommended =
        typeof entry.isRecommended === "boolean"
          ? entry.isRecommended
          : decisionStatus === "RECOMMENDED";

      if (!Number.isFinite(supplierId) || !supplierIds.has(supplierId)) {
        throw new ApiError(
          400,
          `Entry ${index + 1}: supplierId must belong to selected suppliers`,
        );
      }

      if (!entry.itemName || typeof entry.itemName !== "string") {
        throw new ApiError(400, `Entry ${index + 1}: itemName is required`);
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new ApiError(400, `Entry ${index + 1}: quantity must be > 0`);
      }

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new ApiError(400, `Entry ${index + 1}: unitPrice must be >= 0`);
      }

      if (!TEC_DECISION_STATUS.includes(decisionStatus)) {
        throw new ApiError(
          400,
          `Entry ${index + 1}: decisionStatus is invalid`,
        );
      }

      return {
        supplierId,
        itemName: entry.itemName,
        itemDescription: entry.itemDescription || null,
        quantity,
        unitPrice,
        decisionStatus,
        isRecommended,
        remarks: entry.remarks || null,
      };
    });

    const saved = await procurementStageTwoRepository.replaceTecRecommendations(
      jobId,
      normalizedEntries,
      user.id,
    );

    await jobRepository.updateStatus(jobId, JOB_STATUS.TEC_DECISION_ENTERED);

    return {
      jobId,
      count: saved.length,
      entries: saved,
    };
  },

  async generateCommitteeReport(user, jobId) {
    const job = await jobRepository.findById(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    if (!canClerkOrSupplyBranchManageJob(user, job)) {
      throw new ApiError(
        403,
        "You are not allowed to generate committee report",
      );
    }

    if (job.status !== JOB_STATUS.TEC_DECISION_ENTERED) {
      throw new ApiError(
        400,
        "Submit TEC decisions before generating committee report",
      );
    }

    const recommendations =
      await procurementStageTwoRepository.listTecRecommendationsByJob(jobId);

    if (!recommendations.length) {
      throw new ApiError(400, "No TEC recommendations found for this job");
    }

    const recommendedRows = recommendations.filter(
      (row) => row.decision_status === "RECOMMENDED" || row.is_recommended,
    );

    if (!recommendedRows.length) {
      throw new ApiError(400, "No recommended rows found in TEC decisions");
    }

    const supplierSummaryMap = new Map();
    for (const row of recommendedRows) {
      const amount = Number(row.quantity) * Number(row.unit_price);
      const existing = supplierSummaryMap.get(row.supplier_id) || {
        supplierId: row.supplier_id,
        supplierName: row.supplier_name,
        totalAmount: 0,
        items: [],
      };

      existing.totalAmount += amount;
      existing.items.push({
        itemName: row.item_name,
        itemDescription: row.item_description,
        quantity: row.quantity,
        unitPrice: row.unit_price,
        totalAmount: amount,
        remarks: row.remarks,
      });

      supplierSummaryMap.set(row.supplier_id, existing);
    }

    const suppliers = Array.from(supplierSummaryMap.values());
    const totalAmount = suppliers.reduce(
      (sum, supplier) => sum + Number(supplier.totalAmount),
      0,
    );
    const committeeType =
      totalAmount < 10000000 ? COMMITTEE_TYPE.MINOR : COMMITTEE_TYPE.MAJOR;

    const reportData = {
      generatedAt: new Date().toISOString(),
      jobId: job.id,
      jobNumber: job.job_number,
      procurementMethod: job.procurement_method,
      suppliers,
      tecEntries: recommendations,
    };

    const report = await procurementStageTwoRepository.upsertCommitteeReport({
      jobId,
      reportData,
      totalAmount,
      committeeType,
      generatedBy: user.id,
    });

    await jobRepository.setCommitteeSummary(
      jobId,
      committeeType,
      totalAmount,
      JOB_STATUS.TEC_DECISION_ENTERED,
    );

    return report;
  },

  async routeToCommittee(user, jobId) {
    const job = await jobRepository.findById(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    if (!canClerkOrSupplyBranchManageJob(user, job)) {
      throw new ApiError(403, "You are not allowed to route this job");
    }

    const report =
      await procurementStageTwoRepository.getCommitteeReportByJob(jobId);
    if (!report) {
      throw new ApiError(400, "Generate committee report before routing");
    }

    const nextStatus =
      report.committee_type === COMMITTEE_TYPE.MINOR
        ? JOB_STATUS.PENDING_MINOR_COMMITTEE_APPROVAL
        : JOB_STATUS.PENDING_MAJOR_COMMITTEE_APPROVAL;

    const updated = await jobRepository.setCommitteeSummary(
      jobId,
      report.committee_type,
      report.total_amount,
      nextStatus,
    );

    const targetRole =
      report.committee_type === COMMITTEE_TYPE.MINOR
        ? USER_ROLES.MINOR_COMMITTEE
        : USER_ROLES.MAJOR_COMMITTEE;

    await notificationService.notifyByRoles([targetRole, ...APPROVER_ROLES], {
      eventType: "JOB_ROUTED_TO_COMMITTEE",
      subject: `Job routed to ${report.committee_type} committee (${job.job_number})`,
      message: `Job ${job.job_number} is now pending ${report.committee_type.toLowerCase()} committee approval.`,
    });

    return {
      ...updated,
      routedCommittee: report.committee_type,
    };
  },
};
