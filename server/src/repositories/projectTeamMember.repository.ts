import type { PrismaClient } from "@prisma/client";

import { prisma } from "../config/db.js";
import type {
  ProjectTeamMemberDirectoryRecord,
  ProjectTeamMemberRecord
} from "../types/domain.js";

const projectTeamMemberClient = (prisma as PrismaClient & {
  projectTeamMember: {
    findMany(args: unknown): Promise<
      Array<{
        id: string;
        projectId: string;
        name: string;
        role: string;
        createdAt: Date;
        updatedAt: Date;
      }>
    >;
    create(args: unknown): Promise<{
      id: string;
      projectId: string;
      name: string;
      role: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
    findFirst(args: unknown): Promise<
      | {
          id: string;
          projectId: string;
          name: string;
          role: string;
          createdAt: Date;
          updatedAt: Date;
        }
      | null
    >;
    update(args: unknown): Promise<{
      id: string;
      projectId: string;
      name: string;
      role: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
    delete(args: unknown): Promise<{
      id: string;
      projectId: string;
      name: string;
      role: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
  };
}).projectTeamMember;

function mapProjectTeamMember(member: {
  id: string;
  projectId: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}): ProjectTeamMemberRecord {
  return {
    id: member.id,
    projectId: member.projectId,
    name: member.name,
    role: member.role,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString()
  };
}

function mapDirectoryMember(member: {
  id: string;
  projectId: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  project: {
    name: string;
    code: string;
    location: string;
  };
}): ProjectTeamMemberDirectoryRecord {
  return {
    ...mapProjectTeamMember(member),
    projectName: member.project.name,
    projectCode: member.project.code,
    projectLocation: member.project.location
  };
}

export const projectTeamMemberRepository = {
  async listByProject(projectId: string) {
    const teamMembers = await projectTeamMemberClient.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "asc" }, { name: "asc" }]
    });

    return teamMembers.map(mapProjectTeamMember);
  },
  async listDirectory() {
    const teamMembers = (await projectTeamMemberClient.findMany({
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      include: {
        project: {
          select: {
            name: true,
            code: true,
            location: true
          }
        }
      }
    })) as Array<{
      id: string;
      projectId: string;
      name: string;
      role: string;
      createdAt: Date;
      updatedAt: Date;
      project: {
        name: string;
        code: string;
        location: string;
      };
    }>;

    return teamMembers.map((member) => mapDirectoryMember(member));
  },
  async create(input: Omit<ProjectTeamMemberRecord, "id" | "createdAt" | "updatedAt">) {
    const createdMember = await projectTeamMemberClient.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        role: input.role
      }
    });

    return mapProjectTeamMember(createdMember);
  },
  async findById(projectId: string, teamMemberId: string) {
    const teamMember = await projectTeamMemberClient.findFirst({
      where: {
        id: teamMemberId,
        projectId
      }
    });

    return teamMember ? mapProjectTeamMember(teamMember) : null;
  },
  async update(
    projectId: string,
    teamMemberId: string,
    input: {
      name: string;
      role: string;
    }
  ) {
    const existing = await projectTeamMemberClient.findFirst({
      where: {
        id: teamMemberId,
        projectId
      }
    });

    if (!existing) {
      return null;
    }

    const updatedMember = await projectTeamMemberClient.update({
      where: { id: teamMemberId },
      data: {
        name: input.name,
        role: input.role
      }
    });

    return mapProjectTeamMember(updatedMember);
  },
  async delete(projectId: string, teamMemberId: string) {
    const existing = await projectTeamMemberClient.findFirst({
      where: {
        id: teamMemberId,
        projectId
      }
    });

    if (!existing) {
      return null;
    }

    const deletedMember = await projectTeamMemberClient.delete({
      where: { id: teamMemberId }
    });

    return mapProjectTeamMember(deletedMember);
  }
};
