import { Router } from "express";
import authRoutes from "./authRoutes.js";
import requestRoutes from "./requestRoutes.js";
import specificationRoutes from "./specificationRoutes.js";
import approvalRoutes from "./approvalRoutes.js";
import procurementRoutes from "./procurementRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import postProcurementRoutes from "./postProcurementRoutes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ ok: true });
});

router.use("/auth", authRoutes);
router.use("/requests", requestRoutes);
router.use("/specifications", specificationRoutes);
router.use("/approvals", approvalRoutes);
router.use("/procurement", procurementRoutes);
router.use("/post-procurement", postProcurementRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
