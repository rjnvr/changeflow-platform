import crypto from "node:crypto";

import type { ProjectRecord } from "../types/domain.js";

const projects: ProjectRecord[] = [
  {
    id: "prj_h26_001",
    name: "Harbor 26 Tower",
    code: "H26-TOWER",
    location: "Toronto, ON",
    status: "active",
    contractValue: 4750000,
    ownerId: "usr_demo_1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const projectRepository = {
  list() {
    return projects;
  },
  findById(projectId: string) {
    return projects.find((project) => project.id === projectId) ?? null;
  },
  create(project: Omit<ProjectRecord, "id" | "createdAt" | "updatedAt">) {
    const newProject: ProjectRecord = {
      id: `prj_${crypto.randomUUID().slice(0, 8)}`,
      ...project,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    projects.unshift(newProject);
    return newProject;
  }
};
