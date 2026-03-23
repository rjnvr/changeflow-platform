export interface ChangeOrder {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: "draft" | "pending_review" | "approved" | "rejected" | "synced";
  amount: number;
  requestedBy: string;
  externalReference?: string;
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
}

