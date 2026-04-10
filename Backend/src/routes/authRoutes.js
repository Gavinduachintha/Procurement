import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.post(
	"/register",
	authenticate,
	authorize("REGISTRAR", "VICE_CHANCELLOR"),
	authController.register,
);
router.post("/login", authController.login);
router.get("/me", authenticate, authController.me);
router.get("/users", authenticate, authController.usersByRole);

export default router;
