import { useEffect, useId, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import DrawRoundedIcon from "@mui/icons-material/DrawRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Modal from "@mui/material/Modal";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  createProjectDocument,
  createProjectDocumentUploadIntent,
  deleteProjectDocument,
  getProjectDocumentDownloadUrl
} from "../../api/projects";
import type { Project, ProjectDocument, ProjectTeamMember } from "../../types/project";
import { formatDate } from "../../utils/formatDate";
import { Button } from "../common/Button";
import { EditProjectDocumentModal } from "./EditProjectDocumentModal";

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

function titleFromFileName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getUploadErrorMessage(fileName: string, error: unknown) {
  if (error instanceof TypeError) {
    return `The browser could not upload ${fileName}. Check your S3 bucket CORS settings for http://localhost:5173.`;
  }

  return error instanceof Error ? error.message : `Unable to upload ${fileName} to storage.`;
}

function kindIcon(kind: string) {
  const normalized = kind.toLowerCase();

  if (normalized.includes("drawing")) {
    return <DrawRoundedIcon sx={{ color: "#7A1E08" }} />;
  }

  if (normalized.includes("quote")) {
    return <ReceiptLongRoundedIcon sx={{ color: "#046B5E" }} />;
  }

  if (normalized.includes("pdf")) {
    return <DescriptionRoundedIcon sx={{ color: "#046B5E" }} />;
  }

  return <InsertDriveFileRoundedIcon sx={{ color: "#5A6A84" }} />;
}

interface ProjectDocumentVaultModalProps {
  open: boolean;
  project: Project;
  documents: ProjectDocument[];
  teamMembers: ProjectTeamMember[];
  onClose: () => void;
  onCreated?: () => Promise<void> | void;
  canEdit?: boolean;
}

export function ProjectDocumentVaultModal({
  open,
  project,
  documents,
  teamMembers,
  onClose,
  onCreated,
  canEdit = false
}: ProjectDocumentVaultModalProps) {
  const uploadId = useId();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<string>("PDF");
  const [summary, setSummary] = useState("");
  const [assignedTo, setAssignedTo] = useState(AUTO_ASSIGN_OPTION);
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
  const [editingDocument, setEditingDocument] = useState<ProjectDocument | null>(null);
  const [error, setError] = useState("");

  const assigneeOptions = Array.from(
    new Set(
      teamMembers
        .map((member) => member.name.trim())
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right));

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle("");
    setKind("PDF");
    setSummary("");
    setAssignedTo(AUTO_ASSIGN_OPTION);
    setUrl("");
    setFile(null);
    setError("");
  }, [open]);

  function formatFileSize(fileSize?: number) {
    if (!fileSize) {
      return null;
    }

    if (fileSize >= 1024 * 1024) {
      return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${Math.max(1, Math.round(fileSize / 1024))} KB`;
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;

    setFile(nextFile);
    setError("");

    if (nextFile) {
      if (!title.trim()) {
        setTitle(titleFromFileName(nextFile.name));
      }

      if (!summary.trim()) {
        setSummary(`Uploaded document ${nextFile.name} for ${project.name}.`);
      }

      setUrl("");
    }
  }

  async function handleOpenDocument(document: ProjectDocument) {
    setOpeningDocumentId(document.id);

    try {
      const response = await getProjectDocumentDownloadUrl(project.id, document.id);
      window.open(response.url, "_blank", "noopener,noreferrer");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to open document.");
    } finally {
      setOpeningDocumentId(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedSummary = summary.trim();

    if (trimmedTitle.length < 2) {
      setError("Add a document title with at least 2 characters.");
      return;
    }

    if (trimmedSummary.length < 6) {
      setError("Add a short summary with at least 6 characters.");
      return;
    }

    if (!file && !url.trim()) {
      setError("Attach a file or provide a link before adding this document.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      let nextStorageKey: string | undefined;
      let nextFileName: string | undefined;
      let nextContentType: string | undefined;
      let nextFileSize: number | undefined;

      if (file) {
        const uploadIntent = await createProjectDocumentUploadIntent(project.id, {
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

        nextStorageKey = uploadIntent.storageKey;
        nextFileName = uploadIntent.fileName;
        nextContentType = uploadIntent.contentType;
        nextFileSize = uploadIntent.fileSize;
      }

      await createProjectDocument(project.id, {
        title: trimmedTitle,
        kind,
        summary: trimmedSummary,
        assignedTo: assignedTo === AUTO_ASSIGN_OPTION ? undefined : assignedTo,
        url: file ? undefined : url.trim() || undefined,
        storageKey: nextStorageKey,
        fileName: nextFileName,
        contentType: nextContentType,
        fileSize: nextFileSize
      });
      await onCreated?.();
      setTitle("");
      setKind("PDF");
      setSummary("");
      setAssignedTo(AUTO_ASSIGN_OPTION);
      setUrl("");
      setFile(null);
    } catch (requestError) {
      setError(file ? getUploadErrorMessage(file.name, requestError) : requestError instanceof Error ? requestError.message : "Unable to add document.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteDocument(document: ProjectDocument) {
    const confirmed = window.confirm(`Remove "${document.title}" from the vault?`);

    if (!confirmed) {
      return;
    }

    setDeletingDocumentId(document.id);
    setError("");

    try {
      await deleteProjectDocument(project.id, document.id);
      await onCreated?.();

      if (editingDocument?.id === document.id) {
        setEditingDocument(null);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to remove document.");
    } finally {
      setDeletingDocumentId(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} sx={{ zIndex: 1400 }}>
      <>
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
          sx={{
            width: "100%",
            maxWidth: 980,
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
                Document Vault
              </Typography>
              <Typography sx={{ mt: 1, fontSize: "1rem", color: "#42536D" }}>
                Browse and add project records for {project.name}.
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
              maxHeight: "calc(92vh - 110px)",
              overflowY: "auto",
              display: "grid",
              gridTemplateColumns: canEdit ? { xs: "1fr", lg: "minmax(0, 1.15fr) 320px" } : "1fr",
              gap: 3
            }}
          >
            <Stack spacing={2}>
              {documents.length > 0 ? (
                documents.map((document) => (
                  <Paper
                    key={document.id}
                    elevation={0}
                    sx={{
                      p: 2.6,
                      borderRadius: 3.5,
                      border: "1px solid rgba(213,236,248,0.92)",
                      backgroundColor: "#FFFFFF"
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 2.5,
                          display: "grid",
                          placeItems: "center",
                          backgroundColor: "#E6F6FF",
                          flexShrink: 0
                        }}
                      >
                        {kindIcon(document.kind)}
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          gap={2}
                          useFlexGap
                          flexWrap="wrap"
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontSize: "1rem",
                                fontWeight: 800,
                                color: "#00342B",
                                wordBreak: "break-word"
                              }}
                            >
                              {document.title}
                            </Typography>
                            <Typography
                              sx={{
                                mt: 0.5,
                                fontSize: "0.76rem",
                                fontWeight: 800,
                                letterSpacing: 1.6,
                                textTransform: "uppercase",
                                color: "#93A6C3"
                              }}
                            >
                              {document.kind} • Updated {formatDate(document.updatedAt)}
                            </Typography>
                            <Typography
                              sx={{
                                mt: 0.65,
                                fontSize: "0.82rem",
                                fontWeight: 700,
                                color: document.assignedTo ? "#046B5E" : "#7A869F"
                              }}
                            >
                              {document.assignedTo ? `Assigned to ${document.assignedTo}` : "Auto-assignment pending"}
                            </Typography>
                            <Typography
                              sx={{
                                mt: 0.45,
                                fontSize: "0.72rem",
                                fontWeight: 900,
                                letterSpacing: 1.3,
                                textTransform: "uppercase",
                                color:
                                  document.agentStatus === "completed"
                                    ? "#046B5E"
                                    : document.agentStatus === "failed"
                                      ? "#872000"
                                      : "#7A869F"
                              }}
                            >
                              Agent {document.agentStatus}
                              {document.lastProcessedAt ? ` • ${formatDate(document.lastProcessedAt)}` : ""}
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                            {document.url || document.storageKey ? (
                              <ButtonBase
                                onClick={() => handleOpenDocument(document)}
                                sx={{
                                  px: 2,
                                  py: 1,
                                  borderRadius: 2.5,
                                  backgroundColor: "#E6F6FF",
                                  color: "#00342B"
                                }}
                              >
                                <Stack direction="row" spacing={0.8} alignItems="center">
                                  <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
                                  <Typography sx={{ fontSize: "0.86rem", fontWeight: 800 }}>
                                    {openingDocumentId === document.id ? "Opening..." : "Open"}
                                  </Typography>
                                </Stack>
                              </ButtonBase>
                            ) : null}
                            {canEdit ? (
                              <ButtonBase
                                onClick={() => setEditingDocument(document)}
                                sx={{
                                  px: 2,
                                  py: 1,
                                  borderRadius: 2.5,
                                  backgroundColor: "#F3FAFF",
                                  color: "#046B5E"
                                }}
                              >
                                <Stack direction="row" spacing={0.8} alignItems="center">
                                  <EditRoundedIcon sx={{ fontSize: 18 }} />
                                  <Typography sx={{ fontSize: "0.86rem", fontWeight: 800 }}>
                                    Edit
                                  </Typography>
                                </Stack>
                              </ButtonBase>
                            ) : null}
                            {canEdit ? (
                              <ButtonBase
                                onClick={() => handleDeleteDocument(document)}
                                disabled={deletingDocumentId === document.id}
                                sx={{
                                  px: 2,
                                  py: 1,
                                  borderRadius: 2.5,
                                  backgroundColor: "#FFF1EE",
                                  color: "#872000",
                                  opacity: deletingDocumentId === document.id ? 0.6 : 1
                                }}
                              >
                                <Stack direction="row" spacing={0.8} alignItems="center">
                                  <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                                  <Typography sx={{ fontSize: "0.86rem", fontWeight: 800 }}>
                                    {deletingDocumentId === document.id ? "Removing..." : "Remove"}
                                  </Typography>
                                </Stack>
                              </ButtonBase>
                            ) : null}
                          </Stack>
                        </Stack>
                        <Typography sx={{ mt: 1.4, fontSize: "0.98rem", lineHeight: 1.65, color: "#5A6A84" }}>
                          {document.summary}
                        </Typography>
                        {document.aiSummary && document.aiSummary !== document.summary ? (
                          <Typography sx={{ mt: 1, fontSize: "0.88rem", lineHeight: 1.65, color: "#42536D" }}>
                            AI brief: {document.aiSummary}
                          </Typography>
                        ) : null}
                        {document.processingError ? (
                          <Typography sx={{ mt: 1, fontSize: "0.82rem", fontWeight: 700, color: "#872000" }}>
                            Agent note: {document.processingError}
                          </Typography>
                        ) : null}
                        {document.fileName || document.fileSize ? (
                          <Typography sx={{ mt: 1, fontSize: "0.82rem", fontWeight: 700, color: "#7A869F" }}>
                            {[document.fileName, formatFileSize(document.fileSize)].filter(Boolean).join(" • ")}
                          </Typography>
                        ) : null}
                      </Box>
                    </Stack>
                  </Paper>
                ))
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 3.5,
                    backgroundColor: "#E6F6FF",
                    color: "#42536D"
                  }}
                >
                  <Typography sx={{ fontSize: "1rem", fontWeight: 700 }}>
                    No documents are attached to this project yet.
                  </Typography>
                </Paper>
              )}
            </Stack>

            {canEdit ? (
              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  backgroundColor: "#E6F6FF",
                  height: "fit-content"
                }}
              >
              <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 3 }}>
                <AddRoundedIcon sx={{ color: "#046B5E" }} />
                <Typography
                  sx={{
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: "1.6rem",
                    fontWeight: 800,
                    letterSpacing: -1,
                    color: "#00342B"
                  }}
                >
                  Add Document
                </Typography>
              </Stack>

              <Stack spacing={2.4}>
                <TextField
                  fullWidth
                  label="Title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g., Mechanical Coordination Memo"
                  sx={fieldStyles}
                />
                <TextField select fullWidth label="Type" value={kind} onChange={(event) => setKind(event.target.value)} sx={fieldStyles}>
                  {kindOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder="Briefly describe what this document covers."
                  sx={fieldStyles}
                />
                <TextField
                  select
                  fullWidth
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
                    ? "Choose a teammate now, or let ChangeFlow route the document automatically from its title, type, and summary."
                    : "Manual assignment unlocks once project team members are added. Until then, ChangeFlow will keep the document unassigned."}
                </Typography>
                <TextField
                  fullWidth
                  label="Optional Link"
                  value={url}
                  onChange={(event) => {
                    setUrl(event.target.value);

                    if (event.target.value) {
                      setFile(null);
                    }
                  }}
                  disabled={Boolean(file)}
                  placeholder="https://example.com/document"
                  InputProps={{
                    startAdornment: <LinkRoundedIcon sx={{ mr: 1, color: "#7A869F" }} />
                  }}
                  sx={fieldStyles}
                />
                <Box>
                  <input
                    id={uploadId}
                    type="file"
                    hidden
                    onChange={handleFileChange}
                    accept=".pdf,.txt,.md,.csv,.json,.xml,.log,.dwg,.dxf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx,.zip"
                  />
                  <ButtonBase
                    component="label"
                    htmlFor={uploadId}
                    sx={{
                      width: "100%",
                      p: 2.1,
                      borderRadius: 3,
                      border: "1px dashed rgba(4,107,94,0.24)",
                      backgroundColor: "#FFFFFF",
                      justifyContent: "flex-start"
                    }}
                  >
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <CloudUploadRoundedIcon sx={{ color: "#046B5E" }} />
                      <Box sx={{ textAlign: "left" }}>
                        <Typography sx={{ fontSize: "0.96rem", fontWeight: 800, color: "#00342B" }}>
                          {file ? "Replace selected file" : "Upload from your computer"}
                        </Typography>
                        <Typography sx={{ mt: 0.35, fontSize: "0.84rem", color: "#5A6A84" }}>
                          PDF, DWG, images, Office files, or ZIP up to 25 MB
                        </Typography>
                      </Box>
                    </Stack>
                  </ButtonBase>
                </Box>
                {file ? (
                  <Typography sx={{ fontSize: "0.86rem", fontWeight: 700, color: "#046B5E" }}>
                    Selected file: {file.name} • {formatFileSize(file.size)}
                  </Typography>
                ) : null}

                {error ? <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, color: "#872000" }}>{error}</Typography> : null}

                <Button
                  type="submit"
                  disabled={submitting}
                  sx={{
                    py: 1.35,
                    borderRadius: 2.5,
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)"
                  }}
                >
                  {submitting ? "Saving..." : "Add to Vault"}
                </Button>
              </Stack>
              </Box>
            ) : null}
          </Box>
        </Box>
      </Box>
      {editingDocument ? (
        <EditProjectDocumentModal
          open={Boolean(editingDocument)}
          projectId={project.id}
          document={editingDocument}
          teamMembers={teamMembers}
          onClose={() => setEditingDocument(null)}
          onSaved={async () => {
            await onCreated?.();
            setEditingDocument(null);
          }}
        />
      ) : null}
      </>
    </Modal>
  );
}
