import { asyncHandler } from "../utils/asyncHandler.js";
import { masterProcurementPlanService } from "../services/masterProcurementPlanService.js";

export const masterProcurementPlanController = {
  create: asyncHandler(async (req, res) => {
    const created = await masterProcurementPlanService.createOrDraft(
      req.user,
      req.body,
    );
    res.status(201).json(created);
  }),

  mine: asyncHandler(async (req, res) => {
    const plans = await masterProcurementPlanService.listMine(req.user);
    res.json(plans);
  }),

  metadata: asyncHandler(async (req, res) => {
    const metadata = masterProcurementPlanService.getFormMetadata();
    res.json(metadata);
  }),
};
