import { Router } from "express";
import { procurementController } from "../controllers/procurementController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.post("/requests/:requestId/start", procurementController.startJob);
router.post("/jobs/:jobId/assign-clerk", procurementController.assignClerk);
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

export default router;
