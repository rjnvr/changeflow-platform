import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { logger } from "../config/logger.js";
import { storageService } from "./storage.service.js";

const execFileAsync = promisify(execFile);
const PDF_TO_TEXT_PATH = process.env.PDFTOTEXT_PATH || "/opt/homebrew/bin/pdftotext";

function looksLikeTextContentType(contentType?: string) {
  if (!contentType) {
    return false;
  }

  const normalizedType = contentType.toLowerCase();

  return (
    normalizedType.startsWith("text/") ||
    normalizedType.includes("json") ||
    normalizedType.includes("xml") ||
    normalizedType.includes("csv") ||
    normalizedType.includes("javascript")
  );
}

function getLowerFileName(fileName?: string) {
  return fileName?.trim().toLowerCase() ?? "";
}

function looksLikeTextFileName(fileName?: string) {
  const normalizedFileName = getLowerFileName(fileName);
  return [".txt", ".md", ".csv", ".json", ".xml", ".log"].some((extension) => normalizedFileName.endsWith(extension));
}

function looksLikePdf(contentType?: string, fileName?: string) {
  return contentType?.toLowerCase().includes("pdf") || getLowerFileName(fileName).endsWith(".pdf");
}

async function extractPdfTextFromBuffer(buffer: Uint8Array) {
  const tempFilePath = path.join(tmpdir(), `changeflow-${randomUUID()}.pdf`);

  try {
    await writeFile(tempFilePath, buffer);
    const { stdout } = await execFileAsync(PDF_TO_TEXT_PATH, ["-layout", "-nopgbrk", tempFilePath, "-"], {
      maxBuffer: 8 * 1024 * 1024
    });

    return stdout.replace(/\r\n/g, "\n").replace(/\u0000/g, "").trim();
  } finally {
    await unlink(tempFilePath).catch(() => undefined);
  }
}

export const documentExtractionService = {
  async extractFromStorageObject(input: {
    storageKey?: string;
    fileName?: string;
    contentType?: string;
  }) {
    if (!input.storageKey) {
      return {
        text: "",
        method: "metadata_only" as const
      };
    }

    if (looksLikeTextContentType(input.contentType) || looksLikeTextFileName(input.fileName)) {
      const text = await storageService.getObjectText(input.storageKey);
      return {
        text: text.replace(/\r\n/g, "\n").trim(),
        method: "storage_text" as const
      };
    }

    if (looksLikePdf(input.contentType, input.fileName)) {
      try {
        const buffer = await storageService.getObjectBuffer(input.storageKey);
        const text = await extractPdfTextFromBuffer(buffer);

        return {
          text,
          method: "pdf_text" as const
        };
      } catch (error) {
        logger.warn("PDF text extraction failed; falling back to metadata-only analysis.", {
          storageKey: input.storageKey,
          fileName: input.fileName,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return {
      text: "",
      method: "metadata_only" as const
    };
  }
};
