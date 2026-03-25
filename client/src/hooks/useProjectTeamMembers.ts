import { useEffect, useState } from "react";

import { getProjectTeamMembers } from "../api/projects";
import type { ProjectTeamMember } from "../types/project";

export function useProjectTeamMembers(projectId: string) {
  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!projectId) {
      setTeamMembers([]);
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const items = await getProjectTeamMembers(projectId);
      setTeamMembers(items);
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

  return { teamMembers, loading, error, refresh };
}
