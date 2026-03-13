import { authService } from "../services/authService.js";
import { userRepository } from "../repositories/userRepository.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authController = {
  register: asyncHandler(async (req, res) => {
    const data = await authService.register(req.body);
    res.status(201).json(data);
  }),

  login: asyncHandler(async (req, res) => {
    const data = await authService.login(req.body.email, req.body.password);
    res.json(data);
  }),

  me: asyncHandler(async (req, res) => {
    const me = await userRepository.findById(req.user.id);
    res.json(me);
  }),

  usersByRole: asyncHandler(async (req, res) => {
    const role = req.query.role;
    if (!role || typeof role !== "string") {
      return res
        .status(400)
        .json({ message: "Query param 'role' is required" });
    }

    const users = await userRepository.findByRole(role);
    res.json(users);
  }),
};
