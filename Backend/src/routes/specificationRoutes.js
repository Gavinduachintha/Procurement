import { Router } from "express";
import { specificationController } from "../controllers/specificationController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.post("/:requestId/review", specificationController.review);
router.post("/:requestId/requester-confirmation", specificationController.requesterConfirm);

export default router;
