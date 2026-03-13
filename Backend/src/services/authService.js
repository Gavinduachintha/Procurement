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
};
