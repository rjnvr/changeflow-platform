import { useEffect, useState } from "react";

import { getProjectTeamDirectory } from "../api/projects";
import type { ProjectTeamMemberDirectoryEntry } from "../types/project";

export function useProjectTeamDirectory() {
  const [entries, setEntries] = useState<ProjectTeamMemberDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const items = await getProjectTeamDirectory();
      setEntries(items);
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
  }, []);

  return { entries, loading, error, refresh };
}
