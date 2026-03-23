import crypto from "node:crypto";

export function generateWebhookSignature(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

