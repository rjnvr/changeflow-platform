import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { createProject } from "../../api/projects";
import type { Project } from "../../types/project";
import { Button } from "../common/Button";

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    backgroundColor: "#E6F6FF",
    "& fieldset": {
      borderColor: "rgba(191,201,196,0.24)"
    },
    "&:hover fieldset": {
      borderColor: "rgba(4,107,94,0.28)"
    },
    "&.Mui-focused fieldset": {
      borderColor: "#046B5E"
    }
  }
} as const;

interface CreateProjectModalProps {
  open: boolean;
  ownerId: string;
  onClose: () => void;
  onCreated?: (project: Project) => Promise<void> | void;
}

export function CreateProjectModal({ open, ownerId, onClose, onCreated }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<Project["status"]>("active");
  const [contractValue, setContractValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setName("");
    setCode("");
    setLocation("");
    setStatus("active");
    setContractValue("");
    setError("");
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericContractValue = Number(contractValue);

    if (
      name.trim().length < 2 ||
      code.trim().length < 2 ||
      location.trim().length < 2 ||
      !Number.isFinite(numericContractValue) ||
      numericContractValue <= 0
    ) {
      setError("Add a project name, code, location, and a positive contract value.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const project = await createProject({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        location: location.trim(),
        status,
        contractValue: numericContractValue,
        ownerId
      });
      await onCreated?.(project);
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create project.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      sx={{
        zIndex: 1400,
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0,52,43,0.16)",
          backdropFilter: "blur(8px)"
        },
        "& .MuiDialog-paper": {
          borderRadius: 6,
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 32px 64px rgba(7,30,39,0.18)"
        }
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
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
            <Typography
              sx={{
                fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                fontSize: { xs: "2rem", md: "2.6rem" },
                fontWeight: 900,
                letterSpacing: -1.4,
                color: "#00342B"
              }}
            >
              Create New Project
            </Typography>
            <Typography sx={{ mt: 1, fontSize: "1rem", color: "#42536D" }}>
              Add a new project into the ChangeFlow portfolio.
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: "#707975" }}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        <Stack spacing={2.8} sx={{ px: { xs: 3, md: 4 }, py: 4 }}>
          <TextField
            fullWidth
            autoFocus
            label="Project Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            sx={fieldStyles}
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              fullWidth
              label="Project Code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="e.g., WST-014"
              sx={fieldStyles}
            />
            <TextField
              fullWidth
              label="Status"
              select
              value={status}
              onChange={(event) => setStatus(event.target.value as Project["status"])}
              SelectProps={{
                native: true
              }}
              sx={fieldStyles}
            >
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </TextField>
          </Stack>

          <TextField
            fullWidth
            label="Location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            sx={fieldStyles}
          />

          <TextField
            fullWidth
            type="number"
            label="Contract Value"
            value={contractValue}
            onChange={(event) => setContractValue(event.target.value)}
            sx={fieldStyles}
          />

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
              minWidth: 180,
              py: 1.4,
              borderRadius: 2.5,
              fontSize: "0.98rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)"
            }}
          >
            {submitting ? "Creating..." : "Create Project"}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
