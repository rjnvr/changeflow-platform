import type { PrismaClient } from "@prisma/client";

import { prisma } from "../config/db.js";
import type { AuthenticatedUser } from "../types/domain.js";

interface UserRecord extends AuthenticatedUser {
  firstName: string;
  lastName: string;
  passwordHash: string;
  dailyProjectBriefLimit: number;
  resetPasswordTokenHash?: string;
  resetPasswordExpiresAt?: string;
}

function mapUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  dailyProjectBriefLimit?: number;
  monthlyProjectBriefLimit?: number;
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
    dailyProjectBriefLimit: user.dailyProjectBriefLimit ?? user.monthlyProjectBriefLimit ?? 3,
    resetPasswordTokenHash: user.resetPasswordTokenHash ?? undefined,
    resetPasswordExpiresAt: user.resetPasswordExpiresAt?.toISOString(),
    role: user.role
  };
}

function normalizePersonLookup(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/\s*\(.*\)\s*$/, "");
}

let cachedProjectBriefLimitColumn: "dailyProjectBriefLimit" | "monthlyProjectBriefLimit" | null | undefined;

async function getProjectBriefLimitColumn() {
  if (cachedProjectBriefLimitColumn !== undefined) {
    return cachedProjectBriefLimitColumn;
  }

  const columns = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'User'
        AND column_name IN ('dailyProjectBriefLimit', 'monthlyProjectBriefLimit')
    `
  );

  if (columns.some((column) => column.column_name === "dailyProjectBriefLimit")) {
    cachedProjectBriefLimitColumn = "dailyProjectBriefLimit";
    return cachedProjectBriefLimitColumn;
  }

  if (columns.some((column) => column.column_name === "monthlyProjectBriefLimit")) {
    cachedProjectBriefLimitColumn = "monthlyProjectBriefLimit";
    return cachedProjectBriefLimitColumn;
  }

  cachedProjectBriefLimitColumn = null;
  return cachedProjectBriefLimitColumn;
}

function mapCompatibleQuotaUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  projectBriefLimit: number;
  resetPasswordTokenHash: string | null;
  resetPasswordExpiresAt: Date | null;
  role: AuthenticatedUser["role"];
}) {
  return mapUser({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    passwordHash: user.passwordHash,
    dailyProjectBriefLimit: user.projectBriefLimit,
    resetPasswordTokenHash: user.resetPasswordTokenHash,
    resetPasswordExpiresAt: user.resetPasswordExpiresAt,
    role: user.role
  });
}

const authUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  passwordHash: true,
  resetPasswordTokenHash: true,
  resetPasswordExpiresAt: true,
  role: true
} as const;

const userClient = (prisma as PrismaClient & {
  user: {
    findUnique(args: unknown): Promise<
      | {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          passwordHash: string;
          dailyProjectBriefLimit?: number;
          monthlyProjectBriefLimit?: number;
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
        dailyProjectBriefLimit?: number;
        monthlyProjectBriefLimit?: number;
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
      dailyProjectBriefLimit?: number;
      monthlyProjectBriefLimit?: number;
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
      dailyProjectBriefLimit?: number;
      monthlyProjectBriefLimit?: number;
      resetPasswordTokenHash: string | null;
      resetPasswordExpiresAt: Date | null;
      role: AuthenticatedUser["role"];
    }>;
    updateMany(args: unknown): Promise<unknown>;
  };
}).user;

export const userRepository = {
  async findByEmail(email: string) {
    const user = await userClient.findUnique({
      where: { email },
      select: authUserSelect
    });

    return user ? mapUser(user) : null;
  },
  async findById(id: string) {
    const user = await userClient.findUnique({
      where: { id },
      select: authUserSelect
    });

    return user ? mapUser(user) : null;
  },
  async findByResetPasswordTokenHash(resetPasswordTokenHash: string) {
    const user = await userClient.findUnique({
      where: { resetPasswordTokenHash },
      select: authUserSelect
    });

    return user ? mapUser(user) : null;
  },
  async findByNameOrEmail(nameOrEmail: string) {
    const normalizedLookup = normalizePersonLookup(nameOrEmail);

    if (!normalizedLookup) {
      return null;
    }

    const users = await userClient.findMany({
      orderBy: [{ createdAt: "asc" }],
      select: authUserSelect
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
    dailyProjectBriefLimit?: number;
  }) {
    const createdUser = await userClient.create({
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash: input.passwordHash,
        role: input.role
      },
      select: authUserSelect
    });

    return mapUser(createdUser);
  },
  async listAll() {
    const projectBriefLimitColumn = await getProjectBriefLimitColumn();
    const projectBriefLimitSelect = projectBriefLimitColumn
      ? `"${projectBriefLimitColumn}"::int AS "projectBriefLimit"`
      : `3::int AS "projectBriefLimit"`;
    const users = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        passwordHash: string;
        projectBriefLimit: number;
        resetPasswordTokenHash: string | null;
        resetPasswordExpiresAt: Date | null;
        role: AuthenticatedUser["role"];
      }>
    >(
      `
        SELECT
          "id",
          "email",
          "firstName",
          "lastName",
          "passwordHash",
          ${projectBriefLimitSelect},
          "resetPasswordTokenHash",
          "resetPasswordExpiresAt",
          "role"
        FROM "User"
        ORDER BY "role" ASC, "firstName" ASC, "lastName" ASC
      `
    );

    return users.map(mapCompatibleQuotaUser);
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
      },
      select: authUserSelect
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
      },
      select: authUserSelect
    });

    return mapUser(updatedUser);
  },
  async updateDailyProjectBriefLimit(userId: string, dailyProjectBriefLimit: number) {
    const projectBriefLimitColumn = await getProjectBriefLimitColumn();

    if (!projectBriefLimitColumn) {
      const existingUser = await userClient.findUnique({
        where: { id: userId },
        select: authUserSelect
      });

      if (!existingUser) {
        throw new Error("User not found.");
      }

      return mapCompatibleQuotaUser({
        id: existingUser.id,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        passwordHash: existingUser.passwordHash,
        projectBriefLimit: dailyProjectBriefLimit,
        resetPasswordTokenHash: existingUser.resetPasswordTokenHash,
        resetPasswordExpiresAt: existingUser.resetPasswordExpiresAt,
        role: existingUser.role
      });
    }

    const updatedUsers = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        passwordHash: string;
        projectBriefLimit: number;
        resetPasswordTokenHash: string | null;
        resetPasswordExpiresAt: Date | null;
        role: AuthenticatedUser["role"];
      }>
    >(
      `
        UPDATE "User"
        SET "${projectBriefLimitColumn}" = $1, "updatedAt" = NOW()
        WHERE "id" = $2
        RETURNING
          "id",
          "email",
          "firstName",
          "lastName",
          "passwordHash",
          "${projectBriefLimitColumn}"::int AS "projectBriefLimit",
          "resetPasswordTokenHash",
          "resetPasswordExpiresAt",
          "role"
      `,
      dailyProjectBriefLimit,
      userId
    );

    const updatedUser = updatedUsers[0];

    if (!updatedUser) {
      throw new Error("User not found.");
    }

    return mapCompatibleQuotaUser(updatedUser);
  },
  async updateAllDailyProjectBriefLimits(dailyProjectBriefLimit: number) {
    const projectBriefLimitColumn = await getProjectBriefLimitColumn();

    if (projectBriefLimitColumn) {
      await prisma.$executeRawUnsafe(
        `
          UPDATE "User"
          SET "${projectBriefLimitColumn}" = $1, "updatedAt" = NOW()
        `,
        dailyProjectBriefLimit
      );
    }

    return this.listAll();
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
      },
      select: authUserSelect
    });

    return mapUser(updatedUser);
  }
};
