import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import type { AuthenticatedUser } from "../types/domain.js";
import { userRepository } from "../repositories/user.repository.js";
import { projectBriefGenerationRepository } from "../repositories/projectBriefGeneration.repository.js";
import { emailService } from "./email.service.js";
import {
  generatePasswordResetToken,
  hashPassword,
  hashPasswordResetToken,
  verifyPassword
} from "../utils/password.js";

const protectedDemoAccountEmails = new Set(["demo@changeflow.dev", "elena.park@changeflow.dev"]);
const GLOBAL_PROJECT_BRIEF_MONTHLY_LIMIT = 150;
const DEFAULT_DAILY_PROJECT_BRIEF_LIMIT = 3;

function isDemoAccountEmail(email: string) {
  return protectedDemoAccountEmails.has(email.trim().toLowerCase());
}

function getMonthlyWindow(referenceDate = new Date()) {
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);

  return { monthStart, monthEnd };
}

function getDailyWindow(referenceDate = new Date()) {
  const dayStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const dayEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate() + 1);

  return { dayStart, dayEnd };
}

function buildAuthResponse(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "project_manager" | "accounting";
}) {
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
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    }
  };
}

export const authService = {
  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      if (isDemoAccountEmail(email)) {
        throw new ApiError(
          401,
          "Demo credentials are unavailable or out of sync locally. Run `npm run prisma:seed --workspace server` and use password123."
        );
      }

      throw new ApiError(401, "Invalid email or password.");
    }

    return buildAuthResponse(user);
  },
  async register(input: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  }) {
    const existingUser = await userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new ApiError(409, "An account with that email already exists.");
    }

    const user = await userRepository.create({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash: hashPassword(input.password),
      role: "project_manager",
      dailyProjectBriefLimit: DEFAULT_DAILY_PROJECT_BRIEF_LIMIT
    });

    await emailService.sendWelcomeEmail({
      to: user.email,
      firstName: user.firstName
    });

    return buildAuthResponse(user);
  },
  async requestPasswordReset(email: string) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      return {
        message: "If that email exists, reset instructions have been prepared."
      };
    }

    if (isDemoAccountEmail(user.email)) {
      throw new ApiError(403, "Password reset is disabled for seeded demo accounts. Use the default demo credentials instead.");
    }

    const rawToken = generatePasswordResetToken();
    const resetPasswordTokenHash = hashPasswordResetToken(rawToken);
    const resetPasswordExpiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await userRepository.setResetPasswordToken({
      userId: user.id,
      resetPasswordTokenHash,
      resetPasswordExpiresAt
    });

    const delivery = await emailService.sendPasswordResetEmail({
      to: user.email,
      firstName: user.firstName,
      token: rawToken
    });

    return {
      message: delivery.delivered
        ? "If that email exists, reset instructions have been sent."
        : "Reset instructions prepared locally. Use the preview token below to continue.",
      previewToken: delivery.delivered ? undefined : rawToken
    };
  },
  async resetPassword(token: string, password: string) {
    const resetPasswordTokenHash = hashPasswordResetToken(token);
    const user = await userRepository.findByResetPasswordTokenHash(resetPasswordTokenHash);

    if (!user || !user.resetPasswordExpiresAt || new Date(user.resetPasswordExpiresAt).getTime() < Date.now()) {
      throw new ApiError(400, "That reset token is invalid or has expired.");
    }

    if (isDemoAccountEmail(user.email)) {
      throw new ApiError(403, "Password reset is disabled for seeded demo accounts. Use the default demo credentials instead.");
    }

    await userRepository.updatePassword(user.id, hashPassword(password));

    return {
      message: "Password updated. You can sign in with the new password now."
    };
  },
  async getCurrentUser(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
  },
  async updateProfile(
    userId: string,
    input: {
      email: string;
      firstName: string;
      lastName: string;
    }
  ) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    if (isDemoAccountEmail(user.email)) {
      throw new ApiError(403, "Profile editing is disabled for the demo account. Create a local account to test account settings.");
    }

    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedFirstName = input.firstName.trim();
    const normalizedLastName = input.lastName.trim();

    if (!normalizedEmail || !normalizedFirstName || !normalizedLastName) {
      throw new ApiError(400, "First name, last name, and email are required.");
    }

    const existingUser = await userRepository.findByEmail(normalizedEmail);

    if (existingUser && existingUser.id !== userId) {
      throw new ApiError(409, "An account with that email already exists.");
    }

    const updatedUser = await userRepository.updateProfile(userId, {
      email: normalizedEmail,
      firstName: normalizedFirstName,
      lastName: normalizedLastName
    });

    return buildAuthResponse(updatedUser);
  },
  async changePassword(
    userId: string,
    input: {
      currentPassword: string;
      newPassword: string;
    }
  ) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    if (isDemoAccountEmail(user.email)) {
      throw new ApiError(403, "Password changes are disabled for the demo account. Create a local account to test account security.");
    }

    if (!verifyPassword(input.currentPassword, user.passwordHash)) {
      throw new ApiError(400, "Current password is incorrect.");
    }

    if (input.currentPassword === input.newPassword) {
      throw new ApiError(400, "Choose a new password that is different from the current one.");
    }

    await userRepository.updatePassword(user.id, hashPassword(input.newPassword));

    return {
      message: "Password updated successfully."
    };
  },
  async getBriefQuotaDashboard(requestUser: AuthenticatedUser) {
    if (requestUser.role !== "admin") {
      throw new ApiError(403, "Only admins can manage project brief quotas.");
    }

    const { monthStart, monthEnd } = getMonthlyWindow();
    const { dayStart, dayEnd } = getDailyWindow();
    const [users, dailyUsageEvents, globalUsed] = await Promise.all([
      userRepository.listAll(),
      projectBriefGenerationRepository.listForDay(dayStart, dayEnd),
      projectBriefGenerationRepository.countForMonth(monthStart, monthEnd)
    ]);
    const usageByUserId = new Map<string, number>();

    dailyUsageEvents.forEach((event) => {
      usageByUserId.set(event.userId, (usageByUserId.get(event.userId) ?? 0) + 1);
    });

    return {
      globalLimit: GLOBAL_PROJECT_BRIEF_MONTHLY_LIMIT,
      globalUsed,
      globalRemaining: Math.max(0, GLOBAL_PROJECT_BRIEF_MONTHLY_LIMIT - globalUsed),
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
      users: users.map((user) => {
        const usedToday = usageByUserId.get(user.id) ?? 0;

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          dailyProjectBriefLimit: user.dailyProjectBriefLimit,
          usedToday,
          remainingToday: Math.max(0, user.dailyProjectBriefLimit - usedToday)
        };
      })
    };
  },
  async updateUserProjectBriefLimit(
    requestUser: AuthenticatedUser,
    userId: string,
    dailyProjectBriefLimit: number
  ) {
    if (requestUser.role !== "admin") {
      throw new ApiError(403, "Only admins can manage project brief quotas.");
    }

    const targetUser = await userRepository.findById(userId);

    if (!targetUser) {
      throw new ApiError(404, "User not found.");
    }

    if (dailyProjectBriefLimit < 1 || dailyProjectBriefLimit > GLOBAL_PROJECT_BRIEF_MONTHLY_LIMIT) {
      throw new ApiError(400, `User daily limit must be between 1 and ${GLOBAL_PROJECT_BRIEF_MONTHLY_LIMIT}.`);
    }

    const updatedUser = await userRepository.updateDailyProjectBriefLimit(userId, dailyProjectBriefLimit);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      dailyProjectBriefLimit: updatedUser.dailyProjectBriefLimit
    };
  },
  async applyDailyBriefQuotaToAllUsers(requestUser: AuthenticatedUser, dailyProjectBriefLimit: number) {
    if (requestUser.role !== "admin") {
      throw new ApiError(403, "Only admins can manage project brief quotas.");
    }

    if (dailyProjectBriefLimit < 1 || dailyProjectBriefLimit > GLOBAL_PROJECT_BRIEF_MONTHLY_LIMIT) {
      throw new ApiError(400, `Daily limit must be between 1 and ${GLOBAL_PROJECT_BRIEF_MONTHLY_LIMIT}.`);
    }

    const users = await userRepository.updateAllDailyProjectBriefLimits(dailyProjectBriefLimit);

    return {
      updatedCount: users.length,
      dailyProjectBriefLimit
    };
  }
};
