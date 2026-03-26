import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import type {
  ChangeOrderRecord,
  ProjectAnalyticsBriefRecord,
  ProjectDocumentRecord,
  ProjectRecord,
  ProjectTeamMemberRecord
} from "../types/domain.js";

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

function asCountLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
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

function buildProjectBriefFallback(input: {
  project: ProjectRecord;
  changeOrders: ChangeOrderRecord[];
  teamMembers: ProjectTeamMemberRecord[];
  documents: ProjectDocumentRecord[];
  usage: ProjectAnalyticsBriefRecord["usage"];
}): ProjectAnalyticsBriefRecord {
  const { project, changeOrders, teamMembers, documents, usage } = input;
  const approvedCount = changeOrders.filter((item) => item.status === "approved" || item.status === "synced").length;
  const pendingCount = changeOrders.filter(
    (item) => item.status === "pending_review" || item.status === "draft"
  ).length;
  const rejectedCount = changeOrders.filter((item) => item.status === "rejected").length;
  const totalImpact = changeOrders.reduce((total, item) => total + item.amount, 0);
  const topOpenChangeOrders = [...changeOrders]
    .filter((item) => item.status !== "approved" && item.status !== "synced" && !item.archivedAt)
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 2);
  const latestDocuments = [...documents]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 2);

  return {
    summary: `${project.name} in ${project.location} is currently ${project.status.replace("-", " ")} with ${asCountLabel(
      changeOrders.length,
      "change order"
    )}, ${asCountLabel(teamMembers.length, "team member")}, and ${asCountLabel(documents.length, "document")} tracked in ChangeFlow.`,
    currentState: [
      `Current contract value is $${project.contractValue.toLocaleString()} with approximately $${Math.abs(totalImpact).toLocaleString()} in net change-order impact${totalImpact < 0 ? " reduction" : ""}.`,
      pendingCount > 0
        ? `${asCountLabel(pendingCount, "open change order")} still require review or action.`
        : "No open change orders currently require review.",
      teamMembers.length > 0
        ? `Active field roster includes ${teamMembers
            .slice(0, 3)
            .map((member) => member.name)
            .join(", ")}${teamMembers.length > 3 ? ", and others." : "."}`
        : "No project-specific on-site team roster has been added yet."
    ],
    recentProgress: [
      approvedCount > 0
        ? `${asCountLabel(approvedCount, "change order")} have already been approved or synced.`
        : "No change orders have been fully approved yet.",
      latestDocuments.length > 0
        ? `Recent document activity includes ${latestDocuments.map((document) => document.title).join(" and ")}.`
        : "No recent project document updates are available yet."
    ],
    nextSteps: [
      topOpenChangeOrders.length > 0
        ? `Prioritize ${topOpenChangeOrders
            .map((item) => `${item.title} ($${item.amount.toLocaleString()})`)
            .join(" and ")} for commercial review.`
        : "Keep the project record current with the next field document or change request.",
      documents.length < 2
        ? "Upload current drawings, specs, or field documentation to improve project visibility."
        : "Use the current document vault and change-order history to keep stakeholders aligned."
    ],
    watchouts: [
      pendingCount > 0
        ? `${asCountLabel(pendingCount, "pending review item")} could delay downstream budget or sync workflows.`
        : "No immediate approval bottlenecks are visible from the current workflow data.",
      rejectedCount > 0
        ? `${asCountLabel(rejectedCount, "rejected change order")} may need follow-up or scope clarification.`
        : "No rejected change orders are currently flagged."
    ],
    usage,
    source: "fallback",
    generatedAt: new Date().toISOString()
  };
}

function buildProjectBriefPrompt(input: {
  project: ProjectRecord;
  changeOrders: ChangeOrderRecord[];
  teamMembers: ProjectTeamMemberRecord[];
  documents: ProjectDocumentRecord[];
  usage: ProjectAnalyticsBriefRecord["usage"];
}) {
  const { project, changeOrders, teamMembers, documents, usage } = input;
  const latestChangeOrders = [...changeOrders]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 5)
    .map(
      (item) =>
        `- ${item.title} | status=${item.status} | amount=$${item.amount.toLocaleString()} | updated=${item.updatedAt} | aiSummary=${item.aiSummary ?? item.description}`
    )
    .join("\n");
  const latestDocuments = [...documents]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 4)
    .map((document) => `- ${document.title} | kind=${document.kind} | summary=${document.summary}`)
    .join("\n");
  const teamRoster = teamMembers.map((member) => `- ${member.name} | role=${member.role}`).join("\n");

  return [
    "You are preparing a highly useful project analytics brief for a construction operations platform.",
    "Return strict JSON only with this shape:",
    '{"summary":"string","currentState":["string"],"recentProgress":["string"],"nextSteps":["string"],"watchouts":["string"]}',
    "Rules:",
    "- Keep summary to 2 sentences max.",
    "- Each array should contain 2 or 3 concise bullets.",
    "- Use only information clearly supported by the provided project data, but light operational inference is allowed.",
    "- Be concrete and useful for a project manager opening the project screen.",
    "- Do not mention quota, API usage, or model names in the brief content.",
    "- Do not use markdown or code fences.",
    `Project: ${project.name} | code=${project.code} | location=${project.location} | status=${project.status} | contractValue=$${project.contractValue.toLocaleString()}`,
    `Quota context: user remaining today=${usage.userRemaining}, global remaining this month=${usage.globalRemaining}`,
    `Change orders count: ${changeOrders.length}`,
    latestChangeOrders ? `Recent change orders:\n${latestChangeOrders}` : "Recent change orders:\n- none",
    teamRoster ? `On-site team:\n${teamRoster}` : "On-site team:\n- none",
    latestDocuments ? `Recent documents:\n${latestDocuments}` : "Recent documents:\n- none"
  ].join("\n");
}

async function requestClaudeText(prompt: string, maxTokens: number) {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": ANTHROPIC_VERSION
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    }),
    signal: AbortSignal.timeout(18_000)
  });

  if (!response.ok) {
    const body = await response.text();

    logger.warn("Claude request failed.", {
      status: response.status,
      model: env.ANTHROPIC_MODEL,
      body: body.slice(0, 500)
    });

    return undefined;
  }

  const payload = (await response.json()) as AnthropicMessageResponse;
  return extractSummaryText(payload);
}

function parseProjectBrief(
  text: string | undefined
): Omit<ProjectAnalyticsBriefRecord, "source" | "generatedAt" | "usage"> | undefined {
  if (!text) {
    return undefined;
  }

  const normalizedText = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(normalizedText) as Partial<ProjectAnalyticsBriefRecord>;
    const asArray = (value: unknown) =>
      Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()).slice(0, 3)
        : [];

    if (typeof parsed.summary !== "string" || parsed.summary.trim().length < 10) {
      return undefined;
    }

    return {
      summary: parsed.summary.trim(),
      currentState: asArray(parsed.currentState),
      recentProgress: asArray(parsed.recentProgress),
      nextSteps: asArray(parsed.nextSteps),
      watchouts: asArray(parsed.watchouts)
    };
  } catch {
    return undefined;
  }
}

export const aiSummaryService = {
  async generateSummary(description: string, amount: number) {
    const fallbackSummary = buildFallbackSummary(description, amount);

    if (!env.ANTHROPIC_API_KEY) {
      return fallbackSummary;
    }

    try {
      const summary = await requestClaudeText(buildPrompt(description, amount), 140);

      if (!summary) {
        logger.warn("Claude summary response did not contain text. Falling back to local summary.", {
          model: env.ANTHROPIC_MODEL
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
  },
  async generateProjectBrief(input: {
    project: ProjectRecord;
    changeOrders: ChangeOrderRecord[];
    teamMembers: ProjectTeamMemberRecord[];
    documents: ProjectDocumentRecord[];
    usage: ProjectAnalyticsBriefRecord["usage"];
  }) {
    const fallbackBrief = buildProjectBriefFallback(input);

    if (!env.ANTHROPIC_API_KEY) {
      return fallbackBrief;
    }

    try {
      const responseText = await requestClaudeText(buildProjectBriefPrompt(input), 420);
      const parsedBrief = parseProjectBrief(responseText);

      if (!parsedBrief) {
        logger.warn("Claude project brief response was invalid JSON. Falling back to local brief.", {
          model: env.ANTHROPIC_MODEL,
          response: responseText?.slice(0, 500)
        });

        return fallbackBrief;
      }

      return {
        ...parsedBrief,
        usage: input.usage,
        source: "claude" as const,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.warn("Claude project brief generation failed. Falling back to local brief.", {
        model: env.ANTHROPIC_MODEL,
        error: error instanceof Error ? error.message : String(error)
      });

      return fallbackBrief;
    }
  }
};
