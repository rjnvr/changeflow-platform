import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

type VoyageEmbeddingsResponse = {
  data?: Array<{
    embedding?: number[];
    index?: number;
  }>;
};

export const embeddingService = {
  isConfigured() {
    return Boolean(env.VOYAGE_API_KEY);
  },
  async embedTexts(texts: string[], inputType: "query" | "document") {
    if (!env.VOYAGE_API_KEY || texts.length === 0) {
      return [];
    }

    try {
      const response = await fetch("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.VOYAGE_API_KEY}`
        },
        body: JSON.stringify({
          model: env.VOYAGE_EMBEDDING_MODEL,
          input: texts,
          input_type: inputType,
          output_dtype: "float"
        }),
        signal: AbortSignal.timeout(20_000)
      });

      if (!response.ok) {
        const body = await response.text();
        logger.warn("Embedding request failed.", {
          status: response.status,
          model: env.VOYAGE_EMBEDDING_MODEL,
          inputType,
          body: body.slice(0, 500)
        });
        return [];
      }

      const payload = (await response.json()) as VoyageEmbeddingsResponse;
      return (payload.data ?? [])
        .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
        .map((entry) => entry.embedding ?? []);
    } catch (error) {
      logger.warn("Embedding request threw an error.", {
        model: env.VOYAGE_EMBEDDING_MODEL,
        inputType,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }
};
