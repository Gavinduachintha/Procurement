import { jobRepository } from "../repositories/jobRepository.js";
import { requestRepository } from "../repositories/requestRepository.js";
import { supplierRepository } from "../repositories/supplierRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import { ApiError } from "../utils/apiError.js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  PROCUREMENT_METHODS,
  REQUEST_STATUS,
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

const splitTextToLines = ({ text, font, fontSize, maxWidth }) => {
  const words = String(text || "")
    .split(/\s+/)
    .filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const candidateWidth = font.widthOfTextAtSize(candidate, fontSize);

    if (candidateWidth <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
      continue;
    }

    lines.push(word);
    current = "";
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
};

const renderParagraph = ({
  page,
  text,
  x,
  y,
  maxWidth,
  font,
  fontSize,
  lineHeight,
  color,
}) => {
  const lines = splitTextToLines({ text, font, fontSize, maxWidth });
  let cursorY = y;

  for (const line of lines) {
    page.drawText(line, {
      x,
      y: cursorY,
      size: fontSize,
      font,
      color,
    });
    cursorY -= lineHeight;
  }

  return cursorY;
};

const buildLettersPdf = async ({
  job,
  request,
  recipients,
  submissionDeadline,
  letterContent,
}) => {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const supplier of recipients) {
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    page.drawRectangle({
      x: 40,
      y: height - 110,
      width: width - 80,
      height: 70,
      color: rgb(0.95, 0.97, 1),
      borderColor: rgb(0.2, 0.36, 0.7),
      borderWidth: 1,
    });

    page.drawText("University Procurement Unit", {
      x: 55,
      y: height - 70,
      size: 16,
      font: bold,
      color: rgb(0.12, 0.2, 0.45),
    });

    page.drawText(`Quotation Request - ${job.job_number}`, {
      x: 55,
      y: height - 92,
      size: 11,
      font: regular,
      color: rgb(0.2, 0.2, 0.2),
    });

    let y = height - 145;
    y = renderParagraph({
      page,
      text: `Date: ${new Date().toLocaleDateString()}`,
      x: 55,
      y,
      maxWidth: width - 110,
      font: regular,
      fontSize: 10,
      lineHeight: 14,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 8;

    y = renderParagraph({
      page,
      text: `To: ${supplier.name} (${supplier.email})`,
      x: 55,
      y,
      maxWidth: width - 110,
      font: bold,
      fontSize: 11,
      lineHeight: 15,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 10;

    y = renderParagraph({
      page,
      text: `Please submit your quotation for the following procurement requirement before ${submissionDeadline}.`,
      x: 55,
      y,
      maxWidth: width - 110,
      font: regular,
      fontSize: 10,
      lineHeight: 15,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 12;

    page.drawRectangle({
      x: 50,
      y: y - 220,
      width: width - 100,
      height: 220,
      borderColor: rgb(0.78, 0.8, 0.84),
      borderWidth: 1,
      color: rgb(0.99, 0.99, 1),
    });

    let detailY = y - 18;
    detailY = renderParagraph({
      page,
      text: `Job Number: ${job.job_number}`,
      x: 65,
      y: detailY,
      maxWidth: width - 130,
      font: bold,
      fontSize: 10,
      lineHeight: 14,
      color: rgb(0.15, 0.15, 0.15),
    });
    detailY = renderParagraph({
      page,
      text: `Request ID: ${request.request_id || request.id}`,
      x: 65,
      y: detailY - 4,
      maxWidth: width - 130,
      font: regular,
      fontSize: 10,
      lineHeight: 14,
      color: rgb(0.2, 0.2, 0.2),
    });
    detailY = renderParagraph({
      page,
      text: `Category: ${supplier.category || "N/A"}`,
      x: 65,
      y: detailY - 4,
      maxWidth: width - 130,
      font: regular,
      fontSize: 10,
      lineHeight: 14,
      color: rgb(0.2, 0.2, 0.2),
    });
    detailY = renderParagraph({
      page,
      text: `Item: ${request.item_name}`,
      x: 65,
      y: detailY - 8,
      maxWidth: width - 130,
      font: bold,
      fontSize: 10,
      lineHeight: 14,
      color: rgb(0.15, 0.15, 0.15),
    });
    detailY = renderParagraph({
      page,
      text: `Description: ${request.item_description || "N/A"}`,
      x: 65,
      y: detailY - 4,
      maxWidth: width - 130,
      font: regular,
      fontSize: 10,
      lineHeight: 14,
      color: rgb(0.2, 0.2, 0.2),
    });
    detailY = renderParagraph({
      page,
      text: `Technical Specifications: ${request.checked_specifications || request.technical_specifications}`,
      x: 65,
      y: detailY - 4,
      maxWidth: width - 130,
      font: regular,
      fontSize: 10,
      lineHeight: 14,
      color: rgb(0.2, 0.2, 0.2),
    });
    detailY = renderParagraph({
      page,
      text: `Submission Deadline: ${submissionDeadline}`,
      x: 65,
      y: detailY - 8,
      maxWidth: width - 130,
      font: bold,
      fontSize: 10,
      lineHeight: 14,
      color: rgb(0.65, 0.1, 0.1),
    });

    renderParagraph({
      page,
      text: "Please include unit price, total quoted price, validity period, and delivery timeline in your response.",
      x: 55,
      y: 155,
      maxWidth: width - 110,
      font: regular,
      fontSize: 10,
      lineHeight: 14,
      color: rgb(0.2, 0.2, 0.2),
    });

    renderParagraph({
      page,
      text: "Contact: Supply Branch, University Procurement Unit",
      x: 55,
      y: 118,
      maxWidth: width - 110,
      font: regular,
      fontSize: 10,
      lineHeight: 14,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText("System-generated quotation request letter", {
      x: 55,
      y: 70,
      size: 9,
      font: regular,
      color: rgb(0.5, 0.5, 0.5),
    });

    if (letterContent) {
      page.drawText("Ref: Stored in quotation_requests table", {
        x: 55,
        y: 55,
        size: 8,
        font: regular,
        color: rgb(0.55, 0.55, 0.55),
      });
    }
  }

  return pdfDoc.save();
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
      suppliersInCategory.map((supplier) => supplier.id),
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

    return {
      jobNumber: job.job_number,
      letterContent,
      submissionDeadline,
      recipients,
    };
  },

  async generateQuotationLettersPdf(user, jobId, payload) {
    const letters = await this.generateQuotationLetters(user, jobId, payload);
    const job = await jobRepository.findById(jobId);
    const request = await requestRepository.findById(job.purchase_request_id);

    const pdfBytes = await buildLettersPdf({
      job,
      request,
      recipients: letters.recipients,
      submissionDeadline: letters.submissionDeadline,
      letterContent: letters.letterContent,
    });

    return {
      fileName: `quotation-requests-${job.job_number}.pdf`,
      pdfBytes,
      recipientCount: letters.recipients.length,
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
