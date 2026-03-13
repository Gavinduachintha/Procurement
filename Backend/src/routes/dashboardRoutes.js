import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.get("/requester", dashboardController.requester);
router.get("/approver", dashboardController.approver);
router.get("/supply-branch", dashboardController.supplyBranch);
router.get("/notifications", dashboardController.myNotifications);

export default router;
