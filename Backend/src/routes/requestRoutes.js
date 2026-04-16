import { Router } from "express";
import { requestController } from "../controllers/requestController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.post("/", requestController.create);
router.get("/mine", requestController.mine);
router.get("/assigned/specification", requestController.assignedForChecker);
router.get("/assigned/specifications", requestController.assignedForChecker);
router.get(
  "/assigned/specification/all",
  requestController.assignedForCheckerAll,
);
router.get(
  "/assigned/specifications/all",
  requestController.assignedForCheckerAll,
);
router.get("/approved/without-jobs", requestController.approvedWithoutJobs);
router.get("/:id", requestController.getById);

export default router;
