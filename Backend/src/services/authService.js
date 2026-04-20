import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/userRepository.js";
import { ApiError } from "../utils/apiError.js";

const signToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

export const authService = {
  async register(payload) {
    const existing = await userRepository.findByEmail(payload.email);
    if (existing) {
      throw new ApiError(409, "Email already exists");
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await userRepository.create({
      fullName: payload.fullName,
      email: payload.email,
      passwordHash,
      role: payload.role,
      department: payload.department,
    });

    return {
      user,
      token: signToken(user),
    };
  },

  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new ApiError(401, "Invalid credentials");
    }

    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      department: user.department,
      created_at: user.created_at,
    };

    return {
      user: safeUser,
      token: signToken(safeUser),
    };
  },

  async changePassword(userId, payload) {
    const currentPassword = String(payload?.currentPassword || "");
    const newPassword = String(payload?.newPassword || "");
    const confirmPassword = String(payload?.confirmPassword || "");

    if (!currentPassword) {
      throw new ApiError(400, "Current password is required");
    }

    if (newPassword.length < 6) {
      throw new ApiError(400, "New password must be at least 6 characters");
    }

    if (newPassword !== confirmPassword) {
      throw new ApiError(400, "New password and confirm password do not match");
    }

    if (newPassword === currentPassword) {
      throw new ApiError(
        400,
        "New password must be different from current password",
      );
    }

    const authUser = await userRepository.findAuthById(userId);
    if (!authUser) {
      throw new ApiError(404, "User not found");
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      authUser.password_hash,
    );
    if (!isMatch) {
      throw new ApiError(401, "Current password is incorrect");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePasswordHash(userId, newPasswordHash);

    return { message: "Password changed successfully" };
  },
};
