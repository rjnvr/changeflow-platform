import { documentChunkRepository } from "../repositories/documentChunk.repository.js";
import { projectDocumentRepository } from "../repositories/projectDocument.repository.js";
import type { DocumentChunkRecord, ProjectQuestionAnswerRecord } from "../types/domain.js";
import { aiSummaryService } from "./aiSummary.service.js";

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function scoreChunk(questionTokens: string[], chunk: DocumentChunkRecord) {
  const normalizedChunk = normalizeText(chunk.content);
  let score = 0;

  for (const token of questionTokens) {
    if (normalizedChunk.includes(token)) {
      score += token.length > 6 ? 2 : 1;
    }
  }

  return score;
}

function chunkDocumentText(text: string, maxChars = 1400) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  if (!normalized) {
    return [];
  }

  const paragraphs = normalized.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;

    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
    }

    if (paragraph.length <= maxChars) {
      current = paragraph;
      continue;
    }

    for (let cursor = 0; cursor < paragraph.length; cursor += maxChars) {
      chunks.push(paragraph.slice(cursor, cursor + maxChars));
    }

    current = "";
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.map((content, index) => ({
    chunkIndex: index,
    content
  }));
}

export const ragService = {
  chunkDocumentText,
  async answerProjectQuestion(input: { projectId: string; question: string }) {
    const questionTokens = tokenize(input.question);
    const allChunks = await documentChunkRepository.listByProject(input.projectId);
    const rankedChunks = allChunks
      .map((chunk) => ({
        chunk,
        score: scoreChunk(questionTokens, chunk)
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score || left.chunk.chunkIndex - right.chunk.chunkIndex)
      .slice(0, 4);

    const citedChunks = rankedChunks.length > 0 ? rankedChunks.map((entry) => entry.chunk) : allChunks.slice(0, 3);
    const documents = await projectDocumentRepository.listByProject(input.projectId);
    const documentMap = new Map(documents.map((document) => [document.id, document]));

    const citations: ProjectQuestionAnswerRecord["citations"] = citedChunks.map((chunk) => ({
      documentId: chunk.documentId,
      documentTitle: documentMap.get(chunk.documentId)?.title ?? "Project document",
      chunkIndex: chunk.chunkIndex,
      excerpt: chunk.content.slice(0, 320)
    }));

    const answer = await aiSummaryService.answerProjectQuestion({
      question: input.question,
      citations
    });

    return answer;
  }
};
