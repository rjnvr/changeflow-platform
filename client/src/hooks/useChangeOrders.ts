import { useEffect, useState } from "react";

import { getChangeOrders } from "../api/changeOrders";
import type { ChangeOrder } from "../types/changeOrder";

export function useChangeOrders(projectId?: string, options?: { includeArchived?: boolean }) {
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const items = await getChangeOrders(projectId, options);
      setChangeOrders(items);
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
  }, [options?.includeArchived, projectId]);

  return { changeOrders, loading, error, refresh };
}
