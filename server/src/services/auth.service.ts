import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { userRepository } from "../repositories/user.repository.js";

export const authService = {
  login(email: string, password: string) {
    const user = userRepository.findByEmail(email);

    if (!user || user.password !== password) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  },
  getCurrentUser(userId: string) {
    const user = userRepository.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role
    };
  }
};

