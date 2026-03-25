import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

type AnthropicMessageResponse = {
  content?: Array<{
    type: string;
    text?: string;
  }>;
  error?: {
    message?: string;
    type?: string;
  };
};

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

function buildFallbackSummary(description: string, amount: number) {
  const normalizedDescription = description.trim().replace(/\.$/, "");

  return `This change order covers ${normalizedDescription} and is expected to add approximately $${amount.toLocaleString()} to project cost.`;
}

function extractSummaryText(payload: AnthropicMessageResponse) {
  const text = payload.content
    ?.filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text?.trim() ?? "")
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return text || undefined;
}

function buildPrompt(description: string, amount: number) {
  return [
    "You are writing a concise commercial summary for a construction change order.",
    "Respond with exactly one sentence and no markdown.",
    "Mention the scope of work, the likely operational or budget impact, and keep the tone clear for project stakeholders.",
    `Description: ${description.trim()}`,
    `Amount: $${amount.toLocaleString()}`
  ].join("\n");
}

export const aiSummaryService = {
  async generateSummary(description: string, amount: number) {
    const fallbackSummary = buildFallbackSummary(description, amount);

    if (!env.ANTHROPIC_API_KEY) {
      return fallbackSummary;
    }

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": ANTHROPIC_VERSION
        },
        body: JSON.stringify({
          model: env.ANTHROPIC_MODEL,
          max_tokens: 140,
          messages: [
            {
              role: "user",
              content: buildPrompt(description, amount)
            }
          ]
        }),
        signal: AbortSignal.timeout(12_000)
      });

      if (!response.ok) {
        const body = await response.text();

        logger.warn("Claude summary generation failed. Falling back to local summary.", {
          status: response.status,
          model: env.ANTHROPIC_MODEL,
          body: body.slice(0, 500)
        });

        return fallbackSummary;
      }

      const payload = (await response.json()) as AnthropicMessageResponse;
      const summary = extractSummaryText(payload);

      if (!summary) {
        logger.warn("Claude summary response did not contain text. Falling back to local summary.", {
          model: env.ANTHROPIC_MODEL,
          error: payload.error?.message
        });

        return fallbackSummary;
      }

      return summary;
    } catch (error) {
      logger.warn("Claude summary generation threw an error. Falling back to local summary.", {
        model: env.ANTHROPIC_MODEL,
        error: error instanceof Error ? error.message : String(error)
      });

      return fallbackSummary;
    }
  }
};
