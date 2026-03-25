import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import GroupAddRoundedIcon from "@mui/icons-material/GroupAddRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { createProjectTeamMember, updateProjectTeamMember } from "../../api/projects";
import type { ProjectTeamMember } from "../../types/project";
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

interface AddTeamMemberModalProps {
  open: boolean;
  projectId: string;
  onClose: () => void;
  onCreated?: () => Promise<void> | void;
  teamMember?: ProjectTeamMember | null;
}

export function AddTeamMemberModal({
  open,
  projectId,
  onClose,
  onCreated,
  teamMember
}: AddTeamMemberModalProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(teamMember?.name ?? "");
    setRole(teamMember?.role ?? "");
    setError("");
  }, [open, teamMember?.name, teamMember?.role]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (name.trim().length < 2 || role.trim().length < 2) {
      setError("Add both a team member name and role.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (teamMember) {
        await updateProjectTeamMember(projectId, teamMember.id, {
          name: name.trim(),
          role: role.trim()
        });
      } else {
        await createProjectTeamMember(projectId, {
          name: name.trim(),
          role: role.trim()
        });
      }
      await onCreated?.();
      onClose();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : teamMember
            ? "Unable to update team member."
            : "Unable to add team member."
      );
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
          backgroundColor: "rgba(0,52,43,0.18)",
          backdropFilter: "blur(8px)"
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: "100%",
            maxWidth: 560,
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
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 2,
              borderBottom: "1px solid rgba(191,201,196,0.18)"
            }}
          >
            <Box>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <GroupAddRoundedIcon sx={{ color: "#046B5E" }} />
                <Typography
                  sx={{
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: { xs: "2rem", md: "2.5rem" },
                    fontWeight: 900,
                    letterSpacing: -1.4,
                    color: "#00342B"
                  }}
                >
                  {teamMember ? "Edit Team Member" : "Add Team Member"}
                </Typography>
              </Stack>
              <Typography sx={{ mt: 1, fontSize: "1rem", color: "#42536D" }}>
                {teamMember
                  ? "Update this on-site collaborator for the project workspace."
                  : "Add a new on-site collaborator to this project workspace."}
              </Typography>
            </Box>

            <IconButton onClick={onClose} sx={{ color: "#707975" }}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          <Stack spacing={3} sx={{ px: { xs: 3, md: 4 }, py: 4 }}>
            <Box>
              <Typography
                sx={{
                  mb: 1.2,
                  fontSize: "0.82rem",
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: "#00342B"
                }}
              >
                Full Name
              </Typography>
              <TextField
                fullWidth
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g., Priya Shah"
                sx={fieldStyles}
              />
            </Box>

            <Box>
              <Typography
                sx={{
                  mb: 1.2,
                  fontSize: "0.82rem",
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: "#00342B"
                }}
              >
                Role
              </Typography>
              <TextField
                fullWidth
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="e.g., Structural Engineer"
                sx={fieldStyles}
              />
            </Box>

            {error ? (
              <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, color: "#872000" }}>{error}</Typography>
            ) : null}
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
                fontWeight: 800,
                background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)"
              }}
            >
              {submitting ? (teamMember ? "Saving..." : "Adding...") : teamMember ? "Save Member" : "Add Member"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
