import { requestService } from "../services/requestService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requestController = {
  create: asyncHandler(async (req, res) => {
    const request = await requestService.submitRequest(req.user, req.body);
    res.status(201).json(request);
  }),

  mine: asyncHandler(async (req, res) => {
    const requests = await requestService.myRequests(req.user.id);
    res.json(requests);
  }),

  getById: asyncHandler(async (req, res) => {
    const request = await requestService.getRequest(Number(req.params.id));
    res.json(request);
  }),
};
