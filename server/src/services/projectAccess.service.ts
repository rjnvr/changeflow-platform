import type { AuthenticatedUser, ProjectRecord } from "../types/domain.js";
import { projectAccessRepository } from "../repositories/projectAccess.repository.js";
import { projectAccessRequestRepository } from "../repositories/projectAccessRequest.repository.js";
import { projectRepository } from "../repositories/project.repository.js";
import { projectTeamMemberRepository } from "../repositories/projectTeamMember.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { ApiError } from "../utils/apiError.js";

function normalizeLookup(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/\s*\(.*\)\s*$/, "");
}

function withAccess(project: ProjectRecord, input: {
  accessSource?: ProjectRecord["accessSource"];
  accessLocked?: boolean;
  accessRequestStatus?: ProjectRecord["accessRequestStatus"];
}) {
  return {
    ...project,
    accessSource: input.accessSource,
    accessLocked: input.accessLocked,
    accessRequestStatus: input.accessRequestStatus
  };
}

export const projectAccessService = {
  async listProjectAccessState(user: AuthenticatedUser, options?: { includeArchived?: boolean }) {
    const projects = await projectRepository.list(options);

    if (user.role === "admin") {
      return {
        accessibleProjects: projects.map((project) => withAccess(project, { accessSource: "admin" as const })),
        lockedProjects: [] as ProjectRecord[],
        accessibleProjectIds: new Set(projects.map((project) => project.id))
      };
    }

    const workspaceUser = await userRepository.findById(user.id);

    if (!workspaceUser) {
      throw new ApiError(404, "User not found.");
    }

    const normalizedFullName = normalizeLookup(`${workspaceUser.firstName} ${workspaceUser.lastName}`);
    const [teamDirectory, grantedProjectIds, requestStatuses] = await Promise.all([
      projectTeamMemberRepository.listDirectory(),
      projectAccessRepository.listGrantedProjectIdsForUser(user.id),
      projectAccessRequestRepository.listLatestStatusesForUser(user.id)
    ]);
    const teamAssignedProjectIds = new Set(
      teamDirectory
        .filter((entry) => normalizeLookup(entry.name) === normalizedFullName)
        .map((entry) => entry.projectId)
    );
    const grantedProjectIdsSet = new Set(grantedProjectIds);
    const requestStatusByProjectId = new Map(requestStatuses.map((entry) => [entry.projectId, entry.status]));
    const accessibleProjects: ProjectRecord[] = [];
    const lockedProjects: ProjectRecord[] = [];

    projects.forEach((project) => {
      if (project.ownerId === user.id) {
        accessibleProjects.push(withAccess(project, { accessSource: "owner" }));
        return;
      }

      if (teamAssignedProjectIds.has(project.id)) {
        accessibleProjects.push(withAccess(project, { accessSource: "team_assignment" }));
        return;
      }

      if (grantedProjectIdsSet.has(project.id)) {
        accessibleProjects.push(withAccess(project, { accessSource: "granted" }));
        return;
      }

      lockedProjects.push(
        withAccess(project, {
          accessLocked: true,
          accessRequestStatus: requestStatusByProjectId.get(project.id)
        })
      );
    });

    return {
      accessibleProjects,
      lockedProjects,
      accessibleProjectIds: new Set(accessibleProjects.map((project) => project.id))
    };
  },
  async listAccessibleProjectIds(user: AuthenticatedUser, options?: { includeArchived?: boolean }) {
    const state = await this.listProjectAccessState(user, options);
    return [...state.accessibleProjectIds];
  },
  async requireProjectAccess(user: AuthenticatedUser, projectId: string) {
    const project = await projectRepository.findById(projectId);

    if (!project) {
      throw new ApiError(404, "Project not found.");
    }

    if (user.role === "admin" || project.ownerId === user.id) {
      return withAccess(project, {
        accessSource: user.role === "admin" ? "admin" : "owner"
      });
    }

    const accessibleProjectIds = await this.listAccessibleProjectIds(user, { includeArchived: true });

    if (accessibleProjectIds.includes(projectId)) {
      return project;
    }

    throw new ApiError(403, "This project is locked. Request access from an admin to open it.");
  }
};
