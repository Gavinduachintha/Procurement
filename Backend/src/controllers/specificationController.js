import { specificationService } from "../services/specificationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const specificationController = {
  review: asyncHandler(async (req, res) => {
    const data = await specificationService.reviewSpecification(
      req.user,
      Number(req.params.requestId),
      req.body,
    );
    res.json(data);
  }),

  requesterConfirm: asyncHandler(async (req, res) => {
    const data = await specificationService.requesterConfirmation(
      req.user,
      Number(req.params.requestId),
      req.body,
    );
    res.json(data);
  }),
};
