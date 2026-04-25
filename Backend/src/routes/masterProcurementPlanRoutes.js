import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { masterProcurementPlanController } from "../controllers/masterProcurementPlanController.js";

const router = Router();

router.use(authenticate);
router.get("/metadata", masterProcurementPlanController.metadata);
router.get("/mine", masterProcurementPlanController.mine);
router.post("/", masterProcurementPlanController.create);

export default router;
