import { randomUUID } from "node:crypto";

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

const maxUploadSizeBytes = 25 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "document";
}

function assertStorageConfigured() {
  if (!env.S3_BUCKET || !env.S3_REGION || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    throw new ApiError(503, "S3 storage is not configured on the server.");
  }
}

let storageClient: S3Client | null = null;

function getStorageClient() {
  assertStorageConfigured();

  if (!storageClient) {
    storageClient = new S3Client({
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY
      }
    });
  }

  return storageClient;
}

export const storageService = {
  maxUploadSizeBytes,
  isConfigured() {
    return Boolean(env.S3_BUCKET && env.S3_REGION && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY);
  },
  async createProjectDocumentUploadIntent(input: {
    projectId: string;
    fileName: string;
    contentType?: string;
    fileSize: number;
  }) {
    assertStorageConfigured();

    if (!input.fileName.trim()) {
      throw new ApiError(400, "A file name is required for upload.");
    }

    if (!Number.isFinite(input.fileSize) || input.fileSize <= 0) {
      throw new ApiError(400, "A valid file size is required for upload.");
    }

    if (input.fileSize > maxUploadSizeBytes) {
      throw new ApiError(400, "Files must be 25 MB or smaller.");
    }

    const normalizedContentType = input.contentType?.trim() || "application/octet-stream";
    const storageKey = `projects/${input.projectId}/documents/${randomUUID()}-${sanitizeFileName(input.fileName)}`;

    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: storageKey,
      ContentType: normalizedContentType
    });

    const uploadUrl = await getSignedUrl(getStorageClient(), command, {
      expiresIn: 60 * 5
    });

    return {
      uploadUrl,
      storageKey,
      fileName: input.fileName,
      contentType: normalizedContentType,
      fileSize: input.fileSize,
      expiresIn: 60 * 5
    };
  },
  async createChangeOrderAttachmentUploadIntent(input: {
    projectId: string;
    fileName: string;
    contentType?: string;
    fileSize: number;
  }) {
    assertStorageConfigured();

    if (!input.fileName.trim()) {
      throw new ApiError(400, "A file name is required for upload.");
    }

    if (!Number.isFinite(input.fileSize) || input.fileSize <= 0) {
      throw new ApiError(400, "A valid file size is required for upload.");
    }

    if (input.fileSize > maxUploadSizeBytes) {
      throw new ApiError(400, "Files must be 25 MB or smaller.");
    }

    const normalizedContentType = input.contentType?.trim() || "application/octet-stream";
    const storageKey = `projects/${input.projectId}/change-orders/uploads/${randomUUID()}-${sanitizeFileName(input.fileName)}`;

    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: storageKey,
      ContentType: normalizedContentType
    });

    const uploadUrl = await getSignedUrl(getStorageClient(), command, {
      expiresIn: 60 * 5
    });

    return {
      uploadUrl,
      storageKey,
      fileName: input.fileName,
      contentType: normalizedContentType,
      fileSize: input.fileSize,
      expiresIn: 60 * 5
    };
  },
  async createDownloadUrl(input: {
    storageKey: string;
    fileName?: string;
    contentType?: string;
  }) {
    assertStorageConfigured();

    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: input.storageKey,
      ResponseContentDisposition: input.fileName ? `inline; filename="${input.fileName.replace(/"/g, "")}"` : undefined,
      ResponseContentType: input.contentType || undefined
    });

    return getSignedUrl(getStorageClient(), command, {
      expiresIn: 60 * 10
    });
  },
  async deleteObject(storageKey: string) {
    if (!this.isConfigured() || !storageKey.trim()) {
      return;
    }

    await getStorageClient().send(
      new DeleteObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: storageKey
      })
    );
  }
};
