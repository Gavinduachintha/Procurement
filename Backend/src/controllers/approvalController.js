import { approvalService } from "../services/approvalService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const approvalController = {
  decide: asyncHandler(async (req, res) => {
    const data = await approvalService.decide(req.user, Number(req.params.requestId), req.body);
    res.json(data);
  }),

  myPending: asyncHandler(async (req, res) => {
    const rows = await approvalService.myPending(req.user.id);
    res.json(rows);
  }),
};
