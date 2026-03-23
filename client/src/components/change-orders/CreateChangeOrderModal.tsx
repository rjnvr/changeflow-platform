import { useEffect, useId, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { createChangeOrder } from "../../api/changeOrders";
import { Button } from "../common/Button";
import type { Project } from "../../types/project";

interface CreateChangeOrderModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => Promise<void> | void;
  projects: Project[];
  defaultProjectId?: string;
}

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

export function CreateChangeOrderModal({
  open,
  onClose,
  onCreated,
  projects,
  defaultProjectId
}: CreateChangeOrderModalProps) {
  const uploadId = useId();
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextProjectId = defaultProjectId ?? projects[0]?.id ?? "";
    setProjectId(nextProjectId);
    setTitle("");
    setDescription("");
    setAmount("");
    setUrgent(false);
    setFiles([]);
    setError("");
  }, [defaultProjectId, open, projects]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (!projectId || title.trim().length < 2 || description.trim().length < 10 || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Add a project, title, description, and a positive estimated value.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await createChangeOrder({
        projectId,
        title: urgent ? `${title.trim()} [Urgent]` : title.trim(),
        description: description.trim(),
        amount: numericAmount,
        requestedBy: "Demo User"
      });

      await onCreated?.();
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create change order.");
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
            maxWidth: 840,
            maxHeight: "92vh",
            overflow: "hidden",
            borderRadius: 6,
            backgroundColor: "#FFFFFF",
            boxShadow: "0 32px 64px rgba(7,30,39,0.18)"
          }}
        >
          <Box
            sx={{
              px: { xs: 3, md: 5 },
              py: 3.5,
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              alignItems: "flex-start",
              borderBottom: "1px solid rgba(191,201,196,0.18)"
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontSize: { xs: "2rem", md: "3rem" },
                  fontWeight: 900,
                  letterSpacing: -1.8,
                  color: "#00342B"
                }}
              >
                Create New Change Order
              </Typography>
              <Typography sx={{ mt: 1, fontSize: "1rem", color: "#42536D" }}>
                Formalize project adjustments and budget modifications.
              </Typography>
            </Box>
            <IconButton onClick={onClose} sx={{ color: "#707975" }}>
              <CloseRoundedIcon sx={{ fontSize: 32 }} />
            </IconButton>
          </Box>

          <Box sx={{ px: { xs: 3, md: 5 }, py: 4, maxHeight: "calc(92vh - 198px)", overflowY: "auto" }}>
            <Stack spacing={4}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                  gap: 3.5
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      mb: 1.2,
                      fontSize: "0.88rem",
                      fontWeight: 900,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      color: "#00342B"
                    }}
                  >
                    Project Selection
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    value={projectId}
                    onChange={(event) => setProjectId(event.target.value)}
                    sx={fieldStyles}
                  >
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name} - {project.code}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Box>
                  <Typography
                    sx={{
                      mb: 1.2,
                      fontSize: "0.88rem",
                      fontWeight: 900,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      color: "#00342B"
                    }}
                  >
                    Title
                  </Typography>
                  <TextField
                    fullWidth
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g., Structural Steel Reinforcement"
                    sx={fieldStyles}
                  />
                </Box>
              </Box>

              <Box>
                <Typography
                  sx={{
                    mb: 1.2,
                    fontSize: "0.88rem",
                    fontWeight: 900,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "#00342B"
                  }}
                >
                  Description & Scope
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the reason for change and the affected structural elements..."
                  sx={fieldStyles}
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                  gap: 4,
                  alignItems: "end"
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      mb: 1.2,
                      fontSize: "0.88rem",
                      fontWeight: 900,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      color: "#00342B"
                    }}
                  >
                    Estimated Value
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0.00"
                    sx={fieldStyles}
                    InputProps={{
                      startAdornment: (
                        <Typography sx={{ mr: 1, fontSize: "1.2rem", fontWeight: 800, color: "#00342B" }}>
                          $
                        </Typography>
                      )
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    px: 2.4,
                    py: 2,
                    borderRadius: 3,
                    backgroundColor: "#E6F6FF"
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <BoltRoundedIcon sx={{ color: "#7A1E08" }} />
                    <Box>
                      <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>
                        Urgent Action
                      </Typography>
                      <Typography sx={{ fontSize: "0.74rem", letterSpacing: 1.2, textTransform: "uppercase", color: "#42536D" }}>
                        Requires 24h approval
                      </Typography>
                    </Box>
                  </Stack>
                  <Switch checked={urgent} onChange={(event) => setUrgent(event.target.checked)} />
                </Box>
              </Box>

              <Box>
                <ButtonBase
                  component="label"
                  htmlFor={uploadId}
                  sx={{
                    width: "100%",
                    px: 3,
                    py: 5,
                    borderRadius: 5,
                    border: "2px dashed rgba(191,201,196,0.4)",
                    backgroundColor: "#FFFFFF"
                  }}
                >
                  <Stack spacing={1.4} alignItems="center" textAlign="center">
                    <CloudUploadRoundedIcon sx={{ fontSize: 40, color: "#BFC9C4" }} />
                    <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: "#071E27" }}>
                      Drag & drop blueprints or quotes
                    </Typography>
                    <Typography sx={{ fontSize: "0.92rem", color: "#707975" }}>
                      Supported formats: PDF, DWG, JPG up to 25MB
                    </Typography>
                    {files.length > 0 ? (
                      <Typography sx={{ fontSize: "0.86rem", color: "#046B5E", fontWeight: 700 }}>
                        {files.map((file) => file.name).join(", ")}
                      </Typography>
                    ) : null}
                  </Stack>
                </ButtonBase>
                <Box
                  component="input"
                  id={uploadId}
                  type="file"
                  multiple
                  sx={{ display: "none" }}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setFiles(Array.from(event.target.files ?? []));
                  }}
                />
              </Box>

              {error ? (
                <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, color: "#872000" }}>{error}</Typography>
              ) : null}
            </Stack>
          </Box>

          <Box
            sx={{
              px: { xs: 3, md: 5 },
              py: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
              backgroundColor: "#E6F6FF"
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <InfoOutlinedIcon sx={{ color: "#42536D", fontSize: 18 }} />
              <Typography sx={{ fontSize: "0.9rem", color: "#42536D" }}>
                Assigned to: <strong>Marcus Chen (Senior Engineer)</strong>
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ width: { xs: "100%", md: "auto" } }}>
              <Button
                type="button"
                variant="outlined"
                onClick={onClose}
                sx={{
                  minWidth: 154,
                  py: 1.5,
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
                  minWidth: 240,
                  py: 1.5,
                  borderRadius: 2.5,
                  fontSize: "1rem",
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)"
                }}
              >
                {submitting ? "Submitting..." : "Submit for Review"}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
