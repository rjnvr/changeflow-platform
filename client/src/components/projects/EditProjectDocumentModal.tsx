import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { updateProjectDocument } from "../../api/projects";
import type { ProjectDocument, ProjectTeamMember } from "../../types/project";
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

const kindOptions = ["PDF", "Drawing", "Quote", "Report", "Photo Set", "Spec"] as const;
const AUTO_ASSIGN_OPTION = "__AUTO_ASSIGN__";

interface EditProjectDocumentModalProps {
  open: boolean;
  projectId: string;
  document: ProjectDocument;
  teamMembers: ProjectTeamMember[];
  onClose: () => void;
  onSaved?: () => Promise<void> | void;
}

export function EditProjectDocumentModal({
  open,
  projectId,
  document,
  teamMembers,
  onClose,
  onSaved
}: EditProjectDocumentModalProps) {
  const [title, setTitle] = useState(document.title);
  const [kind, setKind] = useState(document.kind);
  const [summary, setSummary] = useState(document.summary);
  const [url, setUrl] = useState(document.url ?? "");
  const [assignedTo, setAssignedTo] = useState(document.assignedTo ?? AUTO_ASSIGN_OPTION);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const assigneeOptions = Array.from(
    new Set(
      [document.assignedTo, ...teamMembers.map((member) => member.name)]
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ).sort((left, right) => left.localeCompare(right));

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(document.title);
    setKind(document.kind);
    setSummary(document.summary);
    setUrl(document.url ?? "");
    setAssignedTo(document.assignedTo ?? AUTO_ASSIGN_OPTION);
    setError("");
  }, [document, open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (title.trim().length < 2 || summary.trim().length < 10) {
      setError("Add a document title and a short summary.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await updateProjectDocument(projectId, document.id, {
        title: title.trim(),
        kind: kind.trim(),
        summary: summary.trim(),
        assignedTo: assignedTo === AUTO_ASSIGN_OPTION ? undefined : assignedTo,
        url: document.storageKey ? undefined : url.trim() || undefined
      });
      await onSaved?.();
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update document.");
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
                fontSize: { xs: "2rem", md: "2.4rem" },
                fontWeight: 900,
                letterSpacing: -1.4,
                color: "#00342B"
              }}
            >
              Edit Document
            </Typography>
            <Typography sx={{ mt: 1, fontSize: "1rem", color: "#42536D" }}>
              Update the document metadata for {document.title}.
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
            label="Document Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            sx={fieldStyles}
          />
          <TextField
            fullWidth
            select
            label="Kind"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            SelectProps={{ native: true }}
            sx={fieldStyles}
          >
            {kindOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </TextField>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            sx={fieldStyles}
          />
          <TextField
            fullWidth
            select
            label="Assign To"
            value={assignedTo}
            onChange={(event) => setAssignedTo(event.target.value)}
            SelectProps={{ native: true }}
            sx={fieldStyles}
          >
            <option value={AUTO_ASSIGN_OPTION}>Auto-assign based on document type</option>
            {assigneeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </TextField>
          <Typography sx={{ mt: -1, fontSize: "0.82rem", color: "#5A6A84" }}>
            {assigneeOptions.length > 0
              ? "Choose a teammate directly, or leave it on auto-assign so ChangeFlow routes the doc by role."
              : "Add project team members to enable manual document assignment. Auto-assign stays available."}
          </Typography>
          <TextField
            fullWidth
            label={document.storageKey ? "External Link (locked for uploaded files)" : "External Link"}
            value={document.storageKey ? document.url ?? "" : url}
            onChange={(event) => setUrl(event.target.value)}
            disabled={Boolean(document.storageKey)}
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
              fontWeight: 800,
              background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)"
            }}
          >
            {submitting ? "Saving..." : "Save Document"}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
