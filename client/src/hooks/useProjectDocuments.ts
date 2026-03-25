import { useEffect, useState } from "react";

import { getProjectDocuments } from "../api/projects";
import type { ProjectDocument } from "../types/project";

export function useProjectDocuments(projectId?: string) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!projectId) {
      setDocuments([]);
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const items = await getProjectDocuments(projectId);
      setDocuments(items);
      return items;
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Request failed.";
      setError(message);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [projectId]);

  return { documents, loading, error, refresh };
}

