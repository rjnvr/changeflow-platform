import Chip from "@mui/material/Chip";

const STYLE_BY_STATUS = {
  active: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    color: "#047857",
    borderColor: "rgba(16, 185, 129, 0.24)"
  },
  approved: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    color: "#047857",
    borderColor: "rgba(16, 185, 129, 0.24)"
  },
  completed: {
    backgroundColor: "rgba(14, 165, 233, 0.12)",
    color: "#0369A1",
    borderColor: "rgba(14, 165, 233, 0.24)"
  },
  connected: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    color: "#047857",
    borderColor: "rgba(16, 185, 129, 0.24)"
  },
  disconnected: {
    backgroundColor: "rgba(148, 163, 184, 0.14)",
    color: "#475569",
    borderColor: "rgba(148, 163, 184, 0.3)"
  },
  draft: {
    backgroundColor: "rgba(148, 163, 184, 0.14)",
    color: "#475569",
    borderColor: "rgba(148, 163, 184, 0.3)"
  },
  error: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    color: "#B91C1C",
    borderColor: "rgba(239, 68, 68, 0.24)"
  },
  "on-hold": {
    backgroundColor: "rgba(245, 158, 11, 0.14)",
    color: "#B45309",
    borderColor: "rgba(245, 158, 11, 0.24)"
  },
  pending_review: {
    backgroundColor: "rgba(245, 158, 11, 0.14)",
    color: "#B45309",
    borderColor: "rgba(245, 158, 11, 0.24)"
  },
  rejected: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    color: "#B91C1C",
    borderColor: "rgba(239, 68, 68, 0.24)"
  },
  synced: {
    backgroundColor: "rgba(59, 130, 246, 0.12)",
    color: "#1D4ED8",
    borderColor: "rgba(59, 130, 246, 0.24)"
  }
} as const;

export function StatusBadge({ status }: { status: keyof typeof STYLE_BY_STATUS | string }) {
  const style = STYLE_BY_STATUS[status as keyof typeof STYLE_BY_STATUS] ?? STYLE_BY_STATUS.disconnected;

  return (
    <Chip
      label={status.replaceAll("_", " ").replaceAll("-", " ")}
      size="small"
      sx={{
        textTransform: "capitalize",
        fontWeight: 700,
        borderRadius: 2.5,
        border: "1px solid",
        ...style,
        "& .MuiChip-label": {
          px: 1.4
        }
      }}
    />
  );
}

