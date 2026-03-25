export interface ChangeOrderAttachment {
  id: string;
  changeOrderId: string;
  title: string;
  storageKey: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeOrderComment {
  id: string;
  changeOrderId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeOrderActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ChangeOrder {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: "draft" | "pending_review" | "approved" | "rejected" | "synced";
  archivedAt?: string;
  amount: number;
  requestedBy: string;
  assignedTo?: string;
  externalReference?: string;
  aiSummary?: string;
  attachments: ChangeOrderAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ChangeOrderAttachmentUploadIntent {
  uploadUrl: string;
  storageKey: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  expiresIn: number;
}
