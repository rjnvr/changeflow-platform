import { prisma } from "../config/db.js";

type ProjectBriefGenerationRow = {
  id: string;
  userId: string;
  projectId: string;
  createdAt: Date;
};

const projectBriefGenerationClient = (prisma as unknown as {
  projectBriefGeneration: {
    create(args: unknown): Promise<ProjectBriefGenerationRow>;
    count(args: unknown): Promise<number>;
    findMany(args: unknown): Promise<ProjectBriefGenerationRow[]>;
  };
}).projectBriefGeneration;

export const projectBriefGenerationRepository = {
  async create(input: { userId: string; projectId: string }) {
    return projectBriefGenerationClient.create({
      data: {
        userId: input.userId,
        projectId: input.projectId
      }
    });
  },
  async countForMonth(monthStart: Date, monthEnd: Date) {
    return projectBriefGenerationClient.count({
      where: {
        createdAt: {
          gte: monthStart,
          lt: monthEnd
        }
      }
    });
  },
  async countForUserDay(userId: string, dayStart: Date, dayEnd: Date) {
    return projectBriefGenerationClient.count({
      where: {
        userId,
        createdAt: {
          gte: dayStart,
          lt: dayEnd
        }
      }
    });
  },
  async listForDay(dayStart: Date, dayEnd: Date) {
    return projectBriefGenerationClient.findMany({
      where: {
        createdAt: {
          gte: dayStart,
          lt: dayEnd
        }
      },
      orderBy: [{ createdAt: "desc" }]
    });
  },
  async listForMonth(monthStart: Date, monthEnd: Date) {
    return projectBriefGenerationClient.findMany({
      where: {
        createdAt: {
          gte: monthStart,
          lt: monthEnd
        }
      },
      orderBy: [{ createdAt: "desc" }]
    });
  }
};
