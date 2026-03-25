import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { bulkUpdateProjectStatus } from "../../api/projects";
import { Button } from "../common/Button";

const statusOptions = [
  { value: "active", label: "Mark Active", description: "Move selected projects back into the active delivery portfolio." },
  { value: "on-hold", label: "Place On Hold", description: "Flag selected projects as paused while preserving their history." },
  { value: "completed", label: "Mark Completed", description: "Close out selected projects for archive and reporting views." }
] as const;

interface BulkProjectActionsModalProps {
  open: boolean;
  projectIds: string[];
  onClose: () => void;
  onApplied?: () => Promise<void> | void;
}

export function BulkProjectActionsModal({
  open,
  projectIds,
  onClose,
  onApplied
}: BulkProjectActionsModalProps) {
  const [status, setStatus] = useState<(typeof statusOptions)[number]["value"]>("active");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectionLabel = useMemo(() => {
    if (projectIds.length === 1) {
      return "1 selected project";
    }

    return `${projectIds.length} selected projects`;
  }, [projectIds.length]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setStatus("active");
    setError("");
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (projectIds.length === 0) {
      setError("Select at least one project from the inventory table.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await bulkUpdateProjectStatus({
        projectIds,
        status
      });
      await onApplied?.();
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to apply bulk action.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} sx={{ zIndex: 1400 }}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, md: 4 },
          backgroundColor: "rgba(0,52,43,0.16)",
          backdropFilter: "blur(8px)"
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: "100%",
            maxWidth: 640,
            borderRadius: 6,
            backgroundColor: "#FFFFFF",
            boxShadow: "0 32px 64px rgba(7,30,39,0.18)",
            overflow: "hidden"
          }}
        >
          <Box
            sx={{
              px: { xs: 3, md: 4 },
              py: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 2,
              borderBottom: "1px solid rgba(191,201,196,0.18)"
            }}
          >
            <Box>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <DoneAllRoundedIcon sx={{ color: "#046B5E" }} />
                <Typography
                  sx={{
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: { xs: "2rem", md: "2.5rem" },
                    fontWeight: 900,
                    letterSpacing: -1.4,
                    color: "#00342B"
                  }}
                >
                  Bulk Project Actions
                </Typography>
              </Stack>
              <Typography sx={{ mt: 1, fontSize: "1rem", color: "#42536D" }}>
                Apply one operational status to {selectionLabel}.
              </Typography>
            </Box>

            <IconButton onClick={onClose} sx={{ color: "#707975" }}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          <Stack spacing={2} sx={{ px: { xs: 3, md: 4 }, py: 4 }}>
            {statusOptions.map((option) => {
              const active = status === option.value;

              return (
                <Box
                  key={option.value}
                  onClick={() => setStatus(option.value)}
                  sx={{
                    p: 2.4,
                    borderRadius: 3,
                    cursor: "pointer",
                    border: active ? "1px solid rgba(4,107,94,0.44)" : "1px solid rgba(191,201,196,0.28)",
                    backgroundColor: active ? "#E6F6FF" : "#FFFFFF",
                    transition: "all 160ms ease"
                  }}
                >
                  <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>{option.label}</Typography>
                  <Typography sx={{ mt: 0.8, fontSize: "0.95rem", lineHeight: 1.6, color: "#5A6A84" }}>
                    {option.description}
                  </Typography>
                </Box>
              );
            })}

            {error ? <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, color: "#872000" }}>{error}</Typography> : null}
          </Stack>

          <Box
            sx={{
              px: { xs: 3, md: 4 },
              py: 3,
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              flexWrap: "wrap",
              backgroundColor: "#E6F6FF"
            }}
          >
            <Button
              type="button"
              variant="outlined"
              onClick={onClose}
              sx={{
                minWidth: 140,
                py: 1.4,
                borderRadius: 2.5,
                borderColor: "rgba(0,52,43,0.12)",
                color: "#00342B",
                backgroundColor: "#FFFFFF"
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              sx={{
                minWidth: 200,
                py: 1.4,
                borderRadius: 2.5,
                fontWeight: 800,
                background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)"
              }}
            >
              {submitting ? "Applying..." : "Apply Status"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
