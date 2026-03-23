import { changeOrderService } from "../services/changeOrder.service.js";

export function csvImportJob(csvContent: string) {
  const [header, ...rows] = csvContent.trim().split("\n");

  if (!header) {
    return [];
  }

  return rows
    .map((row) => row.split(","))
    .filter((columns) => columns.length >= 5)
    .map(([projectId, title, description, amount, requestedBy]) =>
      changeOrderService.createChangeOrder({
        projectId,
        title,
        description,
        amount: Number(amount),
        requestedBy
      })
    );
}

