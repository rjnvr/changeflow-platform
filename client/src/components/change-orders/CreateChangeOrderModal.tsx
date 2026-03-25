import { useEffect, useId, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { createChangeOrder, createChangeOrderAttachmentUploadIntent } from "../../api/changeOrders";
import { useProjectTeamMembers } from "../../hooks/useProjectTeamMembers";
import { Button } from "../common/Button";
import type { ChangeOrder } from "../../types/changeOrder";
import type { Project } from "../../types/project";

interface CreateChangeOrderModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (createdChangeOrder: ChangeOrder) => Promise<void> | void;
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

function formatFileSize(fileSize: number) {
  if (fileSize >= 1024 * 1024) {
    return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(fileSize / 1024))} KB`;
}

function getUploadErrorMessage(fileName: string, error: unknown) {
  if (error instanceof TypeError) {
    return `The browser could not upload ${fileName}. Check your S3 bucket CORS settings for http://localhost:5173.`;
  }

  return error instanceof Error ? error.message : `Unable to upload ${fileName} to storage.`;
}

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
  const [assignedTo, setAssignedTo] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { teamMembers, loading: loadingTeamMembers } = useProjectTeamMembers(projectId);

  useEffect(() => {
    if (!open) {
      return;
    }

    setProjectId(defaultProjectId ?? "");
    setTitle("");
    setDescription("");
    setAmount("");
    setAssignedTo("");
    setUrgent(false);
    setFiles([]);
    setError("");
  }, [defaultProjectId, open]);

  useEffect(() => {
    if (!open || projectId) {
      return;
    }

    const nextProjectId = defaultProjectId ?? projects[0]?.id ?? "";

    if (nextProjectId) {
      setProjectId(nextProjectId);
    }
  }, [defaultProjectId, open, projectId, projects]);

  useEffect(() => {
    if (!open || teamMembers.length === 0) {
      return;
    }

    const hasSelectedMember = teamMembers.some((member) => member.name === assignedTo);

    if (!hasSelectedMember) {
      setAssignedTo(teamMembers[0]?.name ?? "");
    }
  }, [assignedTo, open, teamMembers]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (
      !projectId ||
      assignedTo.trim().length < 2 ||
      title.trim().length < 2 ||
      description.trim().length < 10 ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError("Add a project, assignee, title, description, and a positive estimated value.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const uploadedAttachments =
        files.length > 0
          ? await Promise.all(
              files.map(async (file) => {
                const uploadIntent = await createChangeOrderAttachmentUploadIntent({
                  projectId,
                  fileName: file.name,
                  contentType: file.type || undefined,
                  fileSize: file.size
                });

                const uploadResponse = await fetch(uploadIntent.uploadUrl, {
                  method: "PUT",
                  headers: {
                    "Content-Type": uploadIntent.contentType
                  },
                  body: file
                });

                if (!uploadResponse.ok) {
                  const uploadErrorBody = await uploadResponse.text();
                  const normalizedErrorBody = uploadErrorBody.replace(/\s+/g, " ").trim();
                  throw new Error(
                    `Unable to upload ${file.name} to storage (status ${uploadResponse.status}). ${
                      normalizedErrorBody || "S3 rejected the upload request."
                    }`
                  );
                }

                return {
                  title: file.name.replace(/\.[^/.]+$/, "") || file.name,
                  storageKey: uploadIntent.storageKey,
                  fileName: uploadIntent.fileName,
                  contentType: uploadIntent.contentType,
                  fileSize: uploadIntent.fileSize
                };
              })
            )
          : [];

      const createdChangeOrder = await createChangeOrder({
        projectId,
        title: urgent ? `${title.trim()} [Urgent]` : title.trim(),
        description: description.trim(),
        amount: numericAmount,
        requestedBy: "Demo User",
        assignedTo: assignedTo.trim(),
        attachments: uploadedAttachments
      });

      await onCreated?.(createdChangeOrder);
      onClose();
    } catch (requestError) {
      const firstFileName = files[0]?.name;
      setError(
        firstFileName
          ? getUploadErrorMessage(firstFileName, requestError)
          : requestError instanceof Error
            ? requestError.message
            : "Unable to create change order."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={false}
      sx={{
        zIndex: 1400,
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0,52,43,0.16)",
          backdropFilter: "blur(8px)"
        },
        "& .MuiDialog-paper": {
          width: "100%",
          maxWidth: 840,
          maxHeight: "92vh",
          m: { xs: 2, md: 4 },
          display: "flex",
          flexDirection: "column",
          borderRadius: 6,
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 32px 64px rgba(7,30,39,0.18)"
        }
      }}
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
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

          <Box
            sx={{
              px: { xs: 3, md: 5 },
              py: 4,
              flex: 1,
              minHeight: 0,
              overflowY: "auto"
            }}
          >
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
                    SelectProps={{
                      native: true
                    }}
                    sx={fieldStyles}
                  >
                    <option value="" disabled>
                      Select a project
                    </option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} - {project.code}
                      </option>
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
                    autoFocus
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
                  Assign To
                </Typography>
                {teamMembers.length > 0 ? (
                  <TextField
                    select
                    fullWidth
                    value={assignedTo}
                    onChange={(event) => setAssignedTo(event.target.value)}
                    SelectProps={{
                      native: true
                    }}
                    helperText={
                      loadingTeamMembers
                        ? "Loading project roster..."
                        : "Choose a team member from the selected project's on-site roster."
                    }
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
                    value={assignedTo}
                    onChange={(event) => setAssignedTo(event.target.value)}
                    placeholder={loadingTeamMembers ? "Loading team roster..." : "e.g., Marcus Chen"}
                    helperText="This project has no saved team roster yet, so you can type an assignee manually."
                    sx={fieldStyles}
                  />
                )}
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
                      Supported formats: PDF, DWG, JPG, PNG, XLSX, DOCX, ZIP up to 25MB each
                    </Typography>
                    {files.length > 0 ? (
                      <Stack spacing={0.8} sx={{ width: "100%", maxWidth: 460 }}>
                        {files.map((file) => (
                          <Stack
                            key={`${file.name}-${file.size}`}
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            justifyContent="center"
                            useFlexGap
                            flexWrap="wrap"
                          >
                            <InsertDriveFileRoundedIcon sx={{ fontSize: 18, color: "#046B5E" }} />
                            <Typography sx={{ fontSize: "0.86rem", color: "#046B5E", fontWeight: 700 }}>
                              {file.name}
                            </Typography>
                            <Typography sx={{ fontSize: "0.78rem", color: "#7A869F" }}>
                              {formatFileSize(file.size)}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    ) : null}
                  </Stack>
                </ButtonBase>
                <Box
                  component="input"
                  id={uploadId}
                  type="file"
                  multiple
                  sx={{ display: "none" }}
                  accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx,.zip"
                  onChange={handleFileChange}
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
              position: "sticky",
              bottom: 0,
              zIndex: 1,
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
                Assigned to: <strong>{assignedTo || "Select an assignee"}</strong>
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
    </Dialog>
  );
}
