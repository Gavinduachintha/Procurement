import { Router } from "express";
import { approvalController } from "../controllers/approvalController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.get("/mine/pending", approvalController.myPending);
router.post("/:requestId/decision", approvalController.decide);

export default router;
