import type { AuthenticatedUser } from "../types/domain.js";
import { changeOrderService } from "../services/changeOrder.service.js";

export async function csvImportJob(requestUser: AuthenticatedUser, csvContent: string) {
  const [header, ...rows] = csvContent.trim().split("\n");

  if (!header) {
    return [];
  }

  return Promise.all(
    rows
      .map((row) => row.split(","))
      .filter((columns) => columns.length >= 5)
      .map(([projectId, title, description, amount, requestedBy]) =>
        changeOrderService.createChangeOrder(requestUser, {
          projectId,
          title,
          description,
          amount: Number(amount),
          requestedBy,
          assignedTo: requestedBy
        })
      )
  );
}
