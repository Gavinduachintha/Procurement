import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.post(
  "/register",
  authenticate,
  authorize("ADMIN"),
  authController.register,
);
router.post("/login", authController.login);
router.get("/me", authenticate, authController.me);
router.get(
  "/users",
  authenticate,
  authorize("ADMIN", "SUPPLY_BRANCH"),
  authController.usersByRole,
);
router.post("/change-password", authenticate, authController.changePassword);

export default router;
