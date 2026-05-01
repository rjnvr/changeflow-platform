import { documentChunkRepository } from "../repositories/documentChunk.repository.js";
import { projectDocumentRepository } from "../repositories/projectDocument.repository.js";
import type { DocumentChunkRecord, ProjectQuestionAnswerRecord } from "../types/domain.js";
import { aiSummaryService } from "./aiSummary.service.js";
import { embeddingService } from "./embedding.service.js";

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

function cosineSimilarity(left: number[], right: number[]) {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) {
    return 0;
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dotProduct += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
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
    const lexicalRankedChunks = allChunks
      .map((chunk) => ({
        chunk,
        score: scoreChunk(questionTokens, chunk)
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score || left.chunk.chunkIndex - right.chunk.chunkIndex)
      .slice(0, 8);

    let citedChunks = lexicalRankedChunks.length > 0 ? lexicalRankedChunks.map((entry) => entry.chunk) : allChunks.slice(0, 4);

    if (embeddingService.isConfigured() && allChunks.some((chunk) => Array.isArray(chunk.embedding) && chunk.embedding.length > 0)) {
      const [questionEmbedding] = await embeddingService.embedTexts([input.question], "query");

      if (questionEmbedding) {
        const semanticRankedChunks = allChunks
          .map((chunk) => ({
            chunk,
            semanticScore: chunk.embedding ? cosineSimilarity(questionEmbedding, chunk.embedding) : 0,
            lexicalScore: scoreChunk(questionTokens, chunk)
          }))
          .filter((entry) => entry.semanticScore > 0 || entry.lexicalScore > 0)
          .sort(
            (left, right) =>
              right.semanticScore - left.semanticScore ||
              right.lexicalScore - left.lexicalScore ||
              left.chunk.chunkIndex - right.chunk.chunkIndex
          )
          .slice(0, 4)
          .map((entry) => entry.chunk);

        if (semanticRankedChunks.length > 0) {
          citedChunks = semanticRankedChunks;
        }
      }
    }

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
