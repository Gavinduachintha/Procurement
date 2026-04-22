import { jobRepository } from "../repositories/jobRepository.js";
import { requestRepository } from "../repositories/requestRepository.js";
import { supplierRepository } from "../repositories/supplierRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import { ApiError } from "../utils/apiError.js";
import {
  PROCUREMENT_METHODS,
  REQUEST_STATUS,
  USER_ROLES,
} from "../utils/constants.js";
import { notificationService } from "./notificationService.js";

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

    return supplierRepository.attachSuppliers(jobId, supplierIds);
  },

  async generateQuotationLetters(user, jobId, payload) {
    const job = await jobRepository.findById(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    if (
      ![USER_ROLES.SUBJECT_CLERK, USER_ROLES.SUPPLY_BRANCH].includes(user.role)
    ) {
      throw new ApiError(
        403,
        "Only subject clerk or supply branch can generate quotation letters",
      );
    }

    if (
      user.role === USER_ROLES.SUBJECT_CLERK &&
      job.assigned_clerk_id !== user.id
    ) {
      throw new ApiError(403, "You are not assigned to this job");
    }

    const request = await requestRepository.findById(job.purchase_request_id);
    const letterContent = [
      `University Procurement Unit`,
      `Job Number: ${job.job_number}`,
      `Item: ${request.item_name}`,
      `Description: ${request.item_description || "N/A"}`,
      `Technical Specifications: ${request.checked_specifications || request.technical_specifications}`,
      `Submission Deadline: ${payload.submissionDeadline}`,
      `Contact: Supply Branch`,
    ].join("\n");

    const recipients = await supplierRepository.createQuotationLetters(
      jobId,
      payload.submissionDeadline,
      letterContent,
    );

    return {
      jobNumber: job.job_number,
      letterContent,
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
      jobNumber: job.job_number,
      itemName: request.item_name,
      description: request.item_description,
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
};
