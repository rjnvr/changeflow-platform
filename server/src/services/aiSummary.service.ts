import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import type {
  ChangeOrderRecord,
  ProjectAnalyticsBriefRecord,
  ProjectQuestionAnswerRecord,
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

type ProjectDocumentAgentAnalysis = {
  summary: string;
  suggestedAssignee?: string;
  actionItems: Array<{
    title: string;
    description: string;
    assignee?: string;
  }>;
  keyRisks: Array<{
    level: "low" | "medium" | "high";
    title: string;
    description: string;
  }>;
  source: "claude" | "fallback";
};

type ProjectDocumentClassification = {
  documentType: string;
  confidence: "low" | "medium" | "high";
  rationale: string;
  source: "claude" | "fallback";
};

type ProjectDocumentRiskAnalysis = {
  keyRisks: Array<{
    level: "low" | "medium" | "high";
    title: string;
    description: string;
  }>;
  source: "claude" | "fallback";
};

type ProjectDocumentActionPlan = {
  summary: string;
  suggestedAssignee?: string;
  actionItems: Array<{
    title: string;
    description: string;
    assignee?: string;
  }>;
  projectComment: string;
  changeOrderFollowUp?: string;
  source: "claude" | "fallback";
};

function buildProjectDocumentAgentFallback(input: {
  project: ProjectRecord;
  document: ProjectDocumentRecord;
  teamMembers: ProjectTeamMemberRecord[];
  changeOrders: ChangeOrderRecord[];
  extractedText?: string;
}): ProjectDocumentAgentAnalysis {
  const normalizedText = `${input.document.title} ${input.document.kind} ${input.document.summary} ${input.extractedText ?? ""}`.toLowerCase();
  const matchedAssignee =
    input.teamMembers.find((member) =>
      ["draw", "layout", "architect", "design", "spec"].some(
        (keyword) => normalizedText.includes(keyword) && member.role.toLowerCase().includes("architect")
      )
    )?.name ?? input.document.assignedTo ?? input.teamMembers[0]?.name;

  const keyRisks: ProjectDocumentAgentAnalysis["keyRisks"] = [];

  if (["delay", "schedule", "late", "hold"].some((keyword) => normalizedText.includes(keyword))) {
    keyRisks.push({
      level: "medium",
      title: "Schedule follow-up required",
      description: "The document mentions timing or schedule pressure that should be reviewed with the project team."
    });
  }

  if (["cost", "price", "change", "invoice", "budget"].some((keyword) => normalizedText.includes(keyword))) {
    keyRisks.push({
      level: "high",
      title: "Potential commercial impact",
      description: "This document likely affects cost, pricing, or scope and should be validated against current change-order exposure."
    });
  }

  const actionItems: ProjectDocumentAgentAnalysis["actionItems"] = [
    {
      title: `Review ${input.document.title}`,
      description: `Review the uploaded ${input.document.kind.toLowerCase()} for project ${input.project.name} and confirm if follow-up change orders or budget actions are required.`,
      assignee: matchedAssignee
    }
  ];

  if (input.changeOrders.length > 0) {
    actionItems.push({
      title: "Cross-check against open change orders",
      description: "Compare this document against current change-order activity to catch duplicate scope, pricing overlap, or missing approvals."
    });
  }

  return {
    summary: `${input.document.title} appears relevant to ${input.project.name} and should be reviewed for operational impact, commercial exposure, and downstream coordination.`,
    suggestedAssignee: matchedAssignee,
    actionItems: actionItems.slice(0, 3),
    keyRisks: keyRisks.slice(0, 3),
    source: "fallback"
  };
}

function buildProjectDocumentClassificationFallback(input: {
  document: ProjectDocumentRecord;
  extractedText?: string;
}): ProjectDocumentClassification {
  const normalized = `${input.document.title} ${input.document.kind} ${input.document.summary} ${input.extractedText ?? ""}`.toLowerCase();

  let documentType = "general construction record";

  if (["field", "walkthrough", "coordination", "memo", "daily report"].some((keyword) => normalized.includes(keyword))) {
    documentType = "field coordination memo";
  } else if (["drawing", "plan", "layout", "dwg", "spec"].some((keyword) => normalized.includes(keyword))) {
    documentType = "drawing or specification package";
  } else if (["quote", "pricing", "invoice", "budget"].some((keyword) => normalized.includes(keyword))) {
    documentType = "commercial pricing document";
  } else if (["inspection", "report", "finding"].some((keyword) => normalized.includes(keyword))) {
    documentType = "inspection or field report";
  }

  return {
    documentType,
    confidence: input.extractedText ? "medium" : "low",
    rationale: input.extractedText
      ? "Classification was inferred from the uploaded text and document metadata."
      : "Classification relied mostly on document metadata because extractable text was limited.",
    source: "fallback"
  };
}

function buildProjectDocumentClassificationPrompt(input: {
  document: ProjectDocumentRecord;
  extractedText?: string;
}) {
  return [
    "You are classifying a construction project document for ChangeFlow.",
    "Return strict JSON only with this shape:",
    '{"documentType":"string","confidence":"low|medium|high","rationale":"string"}',
    "Pick a practical operational type such as field coordination memo, drawing package, inspection report, commercial quote, contract addendum, schedule update, safety report, or submittal.",
    `Document title: ${input.document.title}`,
    `Document kind: ${input.document.kind}`,
    `Existing summary: ${input.document.summary}`,
    input.extractedText ? `Extracted text:\n${input.extractedText.slice(0, 10000)}` : "Extracted text: unavailable"
  ].join("\n");
}

function parseProjectDocumentClassification(text: string | undefined): Omit<ProjectDocumentClassification, "source"> | undefined {
  if (!text) {
    return undefined;
  }

  const normalizedText = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(normalizedText) as Partial<ProjectDocumentClassification>;

    if (
      typeof parsed.documentType !== "string" ||
      !parsed.documentType.trim() ||
      (parsed.confidence !== "low" && parsed.confidence !== "medium" && parsed.confidence !== "high") ||
      typeof parsed.rationale !== "string" ||
      parsed.rationale.trim().length < 8
    ) {
      return undefined;
    }

    return {
      documentType: parsed.documentType.trim(),
      confidence: parsed.confidence,
      rationale: parsed.rationale.trim()
    };
  } catch {
    return undefined;
  }
}

function buildProjectDocumentRiskPrompt(input: {
  project: ProjectRecord;
  document: ProjectDocumentRecord;
  classification: ProjectDocumentClassification;
  extractedText?: string;
}) {
  return [
    "You are performing risk analysis on a construction project document for ChangeFlow.",
    "Return strict JSON only with this shape:",
    '{"keyRisks":[{"level":"low|medium|high","title":"string","description":"string"}]}',
    "Return 0 to 3 risks. Only include meaningful operational, commercial, schedule, or coordination risks.",
    `Project: ${input.project.name} | location=${input.project.location} | status=${input.project.status}`,
    `Document type classification: ${input.classification.documentType} (${input.classification.confidence})`,
    `Document title: ${input.document.title}`,
    `Existing summary: ${input.document.summary}`,
    input.extractedText ? `Extracted text:\n${input.extractedText.slice(0, 10000)}` : "Extracted text: unavailable"
  ].join("\n");
}

function parseProjectDocumentRiskAnalysis(text: string | undefined): Omit<ProjectDocumentRiskAnalysis, "source"> | undefined {
  if (!text) {
    return undefined;
  }

  const normalizedText = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(normalizedText) as Partial<ProjectDocumentRiskAnalysis>;
    const keyRisks = Array.isArray(parsed.keyRisks)
      ? parsed.keyRisks
          .filter(
            (item): item is { level: "low" | "medium" | "high"; title: string; description: string } =>
              Boolean(item) &&
              typeof item === "object" &&
              (item.level === "low" || item.level === "medium" || item.level === "high") &&
              typeof item.title === "string" &&
              typeof item.description === "string"
          )
          .map((item) => ({
            level: item.level,
            title: item.title.trim(),
            description: item.description.trim()
          }))
          .filter((item) => item.title && item.description)
          .slice(0, 3)
      : [];

    return { keyRisks };
  } catch {
    return undefined;
  }
}

function buildProjectDocumentActionPlanPrompt(input: {
  project: ProjectRecord;
  document: ProjectDocumentRecord;
  teamMembers: ProjectTeamMemberRecord[];
  changeOrders: ChangeOrderRecord[];
  classification: ProjectDocumentClassification;
  riskAnalysis: ProjectDocumentRiskAnalysis;
  extractedText?: string;
  memoryEntries?: Array<{ kind: string; title: string; content: string }>;
}) {
  const teamRoster = input.teamMembers.map((member) => `- ${member.name} | role=${member.role}`).join("\n");
  const relatedChangeOrders = input.changeOrders
    .slice(0, 5)
    .map((changeOrder) => `- ${changeOrder.title} | status=${changeOrder.status} | amount=$${changeOrder.amount.toLocaleString()}`)
    .join("\n");
  const memory = (input.memoryEntries ?? [])
    .slice(0, 5)
    .map((entry) => `- ${entry.kind}: ${entry.title} | ${entry.content}`)
    .join("\n");

  return [
    "You are planning next actions for a construction project document in ChangeFlow.",
    "Return strict JSON only with this shape:",
    '{"summary":"string","suggestedAssignee":"string","projectComment":"string","changeOrderFollowUp":"string","actionItems":[{"title":"string","description":"string","assignee":"string"}]}',
    "Rules:",
    "- summary should be 1 or 2 sentences.",
    "- actionItems should contain 1 to 3 concrete next steps.",
    "- projectComment should be immediately useful to a PM opening the project.",
    "- changeOrderFollowUp should be empty if not needed.",
    "- Prefer assignees from the provided team roster.",
    `Project: ${input.project.name} | status=${input.project.status} | location=${input.project.location}`,
    `Document type classification: ${input.classification.documentType} (${input.classification.confidence})`,
    `Document title: ${input.document.title}`,
    `Existing summary: ${input.document.summary}`,
    `Risks:\n${input.riskAnalysis.keyRisks.map((risk) => `- ${risk.level}: ${risk.title} | ${risk.description}`).join("\n") || "- none"}`,
    teamRoster ? `On-site team:\n${teamRoster}` : "On-site team:\n- none",
    relatedChangeOrders ? `Related change orders:\n${relatedChangeOrders}` : "Related change orders:\n- none",
    memory ? `Relevant project memory:\n${memory}` : "Relevant project memory:\n- none",
    input.extractedText ? `Extracted text:\n${input.extractedText.slice(0, 10000)}` : "Extracted text: unavailable"
  ].join("\n");
}

function parseProjectDocumentActionPlan(text: string | undefined): Omit<ProjectDocumentActionPlan, "source"> | undefined {
  if (!text) {
    return undefined;
  }

  const normalizedText = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(normalizedText) as Partial<ProjectDocumentActionPlan>;
    const actionItems = Array.isArray(parsed.actionItems)
      ? parsed.actionItems
          .filter(
            (item): item is { title: string; description: string; assignee?: string } =>
              Boolean(item) &&
              typeof item === "object" &&
              typeof item.title === "string" &&
              typeof item.description === "string"
          )
          .map((item) => ({
            title: item.title.trim(),
            description: item.description.trim(),
            assignee: typeof item.assignee === "string" && item.assignee.trim() ? item.assignee.trim() : undefined
          }))
          .filter((item) => item.title && item.description)
          .slice(0, 3)
      : [];

    if (
      typeof parsed.summary !== "string" ||
      parsed.summary.trim().length < 10 ||
      typeof parsed.projectComment !== "string" ||
      parsed.projectComment.trim().length < 10
    ) {
      return undefined;
    }

    return {
      summary: parsed.summary.trim(),
      suggestedAssignee:
        typeof parsed.suggestedAssignee === "string" && parsed.suggestedAssignee.trim()
          ? parsed.suggestedAssignee.trim()
          : undefined,
      projectComment: parsed.projectComment.trim(),
      changeOrderFollowUp:
        typeof parsed.changeOrderFollowUp === "string" && parsed.changeOrderFollowUp.trim()
          ? parsed.changeOrderFollowUp.trim()
          : undefined,
      actionItems
    };
  } catch {
    return undefined;
  }
}

function buildProjectDocumentAgentPrompt(input: {
  project: ProjectRecord;
  document: ProjectDocumentRecord;
  teamMembers: ProjectTeamMemberRecord[];
  changeOrders: ChangeOrderRecord[];
  extractedText?: string;
}) {
  const teamRoster = input.teamMembers.map((member) => `- ${member.name} | role=${member.role}`).join("\n");
  const relatedChangeOrders = input.changeOrders
    .slice(0, 5)
    .map(
      (changeOrder) =>
        `- ${changeOrder.title} | status=${changeOrder.status} | amount=$${changeOrder.amount.toLocaleString()} | requestedBy=${changeOrder.requestedBy}`
    )
    .join("\n");

  return [
    "You are a construction operations document agent for ChangeFlow.",
    "Analyze the uploaded project document and produce immediate, useful next actions for the project team.",
    "Return strict JSON only with this shape:",
    '{"summary":"string","suggestedAssignee":"string","actionItems":[{"title":"string","description":"string","assignee":"string"}],"keyRisks":[{"level":"low|medium|high","title":"string","description":"string"}]}',
    "Rules:",
    "- Keep summary to 2 sentences max.",
    "- actionItems should contain 1 to 3 items.",
    "- keyRisks should contain 0 to 3 items.",
    "- Only suggest assignees from the provided team roster when possible.",
    "- Focus on operational follow-up a PM could act on immediately.",
    `Project: ${input.project.name} | code=${input.project.code} | location=${input.project.location} | status=${input.project.status}`,
    `Document title: ${input.document.title}`,
    `Document type: ${input.document.kind}`,
    `Existing manual summary: ${input.document.summary}`,
    input.extractedText ? `Extracted text:\n${input.extractedText.slice(0, 12000)}` : "Extracted text: unavailable",
    teamRoster ? `On-site team:\n${teamRoster}` : "On-site team:\n- none",
    relatedChangeOrders ? `Related change orders:\n${relatedChangeOrders}` : "Related change orders:\n- none"
  ].join("\n");
}

function parseProjectDocumentAgentAnalysis(text: string | undefined): Omit<ProjectDocumentAgentAnalysis, "source"> | undefined {
  if (!text) {
    return undefined;
  }

  const normalizedText = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(normalizedText) as Partial<ProjectDocumentAgentAnalysis>;
    const actionItems = Array.isArray(parsed.actionItems)
      ? parsed.actionItems
          .filter(
            (item): item is { title: string; description: string; assignee?: string } =>
              Boolean(item) &&
              typeof item === "object" &&
              typeof item.title === "string" &&
              typeof item.description === "string"
          )
          .map((item) => ({
            title: item.title.trim(),
            description: item.description.trim(),
            assignee: typeof item.assignee === "string" && item.assignee.trim() ? item.assignee.trim() : undefined
          }))
          .filter((item) => item.title && item.description)
          .slice(0, 3)
      : [];

    const keyRisks = Array.isArray(parsed.keyRisks)
      ? parsed.keyRisks
          .filter(
            (item): item is { level: "low" | "medium" | "high"; title: string; description: string } =>
              Boolean(item) &&
              typeof item === "object" &&
              (item.level === "low" || item.level === "medium" || item.level === "high") &&
              typeof item.title === "string" &&
              typeof item.description === "string"
          )
          .map((item) => ({
            level: item.level,
            title: item.title.trim(),
            description: item.description.trim()
          }))
          .filter((item) => item.title && item.description)
          .slice(0, 3)
      : [];

    if (typeof parsed.summary !== "string" || parsed.summary.trim().length < 10) {
      return undefined;
    }

    return {
      summary: parsed.summary.trim(),
      suggestedAssignee:
        typeof parsed.suggestedAssignee === "string" && parsed.suggestedAssignee.trim()
          ? parsed.suggestedAssignee.trim()
          : undefined,
      actionItems,
      keyRisks
    };
  } catch {
    return undefined;
  }
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

function buildProjectQuestionFallback(input: {
  question: string;
  citations: ProjectQuestionAnswerRecord["citations"];
}): ProjectQuestionAnswerRecord {
  const topCitation = input.citations[0];

  return {
    answer: topCitation
      ? `Based on ${topCitation.documentTitle}, the most relevant project context is: ${topCitation.excerpt}`
      : `No grounded document evidence was found for "${input.question}". Upload more project documents to improve project answers.`,
    citations: input.citations,
    source: "fallback"
  };
}

function buildProjectQuestionPrompt(input: {
  question: string;
  citations: ProjectQuestionAnswerRecord["citations"];
}) {
  const citationText = input.citations
    .map(
      (citation, index) =>
        `[${index + 1}] ${citation.documentTitle} (chunk ${citation.chunkIndex})\n${citation.excerpt}`
    )
    .join("\n\n");

  return [
    "You are answering a question inside ChangeFlow using grounded project document context.",
    "Return strict JSON only with this shape:",
    '{"answer":"string","citations":[{"documentId":"string","documentTitle":"string","chunkIndex":0,"excerpt":"string"}]}',
    "Rules:",
    "- Base the answer only on the supplied citations.",
    "- Keep the answer concise and useful for a project manager.",
    "- Preserve only citations that truly support the answer.",
    "- Do not invent facts beyond the cited excerpts.",
    `Question: ${input.question}`,
    `Citations:\n${citationText || "none"}`
  ].join("\n");
}

function parseProjectQuestionAnswer(
  text: string | undefined,
  fallbackCitations: ProjectQuestionAnswerRecord["citations"]
): Omit<ProjectQuestionAnswerRecord, "source"> | undefined {
  if (!text) {
    return undefined;
  }

  const normalizedText = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(normalizedText) as Partial<ProjectQuestionAnswerRecord>;

    if (typeof parsed.answer !== "string" || parsed.answer.trim().length < 10) {
      return undefined;
    }

    const citations = Array.isArray(parsed.citations)
      ? parsed.citations
          .filter(
            (citation): citation is ProjectQuestionAnswerRecord["citations"][number] =>
              Boolean(citation) &&
              typeof citation === "object" &&
              typeof citation.documentId === "string" &&
              typeof citation.documentTitle === "string" &&
              typeof citation.chunkIndex === "number" &&
              typeof citation.excerpt === "string"
          )
          .slice(0, 4)
      : fallbackCitations;

    return {
      answer: parsed.answer.trim(),
      citations
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
  },
  async analyzeProjectDocument(input: {
    project: ProjectRecord;
    document: ProjectDocumentRecord;
    teamMembers: ProjectTeamMemberRecord[];
    changeOrders: ChangeOrderRecord[];
    extractedText?: string;
  }) {
    const fallbackAnalysis = buildProjectDocumentAgentFallback(input);

    if (!env.ANTHROPIC_API_KEY) {
      return fallbackAnalysis;
    }

    try {
      const responseText = await requestClaudeText(buildProjectDocumentAgentPrompt(input), 520);
      const parsedAnalysis = parseProjectDocumentAgentAnalysis(responseText);

      if (!parsedAnalysis) {
        logger.warn("Claude document agent response was invalid JSON. Falling back to local document analysis.", {
          model: env.ANTHROPIC_MODEL,
          response: responseText?.slice(0, 500)
        });

        return fallbackAnalysis;
      }

      return {
        ...parsedAnalysis,
        source: "claude" as const
      };
    } catch (error) {
      logger.warn("Claude document agent analysis failed. Falling back to local analysis.", {
        model: env.ANTHROPIC_MODEL,
        error: error instanceof Error ? error.message : String(error)
      });

      return fallbackAnalysis;
    }
  },
  async classifyProjectDocument(input: {
    document: ProjectDocumentRecord;
    extractedText?: string;
  }) {
    const fallbackClassification = buildProjectDocumentClassificationFallback(input);

    if (!env.ANTHROPIC_API_KEY) {
      return fallbackClassification;
    }

    try {
      const responseText = await requestClaudeText(buildProjectDocumentClassificationPrompt(input), 220);
      const parsedClassification = parseProjectDocumentClassification(responseText);

      if (!parsedClassification) {
        logger.warn("Claude document classification response was invalid JSON. Falling back to local classification.", {
          model: env.ANTHROPIC_MODEL,
          response: responseText?.slice(0, 500)
        });

        return fallbackClassification;
      }

      return {
        ...parsedClassification,
        source: "claude" as const
      };
    } catch (error) {
      logger.warn("Claude document classification failed. Falling back to local classification.", {
        model: env.ANTHROPIC_MODEL,
        error: error instanceof Error ? error.message : String(error)
      });

      return fallbackClassification;
    }
  },
  async analyzeProjectDocumentRisks(input: {
    project: ProjectRecord;
    document: ProjectDocumentRecord;
    classification: ProjectDocumentClassification;
    extractedText?: string;
  }) {
    const fallbackAnalysis = buildProjectDocumentAgentFallback({
      project: input.project,
      document: input.document,
      teamMembers: [],
      changeOrders: [],
      extractedText: input.extractedText
    });
    const fallbackRiskAnalysis: ProjectDocumentRiskAnalysis = {
      keyRisks: fallbackAnalysis.keyRisks,
      source: "fallback"
    };

    if (!env.ANTHROPIC_API_KEY) {
      return fallbackRiskAnalysis;
    }

    try {
      const responseText = await requestClaudeText(buildProjectDocumentRiskPrompt(input), 360);
      const parsedRiskAnalysis = parseProjectDocumentRiskAnalysis(responseText);

      if (!parsedRiskAnalysis) {
        logger.warn("Claude risk analysis response was invalid JSON. Falling back to local risk analysis.", {
          model: env.ANTHROPIC_MODEL,
          response: responseText?.slice(0, 500)
        });

        return fallbackRiskAnalysis;
      }

      return {
        ...parsedRiskAnalysis,
        source: "claude" as const
      };
    } catch (error) {
      logger.warn("Claude risk analysis failed. Falling back to local risk analysis.", {
        model: env.ANTHROPIC_MODEL,
        error: error instanceof Error ? error.message : String(error)
      });

      return fallbackRiskAnalysis;
    }
  },
  async planProjectDocumentActions(input: {
    project: ProjectRecord;
    document: ProjectDocumentRecord;
    teamMembers: ProjectTeamMemberRecord[];
    changeOrders: ChangeOrderRecord[];
    classification: ProjectDocumentClassification;
    riskAnalysis: ProjectDocumentRiskAnalysis;
    extractedText?: string;
    memoryEntries?: Array<{ kind: string; title: string; content: string }>;
  }) {
    const fallbackAnalysis = buildProjectDocumentAgentFallback({
      project: input.project,
      document: input.document,
      teamMembers: input.teamMembers,
      changeOrders: input.changeOrders,
      extractedText: input.extractedText
    });
    const fallbackPlan: ProjectDocumentActionPlan = {
      summary: fallbackAnalysis.summary,
      suggestedAssignee: fallbackAnalysis.suggestedAssignee,
      actionItems: fallbackAnalysis.actionItems,
      projectComment: `${fallbackAnalysis.summary} ${fallbackAnalysis.keyRisks.length > 0 ? `Watchouts: ${fallbackAnalysis.keyRisks.map((risk) => risk.title).join(", ")}.` : ""}`.trim(),
      changeOrderFollowUp: fallbackAnalysis.keyRisks.some((risk) => risk.description.toLowerCase().includes("cost"))
        ? "Review whether this document should trigger a new or updated change-order workflow."
        : undefined,
      source: "fallback"
    };

    if (!env.ANTHROPIC_API_KEY) {
      return fallbackPlan;
    }

    try {
      const responseText = await requestClaudeText(buildProjectDocumentActionPlanPrompt(input), 520);
      const parsedPlan = parseProjectDocumentActionPlan(responseText);

      if (!parsedPlan) {
        logger.warn("Claude action plan response was invalid JSON. Falling back to local action plan.", {
          model: env.ANTHROPIC_MODEL,
          response: responseText?.slice(0, 500)
        });

        return fallbackPlan;
      }

      return {
        ...parsedPlan,
        source: "claude" as const
      };
    } catch (error) {
      logger.warn("Claude action planning failed. Falling back to local action plan.", {
        model: env.ANTHROPIC_MODEL,
        error: error instanceof Error ? error.message : String(error)
      });

      return fallbackPlan;
    }
  },
  async answerProjectQuestion(input: {
    question: string;
    citations: ProjectQuestionAnswerRecord["citations"];
  }) {
    const fallbackAnswer = buildProjectQuestionFallback(input);

    if (!env.ANTHROPIC_API_KEY) {
      return fallbackAnswer;
    }

    try {
      const responseText = await requestClaudeText(buildProjectQuestionPrompt(input), 420);
      const parsedAnswer = parseProjectQuestionAnswer(responseText, input.citations);

      if (!parsedAnswer) {
        logger.warn("Claude project Q&A response was invalid JSON. Falling back to local answer.", {
          model: env.ANTHROPIC_MODEL,
          response: responseText?.slice(0, 500)
        });

        return fallbackAnswer;
      }

      return {
        ...parsedAnswer,
        source: "claude" as const
      };
    } catch (error) {
      logger.warn("Claude project Q&A failed. Falling back to local answer.", {
        model: env.ANTHROPIC_MODEL,
        error: error instanceof Error ? error.message : String(error)
      });

      return fallbackAnswer;
    }
  }
};
