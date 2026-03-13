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

    const clerk = await userRepository.findById(clerkId);
    if (!clerk || clerk.role !== USER_ROLES.SUBJECT_CLERK) {
      throw new ApiError(400, "Selected user is not a subject clerk");
    }

    const job = await jobRepository.findById(jobId);
    if (!job) {
      throw new ApiError(404, "Job not found");
    }

    return jobRepository.assignClerk(jobId, clerkId);
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
