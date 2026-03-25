import type { PrismaClient } from "@prisma/client";

import { prisma } from "../config/db.js";
import type { AuthenticatedUser } from "../types/domain.js";

interface UserRecord extends AuthenticatedUser {
  firstName: string;
  lastName: string;
  passwordHash: string;
  resetPasswordTokenHash?: string;
  resetPasswordExpiresAt?: string;
}

function mapUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  resetPasswordTokenHash: string | null;
  resetPasswordExpiresAt: Date | null;
  role: AuthenticatedUser["role"];
}): UserRecord {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    passwordHash: user.passwordHash,
    resetPasswordTokenHash: user.resetPasswordTokenHash ?? undefined,
    resetPasswordExpiresAt: user.resetPasswordExpiresAt?.toISOString(),
    role: user.role
  };
}

function normalizePersonLookup(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/\s*\(.*\)\s*$/, "");
}

const userClient = (prisma as PrismaClient & {
  user: {
    findUnique(args: unknown): Promise<
      | {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          passwordHash: string;
          resetPasswordTokenHash: string | null;
          resetPasswordExpiresAt: Date | null;
          role: AuthenticatedUser["role"];
        }
      | null
    >;
    findMany(args?: unknown): Promise<
      Array<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        passwordHash: string;
        resetPasswordTokenHash: string | null;
        resetPasswordExpiresAt: Date | null;
        role: AuthenticatedUser["role"];
      }>
    >;
    create(args: unknown): Promise<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      passwordHash: string;
      resetPasswordTokenHash: string | null;
      resetPasswordExpiresAt: Date | null;
      role: AuthenticatedUser["role"];
    }>;
    update(args: unknown): Promise<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      passwordHash: string;
      resetPasswordTokenHash: string | null;
      resetPasswordExpiresAt: Date | null;
      role: AuthenticatedUser["role"];
    }>;
  };
}).user;

export const userRepository = {
  async findByEmail(email: string) {
    const user = await userClient.findUnique({
      where: { email }
    });

    return user ? mapUser(user) : null;
  },
  async findById(id: string) {
    const user = await userClient.findUnique({
      where: { id }
    });

    return user ? mapUser(user) : null;
  },
  async findByResetPasswordTokenHash(resetPasswordTokenHash: string) {
    const user = await userClient.findUnique({
      where: { resetPasswordTokenHash }
    });

    return user ? mapUser(user) : null;
  },
  async findByNameOrEmail(nameOrEmail: string) {
    const normalizedLookup = normalizePersonLookup(nameOrEmail);

    if (!normalizedLookup) {
      return null;
    }

    const users = await userClient.findMany({
      orderBy: [{ createdAt: "asc" }]
    });

    const matchedUser = users.find((user) => {
      const normalizedEmail = normalizePersonLookup(user.email);
      const normalizedFullName = normalizePersonLookup(`${user.firstName} ${user.lastName}`);

      return normalizedLookup === normalizedEmail || normalizedLookup === normalizedFullName;
    });

    return matchedUser ? mapUser(matchedUser) : null;
  },
  async create(input: {
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    role: AuthenticatedUser["role"];
  }) {
    const createdUser = await userClient.create({
      data: input
    });

    return mapUser(createdUser);
  },
  async updateProfile(
    userId: string,
    input: {
      email: string;
      firstName: string;
      lastName: string;
    }
  ) {
    const updatedUser = await userClient.update({
      where: { id: userId },
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName
      }
    });

    return mapUser(updatedUser);
  },
  async updatePassword(userId: string, passwordHash: string) {
    const updatedUser = await userClient.update({
      where: { id: userId },
      data: {
        passwordHash,
        resetPasswordTokenHash: null,
        resetPasswordExpiresAt: null
      }
    });

    return mapUser(updatedUser);
  },
  async setResetPasswordToken(input: {
    userId: string;
    resetPasswordTokenHash: string;
    resetPasswordExpiresAt: Date;
  }) {
    const updatedUser = await userClient.update({
      where: { id: input.userId },
      data: {
        resetPasswordTokenHash: input.resetPasswordTokenHash,
        resetPasswordExpiresAt: input.resetPasswordExpiresAt
      }
    });

    return mapUser(updatedUser);
  }
};
