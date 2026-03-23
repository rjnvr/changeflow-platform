import type { User } from "./user";

export interface Project {
  id: string;
  name: string;
  code: string;
  location: string;
  status: "active" | "on-hold" | "completed";
  contractValue: number;
  ownerId: string;
  owner?: User;
  createdAt: string;
  updatedAt: string;
}

