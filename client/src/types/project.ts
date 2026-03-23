export interface Project {
  id: string;
  name: string;
  code: string;
  location: string;
  status: "active" | "on-hold" | "completed";
  contractValue: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

