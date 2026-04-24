import { Router } from "express";
import { procurementController } from "../controllers/procurementController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.post("/suppliers", procurementController.createSupplier);
router.get("/suppliers", procurementController.listSuppliers);
router.post("/requests/:requestId/start", procurementController.startJob);
router.post("/jobs/:jobId/assign-clerk", procurementController.assignClerk);
router.post("/jobs/:jobId/set-method", procurementController.setMethod);
router.post(
  "/jobs/:jobId/select-category",
  procurementController.selectCategory,
);
router.post(
  "/jobs/:jobId/select-suppliers",
  procurementController.selectSuppliers,
);
router.post(
  "/jobs/:jobId/generate-letters",
  procurementController.generateLetters,
);
router.get("/jobs/:jobId/schedule", procurementController.schedule);
router.patch(
  "/jobs/:jobId/schedule/lines/:supplierId",
  procurementController.updateScheduleLine,
);
router.post(
  "/jobs/:jobId/schedule/freeze",
  procurementController.freezeSchedule,
);
router.post("/jobs/:jobId/send-to-tec", procurementController.sendToTec);
router.get(
  "/jobs/:jobId/tec-recommendations",
  procurementController.listTecRecommendations,
);
router.post(
  "/jobs/:jobId/tec-recommendations",
  procurementController.saveTecRecommendations,
);
router.post(
  "/jobs/:jobId/committee-report/generate",
  procurementController.generateCommitteeReport,
);
router.post(
  "/jobs/:jobId/committee-route",
  procurementController.routeToCommittee,
);

// Alternative routes (matching frontend expectations)
// POST /procurement/:requestId/method -> creates job with procurement method for approved request
router.post("/:requestId/method", procurementController.startJob);

// POST /procurement/:jobId/suppliers -> selects suppliers
router.post("/:jobId/suppliers", procurementController.selectSuppliers);

export default router;
