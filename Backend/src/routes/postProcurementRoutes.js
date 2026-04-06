import { Router } from "express";
import { postProcurementController } from "../controllers/postProcurementController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get(
  "/delivery/confirm/:token",
  postProcurementController.getDeliveryByToken,
);
router.post(
  "/delivery/confirm/:token",
  postProcurementController.confirmDeliveryByToken,
);

router.use(authenticate);

router.post("/jobs/:jobId/send-to-tec", postProcurementController.sendToTec);
router.post(
  "/jobs/:jobId/tec-decisions",
  postProcurementController.enterTecDecisions,
);
router.get(
  "/jobs/:jobId/committee-report",
  postProcurementController.committeeReport,
);
router.post(
  "/jobs/:jobId/route-committee",
  postProcurementController.routeCommittee,
);
router.post(
  "/jobs/:jobId/committee-decision",
  postProcurementController.committeeDecision,
);
router.post(
  "/jobs/:jobId/purchase-orders",
  postProcurementController.generatePurchaseOrders,
);
router.get(
  "/jobs/:jobId/purchase-orders",
  postProcurementController.listPurchaseOrders,
);

router.post(
  "/purchase-orders/:purchaseOrderId/delivery-note",
  postProcurementController.generateDeliveryNote,
);
router.post(
  "/purchase-orders/:purchaseOrderId/payment-voucher",
  postProcurementController.generatePaymentVoucher,
);

router.get("/reports/quarterly", postProcurementController.quarterlyReport);
router.get("/reports/annual", postProcurementController.annualReport);

export default router;
