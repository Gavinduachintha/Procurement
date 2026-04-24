import { procurementService } from "../services/procurementService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const procurementController = {
  createSupplier: asyncHandler(async (req, res) => {
    const supplier = await procurementService.createSupplier(
      req.user,
      req.body,
    );
    res.status(201).json(supplier);
  }),

  listSuppliers: asyncHandler(async (req, res) => {
    const suppliers = await procurementService.listSuppliers(req.user);
    res.json(suppliers);
  }),

  startJob: asyncHandler(async (req, res) => {
    const job = await procurementService.chooseMethodAndCreateJob(
      req.user,
      Number(req.params.requestId),
      req.body.method || req.body.procurementMethod,
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

  setMethod: asyncHandler(async (req, res) => {
    const job = await procurementService.setProcurementMethod(
      req.user,
      Number(req.params.jobId),
      req.body.method || req.body.procurementMethod,
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
      req.body.supplierIds || req.body.supplier_ids || [],
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
    const schedule = await procurementService.getProcurementSchedule(
      Number(req.params.jobId),
    );
    res.json(schedule);
  }),

  updateScheduleLine: asyncHandler(async (req, res) => {
    const updated = await procurementService.updateProcurementScheduleLine(
      req.user,
      Number(req.params.jobId),
      Number(req.params.supplierId),
      req.body,
    );
    res.json(updated);
  }),

  freezeSchedule: asyncHandler(async (req, res) => {
    const frozen = await procurementService.freezeProcurementSchedule(
      req.user,
      Number(req.params.jobId),
    );
    res.json(frozen);
  }),
};
