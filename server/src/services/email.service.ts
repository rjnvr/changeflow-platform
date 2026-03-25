import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const RESEND_API_URL = "https://api.resend.com/emails";

type EmailPayload = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  tags?: Array<{ name: string; value: string }>;
  previewMeta?: Record<string, unknown>;
};

type ResendResponse = {
  id?: string;
  message?: string;
};

type EmailDeliveryResult = {
  delivered: boolean;
  mode: "resend" | "preview";
  providerMessageId?: string;
};

function normalizeRecipients(input: string | string[]) {
  const values = Array.isArray(input) ? input : [input];

  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function buildAppUrl(path: string) {
  const normalizedBase = trimTrailingSlash(env.APP_BASE_URL);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}

function buildPasswordResetUrl(email: string, token: string) {
  const params = new URLSearchParams({
    resetEmail: email,
    resetToken: token
  });

  return buildAppUrl(`/login?${params.toString()}`);
}

function buildGreeting(firstName?: string) {
  return firstName?.trim() ? `Hi ${firstName.trim()},` : "Hi there,";
}

function previewEmail(payload: EmailPayload) {
  logger.info("Email delivery is running in preview mode.", {
    to: normalizeRecipients(payload.to),
    subject: payload.subject,
    provider: env.EMAIL_PROVIDER,
    previewMeta: payload.previewMeta ?? {}
  });
}

async function sendEmail(payload: EmailPayload): Promise<EmailDeliveryResult> {
  const recipients = normalizeRecipients(payload.to);

  if (recipients.length === 0) {
    logger.warn("Skipping email send because there were no recipients.", {
      subject: payload.subject
    });

    return {
      delivered: false,
      mode: "preview"
    };
  }

  const resendEnabled =
    env.EMAIL_PROVIDER.trim().toLowerCase() === "resend" &&
    Boolean(env.EMAIL_API_KEY.trim()) &&
    Boolean(env.EMAIL_FROM.trim());

  if (!resendEnabled) {
    previewEmail(payload);

    return {
      delivered: false,
      mode: "preview"
    };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.EMAIL_API_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: recipients,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
        tags: payload.tags
      }),
      signal: AbortSignal.timeout(12_000)
    });

    if (!response.ok) {
      const body = await response.text();

      logger.warn("Email provider request failed. Falling back to preview mode.", {
        provider: env.EMAIL_PROVIDER,
        status: response.status,
        body: body.slice(0, 500)
      });

      previewEmail(payload);

      return {
        delivered: false,
        mode: "preview"
      };
    }

    const providerResponse = (await response.json()) as ResendResponse;

    logger.info("Email delivered successfully.", {
      provider: env.EMAIL_PROVIDER,
      providerMessageId: providerResponse.id,
      to: recipients,
      subject: payload.subject
    });

    return {
      delivered: true,
      mode: "resend",
      providerMessageId: providerResponse.id
    };
  } catch (error) {
    logger.warn("Email provider threw an error. Falling back to preview mode.", {
      provider: env.EMAIL_PROVIDER,
      error: error instanceof Error ? error.message : String(error)
    });

    previewEmail(payload);

    return {
      delivered: false,
      mode: "preview"
    };
  }
}

function buildStatusEmail(changeOrderId: string, status: string) {
  return {
    subject: `Change order ${changeOrderId} updated`,
    body: `The change order status is now ${status}.`
  };
}

export const emailService = {
  buildStatusEmail,
  buildPasswordResetUrl,
  async sendWelcomeEmail(input: {
    to: string;
    firstName?: string;
  }) {
    const dashboardUrl = buildAppUrl("/app/dashboard");
    const greeting = buildGreeting(input.firstName);

    return sendEmail({
      to: input.to,
      subject: "Welcome to ChangeFlow",
      text: [
        `${greeting}`,
        "",
        "Your ChangeFlow workspace is ready.",
        `Sign in and head to your dashboard: ${dashboardUrl}`,
        "",
        "Built for the modern jobsite."
      ].join("\n"),
      html: [
        `<p>${escapeHtml(greeting)}</p>`,
        "<p>Your ChangeFlow workspace is ready.</p>",
        `<p><a href="${dashboardUrl}">Open your dashboard</a></p>`,
        "<p>Built for the modern jobsite.</p>"
      ].join(""),
      tags: [
        { name: "type", value: "welcome" }
      ]
    });
  },
  async sendPasswordResetEmail(input: {
    to: string;
    firstName?: string;
    token: string;
  }) {
    const resetUrl = buildPasswordResetUrl(input.to, input.token);
    const greeting = buildGreeting(input.firstName);

    return sendEmail({
      to: input.to,
      subject: "Reset your ChangeFlow password",
      text: [
        `${greeting}`,
        "",
        "We received a request to reset your ChangeFlow password.",
        `Use this secure link to finish resetting it: ${resetUrl}`,
        "",
        `If needed, you can also paste this token into the app: ${input.token}`,
        "",
        "This link expires in 30 minutes."
      ].join("\n"),
      html: [
        `<p>${escapeHtml(greeting)}</p>`,
        "<p>We received a request to reset your ChangeFlow password.</p>",
        `<p><a href="${resetUrl}">Reset your password</a></p>`,
        `<p>If needed, you can also paste this token into the app: <strong>${escapeHtml(input.token)}</strong></p>`,
        "<p>This link expires in 30 minutes.</p>"
      ].join(""),
      tags: [
        { name: "type", value: "password_reset" }
      ],
      previewMeta: {
        resetUrl,
        resetToken: input.token
      }
    });
  },
  async sendChangeOrderCreatedEmail(input: {
    to: string | string[];
    recipientName?: string;
    changeOrderId: string;
    title: string;
    projectName: string;
    amount: number;
  }) {
    const detailUrl = buildAppUrl(`/app/change-orders/${input.changeOrderId}`);
    const greeting = buildGreeting(input.recipientName);

    return sendEmail({
      to: input.to,
      subject: `New change order created for ${input.projectName}`,
      text: [
        `${greeting}`,
        "",
        `A new change order has been created in ${input.projectName}.`,
        `Title: ${input.title}`,
        `Estimated value: $${input.amount.toLocaleString()}`,
        `Open in ChangeFlow: ${detailUrl}`
      ].join("\n"),
      html: [
        `<p>${escapeHtml(greeting)}</p>`,
        `<p>A new change order has been created in <strong>${escapeHtml(input.projectName)}</strong>.</p>`,
        `<p><strong>Title:</strong> ${escapeHtml(input.title)}<br /><strong>Estimated value:</strong> $${escapeHtml(input.amount.toLocaleString())}</p>`,
        `<p><a href="${detailUrl}">Open the change order</a></p>`
      ].join(""),
      tags: [
        { name: "type", value: "change_order_created" }
      ]
    });
  },
  async sendChangeOrderStatusEmail(input: {
    to: string | string[];
    recipientName?: string;
    changeOrderId: string;
    title: string;
    projectName: string;
    status: string;
  }) {
    const detailUrl = buildAppUrl(`/app/change-orders/${input.changeOrderId}`);
    const greeting = buildGreeting(input.recipientName);
    const statusMessage = buildStatusEmail(input.changeOrderId, input.status);

    return sendEmail({
      to: input.to,
      subject: statusMessage.subject,
      text: [
        `${greeting}`,
        "",
        `The change order "${input.title}" in ${input.projectName} is now ${input.status.replace(/_/g, " ")}.`,
        `Open in ChangeFlow: ${detailUrl}`
      ].join("\n"),
      html: [
        `<p>${escapeHtml(greeting)}</p>`,
        `<p>The change order <strong>${escapeHtml(input.title)}</strong> in <strong>${escapeHtml(input.projectName)}</strong> is now <strong>${escapeHtml(input.status.replace(/_/g, " "))}</strong>.</p>`,
        `<p><a href="${detailUrl}">Open the change order</a></p>`
      ].join(""),
      tags: [
        { name: "type", value: "change_order_status" }
      ]
    });
  }
};
