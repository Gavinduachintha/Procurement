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

  assignedForChecker: asyncHandler(async (req, res) => {
    const requests = await requestService.checkerAssignedRequests(req.user.id);
    res.json(requests);
  }),

  assignedForCheckerAll: asyncHandler(async (req, res) => {
    const requests = await requestService.checkerAssignedRequests(
      req.user.id,
      true,
    );
    res.json(requests);
  }),

  approvedWithoutJobs: asyncHandler(async (req, res) => {
    const requests = await requestService.approvedRequestsWithoutJobs();
    res.json(requests);
  }),

  getById: asyncHandler(async (req, res) => {
    const request = await requestService.getRequest(Number(req.params.id));
    res.json(request);
  }),

  modifyByRequester: asyncHandler(async (req, res) => {
    const request = await requestService.modifyRequest(
      req.user,
      Number(req.params.id),
      req.body,
    );
    res.json(request);
  }),
};
