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
router.post(
  "/jobs/:jobId/generate-letters-pdf",
  procurementController.generateLettersPdf,
);
router.get("/jobs/:jobId/schedule", procurementController.schedule);

// Alternative routes (matching frontend expectations)
// POST /procurement/:requestId/method -> creates job with procurement method for approved request
router.post("/:requestId/method", procurementController.startJob);

// POST /procurement/:jobId/suppliers -> selects suppliers
router.post("/:jobId/suppliers", procurementController.selectSuppliers);

export default router;
