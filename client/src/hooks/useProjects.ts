import { useEffect, useState } from "react";

import { getProjects } from "../api/projects";
import type { Project } from "../types/project";

export function useProjects(options?: { includeArchived?: boolean }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const items = await getProjects(options);
      setProjects(items);
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
  }, [options?.includeArchived]);

  return { projects, loading, error, refresh };
}
