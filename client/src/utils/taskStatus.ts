import type { ProjectTask } from "../types/project";

export const TASK_STATUS_ORDER: ProjectTask["status"][] = ["suggested", "open", "in_progress", "done"];

export const TASK_STATUS_META: Record<
  ProjectTask["status"],
  {
    label: string;
    boardLabel: string;
    description: string;
    backgroundColor: string;
    color: string;
    accentColor: string;
    actionBackgroundColor: string;
    actionColor: string;
  }
> = {
  suggested: {
    label: "Suggested",
    boardLabel: "Needs Review",
    description: "Agent-created follow-up waiting for a human to add it to active work.",
    backgroundColor: "#FFF1D6",
    color: "#8A4B00",
    accentColor: "#D17A00",
    actionBackgroundColor: "#FFE0A8",
    actionColor: "#7A4300"
  },
  open: {
    label: "Ready",
    boardLabel: "Ready to Start",
    description: "Approved work item that is ready for someone to begin.",
    backgroundColor: "#DFF2FF",
    color: "#0A5E8A",
    accentColor: "#1481B8",
    actionBackgroundColor: "#BFE7FF",
    actionColor: "#0A5E8A"
  },
  in_progress: {
    label: "In Progress",
    boardLabel: "In Progress",
    description: "Actively being worked by the assigned teammate.",
    backgroundColor: "#EADFFF",
    color: "#5F3AA7",
    accentColor: "#7B57C2",
    actionBackgroundColor: "#D8C7FF",
    actionColor: "#5F3AA7"
  },
  done: {
    label: "Done",
    boardLabel: "Completed",
    description: "Finished work item. Reopen if more follow-up is needed.",
    backgroundColor: "#D9F7E6",
    color: "#147A48",
    accentColor: "#1C9B5E",
    actionBackgroundColor: "#BFEFCF",
    actionColor: "#147A48"
  }
};

export const TASK_NEXT_STATUS_LABELS: Record<ProjectTask["status"], Partial<Record<ProjectTask["status"], string>>> = {
  suggested: {
    open: "Approve and add to board"
  },
  open: {
    in_progress: "Start work",
    done: "Mark done"
  },
  in_progress: {
    done: "Mark done",
    open: "Move back to ready"
  },
  done: {
    open: "Reopen task"
  }
};

export function getTaskStatusMeta(status: ProjectTask["status"]) {
  return TASK_STATUS_META[status];
}

export function getTaskTransitionLabel(
  currentStatus: ProjectTask["status"],
  nextStatus: ProjectTask["status"]
) {
  return TASK_NEXT_STATUS_LABELS[currentStatus][nextStatus] ?? nextStatus.replace("_", " ");
}

export function getTaskTransitionMeta(nextStatus: ProjectTask["status"]) {
  const status = getTaskStatusMeta(nextStatus);

  return {
    backgroundColor: status.actionBackgroundColor,
    color: status.actionColor
  };
}
