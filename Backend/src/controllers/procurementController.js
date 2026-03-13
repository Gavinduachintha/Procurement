import { procurementService } from "../services/procurementService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const procurementController = {
  startJob: asyncHandler(async (req, res) => {
    const job = await procurementService.chooseMethodAndCreateJob(
      req.user,
      Number(req.params.requestId),
      req.body.procurementMethod,
    );
    res.status(201).json(job);
  }),

  assignClerk: asyncHandler(async (req, res) => {
    const job = await procurementService.assignSubjectClerk(
      req.user,
      Number(req.params.jobId),
      Number(req.body.clerkId),
    );
    res.json(job);
  }),

  selectCategory: asyncHandler(async (req, res) => {
    const suppliers = await procurementService.selectSupplierCategory(
      req.user,
      Number(req.params.jobId),
      req.body.category,
    );
    res.json(suppliers);
  }),

  selectSuppliers: asyncHandler(async (req, res) => {
    const selected = await procurementService.selectSuppliers(
      req.user,
      Number(req.params.jobId),
      req.body.supplierIds || [],
    );
    res.json(selected);
  }),

  generateLetters: asyncHandler(async (req, res) => {
    const result = await procurementService.generateQuotationLetters(
      req.user,
      Number(req.params.jobId),
      req.body,
    );
    res.json(result);
  }),

  schedule: asyncHandler(async (req, res) => {
    const schedule = await procurementService.getProcurementSchedule(Number(req.params.jobId));
    res.json(schedule);
  }),
};
