import { postProcurementService } from "../services/postProcurementService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const postProcurementController = {
  sendToTec: asyncHandler(async (req, res) => {
    const result = await postProcurementService.sendScheduleToTec(
      req.user,
      Number(req.params.jobId),
    );
    res.json(result);
  }),

  enterTecDecisions: asyncHandler(async (req, res) => {
    const result = await postProcurementService.enterTecDecisions(
      req.user,
      Number(req.params.jobId),
      req.body,
    );
    res.json(result);
  }),

  committeeReport: asyncHandler(async (req, res) => {
    const result = await postProcurementService.getCommitteeReport(
      req.user,
      Number(req.params.jobId),
    );
    res.json(result);
  }),

  routeCommittee: asyncHandler(async (req, res) => {
    const result = await postProcurementService.routeToCommittee(
      req.user,
      Number(req.params.jobId),
    );
    res.json(result);
  }),

  committeeDecision: asyncHandler(async (req, res) => {
    const result = await postProcurementService.recordCommitteeDecision(
      req.user,
      Number(req.params.jobId),
      req.body,
    );
    res.json(result);
  }),

  generatePurchaseOrders: asyncHandler(async (req, res) => {
    const result = await postProcurementService.generatePurchaseOrders(
      req.user,
      Number(req.params.jobId),
      req.body,
    );
    res.status(201).json(result);
  }),

  listPurchaseOrders: asyncHandler(async (req, res) => {
    const result = await postProcurementService.listPurchaseOrders(
      req.user,
      Number(req.params.jobId),
    );
    res.json(result);
  }),

  getDeliveryByToken: asyncHandler(async (req, res) => {
    const result = await postProcurementService.getDeliveryConfirmationByToken(
      req.params.token,
    );
    res.json(result);
  }),

  confirmDeliveryByToken: asyncHandler(async (req, res) => {
    const result = await postProcurementService.confirmDeliveryByToken(
      req.params.token,
      req.body,
    );
    res.json(result);
  }),

  generateDeliveryNote: asyncHandler(async (req, res) => {
    const result = await postProcurementService.generateDeliveryNote(
      req.user,
      Number(req.params.purchaseOrderId),
      req.body,
    );
    res.status(201).json(result);
  }),

  generatePaymentVoucher: asyncHandler(async (req, res) => {
    const result = await postProcurementService.generatePaymentVoucher(
      req.user,
      Number(req.params.purchaseOrderId),
      req.body,
    );
    res.status(201).json(result);
  }),

  quarterlyReport: asyncHandler(async (req, res) => {
    const result = await postProcurementService.quarterlyReport(
      req.user,
      req.query,
    );
    res.json(result);
  }),

  annualReport: asyncHandler(async (req, res) => {
    const result = await postProcurementService.annualReport(
      req.user,
      req.query,
    );
    res.json(result);
  }),
};
