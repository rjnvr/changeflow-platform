import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { updateChangeOrder } from "../../api/changeOrders";
import { useProjectTeamMembers } from "../../hooks/useProjectTeamMembers";
import type { ChangeOrder } from "../../types/changeOrder";
import type { Project } from "../../types/project";
import { Button } from "../common/Button";

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    backgroundColor: "#E6F6FF",
    "& fieldset": {
      borderColor: "rgba(191,201,196,0.2)"
    },
    "&:hover fieldset": {
      borderColor: "rgba(4,107,94,0.32)"
    },
    "&.Mui-focused fieldset": {
      borderColor: "#046B5E"
    }
  }
} as const;

interface EditChangeOrderModalProps {
  open: boolean;
  changeOrder: ChangeOrder;
  projects: Project[];
  onClose: () => void;
  onSaved?: (changeOrder: ChangeOrder) => Promise<void> | void;
}

export function EditChangeOrderModal({
  open,
  changeOrder,
  projects,
  onClose,
  onSaved
}: EditChangeOrderModalProps) {
  const [projectId, setProjectId] = useState(changeOrder.projectId);
  const [title, setTitle] = useState(changeOrder.title);
  const [description, setDescription] = useState(changeOrder.description);
  const [amount, setAmount] = useState(String(changeOrder.amount));
  const [requestedBy, setRequestedBy] = useState(changeOrder.requestedBy);
  const [assignedTo, setAssignedTo] = useState(changeOrder.assignedTo ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { teamMembers } = useProjectTeamMembers(projectId);

  useEffect(() => {
    if (!open) {
      return;
    }

    setProjectId(changeOrder.projectId);
    setTitle(changeOrder.title);
    setDescription(changeOrder.description);
    setAmount(String(changeOrder.amount));
    setRequestedBy(changeOrder.requestedBy);
    setAssignedTo(changeOrder.assignedTo ?? "");
    setError("");
  }, [changeOrder, open]);

  useEffect(() => {
    if (!open || teamMembers.length === 0) {
      return;
    }

    const hasSelectedMember = teamMembers.some((member) => member.name === assignedTo);

    if (!assignedTo || !hasSelectedMember) {
      setAssignedTo(teamMembers[0]?.name ?? "");
    }
  }, [assignedTo, open, teamMembers]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (
      !projectId ||
      title.trim().length < 2 ||
      description.trim().length < 10 ||
      requestedBy.trim().length < 2 ||
      assignedTo.trim().length < 2 ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError("Add a project, requester, assignee, title, description, and a positive value.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const updatedChangeOrder = await updateChangeOrder(changeOrder.id, {
        projectId,
        title: title.trim(),
        description: description.trim(),
        amount: numericAmount,
        requestedBy: requestedBy.trim(),
        assignedTo: assignedTo.trim()
      });

      await onSaved?.(updatedChangeOrder);
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update change order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      sx={{
        zIndex: 1500,
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
              Edit Change Order
            </Typography>
            <Typography sx={{ mt: 1, fontSize: "1rem", color: "#42536D" }}>
              Update the commercial record for this change order.
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: "#707975" }}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        <Stack spacing={3} sx={{ px: { xs: 3, md: 4 }, py: 4 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              fullWidth
              select
              label="Project"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              SelectProps={{ native: true }}
              sx={fieldStyles}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} - {project.code}
                </option>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              sx={fieldStyles}
            />
          </Stack>

          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            sx={fieldStyles}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: 2
            }}
          >
            <TextField
              fullWidth
              label="Requested By"
              value={requestedBy}
              onChange={(event) => setRequestedBy(event.target.value)}
              sx={fieldStyles}
            />
            {teamMembers.length > 0 ? (
              <TextField
                fullWidth
                select
                label="Assigned To"
                value={assignedTo}
                onChange={(event) => setAssignedTo(event.target.value)}
                SelectProps={{ native: true }}
                sx={fieldStyles}
              >
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name} - {member.role}
                  </option>
                ))}
              </TextField>
            ) : (
              <TextField
                fullWidth
                label="Assigned To"
                value={assignedTo}
                onChange={(event) => setAssignedTo(event.target.value)}
                sx={fieldStyles}
              />
            )}
            <TextField
              fullWidth
              type="number"
              label="Estimated Value"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              sx={fieldStyles}
            />
          </Box>

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
              fontWeight: 800,
              background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)"
            }}
          >
            {submitting ? "Saving..." : "Save Change Order"}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
