import { dashboardService } from "../services/dashboardService.js";
import { notificationService } from "../services/notificationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const dashboardController = {
  requester: asyncHandler(async (req, res) => {
    const data = await dashboardService.requester(req.user.id);
    res.json(data);
  }),

  approver: asyncHandler(async (req, res) => {
    const data = await dashboardService.approver(req.user.id);
    res.json(data);
  }),

  supplyBranch: asyncHandler(async (req, res) => {
    const data = await dashboardService.supplyBranch(req.user);
    res.json(data);
  }),

  myNotifications: asyncHandler(async (req, res) => {
    const data = await notificationService.myNotifications(req.user.id);
    res.json(data);
  }),
};
