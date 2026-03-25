import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { importChangeOrders } from "../../api/changeOrders";
import type { Project } from "../../types/project";
import { formatCurrency } from "../../utils/formatCurrency";
import { Button } from "../common/Button";

interface PreviewRow {
  projectId: string;
  projectCode: string;
  title: string;
  description: string;
  amount: number;
  requestedBy: string;
}

interface ImportChangeOrdersModalProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  onImported?: (count: number) => Promise<void> | void;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let value = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === "\"") {
      if (inQuotes && nextCharacter === "\"") {
        value += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      currentRow.push(value.trim());
      value = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      currentRow.push(value.trim());
      value = "";

      if (currentRow.some((item) => item.length > 0)) {
        rows.push(currentRow);
      }

      currentRow = [];
      continue;
    }

    value += character;
  }

  currentRow.push(value.trim());
  if (currentRow.some((item) => item.length > 0)) {
    rows.push(currentRow);
  }

  return rows;
}

export function ImportChangeOrdersModal({
  open,
  onClose,
  projects,
  onImported
}: ImportChangeOrdersModalProps) {
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [fileName, setFileName] = useState("");

  const projectLookup = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.code.toLowerCase(), project.id])),
    [projects]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setPreviewRows([]);
    setErrors([]);
    setFileName("");
  }, [open]);

  function downloadTemplate() {
    const csv = [
      ["projectCode", "title", "description", "amount", "requestedBy"],
      ["CF-SR-2024", "Curtain Wall Revision", "Owner-directed revision to the tower facade detailing.", "16500", "Sarah Mitchell"],
      ["H26-TOWER", "Electrical Reroute", "Routing update for revised podium service entry layout.", "8400", "Marcus Chen"]
    ]
      .map((row) => row.map((value) => `"${value}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "changeflow-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);

    file
      .text()
      .then((text) => {
        const rows = parseCsv(text);
        const [headerRow, ...dataRows] = rows;

        if (!headerRow) {
          setErrors(["The CSV file is empty."]);
          setPreviewRows([]);
          return;
        }

        const headerLookup = Object.fromEntries(headerRow.map((column, index) => [column.trim().toLowerCase(), index]));
        const nextErrors: string[] = [];
        const nextRows: PreviewRow[] = [];

        dataRows.forEach((row, index) => {
          const projectCode = row[headerLookup.projectcode] ?? "";
          const title = row[headerLookup.title] ?? "";
          const description = row[headerLookup.description] ?? "";
          const amountValue = Number(row[headerLookup.amount] ?? "");
          const requestedBy = row[headerLookup.requestedby] ?? "Demo User";
          const projectId = projectLookup[projectCode.toLowerCase()];

          if (!projectId) {
            nextErrors.push(`Row ${index + 2}: project code "${projectCode}" does not match a local project.`);
            return;
          }

          if (title.trim().length < 2 || description.trim().length < 10 || !Number.isFinite(amountValue) || amountValue <= 0) {
            nextErrors.push(`Row ${index + 2}: include a title, detailed description, and positive amount.`);
            return;
          }

          nextRows.push({
            projectId,
            projectCode,
            title: title.trim(),
            description: description.trim(),
            amount: amountValue,
            requestedBy: requestedBy.trim() || "Demo User"
          });
        });

        setErrors(nextErrors);
        setPreviewRows(nextRows);
      })
      .catch(() => {
        setErrors(["Unable to read that CSV file."]);
        setPreviewRows([]);
      });
  }

  async function handleImport() {
    if (previewRows.length === 0) {
      setErrors((current) => (current.length > 0 ? current : ["Upload a valid CSV file first."]));
      return;
    }

    setSubmitting(true);

    try {
      await importChangeOrders(
        previewRows.map((row) => ({
          projectId: row.projectId,
          title: row.title,
          description: row.description,
          amount: row.amount,
          requestedBy: row.requestedBy
        }))
      );
      await onImported?.(previewRows.length);
      onClose();
    } catch (requestError) {
      setErrors([requestError instanceof Error ? requestError.message : "Unable to import change orders."]);
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
          sx={{
            width: "100%",
            maxWidth: 920,
            borderRadius: 6,
            backgroundColor: "#FFFFFF",
            boxShadow: "0 32px 64px rgba(7,30,39,0.18)",
            overflow: "hidden"
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
                Import Change Orders
              </Typography>
              <Typography sx={{ mt: 1, fontSize: "1rem", color: "#42536D" }}>
                Upload a CSV with `projectCode`, `title`, `description`, `amount`, and `requestedBy`.
              </Typography>
            </Box>
            <IconButton onClick={onClose} sx={{ color: "#707975" }}>
              <CloseRoundedIcon sx={{ fontSize: 32 }} />
            </IconButton>
          </Box>

          <Stack spacing={3} sx={{ px: { xs: 3, md: 5 }, py: 4 }}>
            <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
              <Button
                component="label"
                startIcon={<FileUploadRoundedIcon />}
                sx={{
                  px: 3,
                  py: 1.35,
                  borderRadius: 2.5,
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)"
                }}
              >
                Upload CSV
                <input hidden type="file" accept=".csv,text/csv" onChange={handleFileChange} />
              </Button>

              <Button
                variant="outlined"
                startIcon={<DownloadRoundedIcon />}
                onClick={downloadTemplate}
                sx={{
                  px: 3,
                  py: 1.35,
                  borderRadius: 2.5,
                  borderColor: "rgba(0,52,43,0.12)",
                  color: "#00342B",
                  backgroundColor: "#FFFFFF"
                }}
              >
                Download Template
              </Button>
            </Stack>

            {fileName ? (
              <Typography sx={{ fontSize: "0.95rem", color: "#5A6A84" }}>Loaded file: {fileName}</Typography>
            ) : null}

            {errors.length > 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 2.4,
                  borderRadius: 3,
                  backgroundColor: "#FFDBD1"
                }}
              >
                <Stack spacing={0.8}>
                  {errors.map((error) => (
                    <Typography key={error} sx={{ fontSize: "0.92rem", fontWeight: 700, color: "#872000" }}>
                      {error}
                    </Typography>
                  ))}
                </Stack>
              </Paper>
            ) : null}

            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 720 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.4fr 1.8fr 0.8fr 1fr",
                    gap: 2,
                    px: 2.5,
                    py: 1.8,
                    borderBottom: "1px solid rgba(213,236,248,0.9)"
                  }}
                >
                  {["Project", "Title", "Description", "Amount", "Requested By"].map((label) => (
                    <Typography
                      key={label}
                      sx={{
                        fontSize: "0.78rem",
                        fontWeight: 900,
                        letterSpacing: 1.6,
                        textTransform: "uppercase",
                        color: "#93A6C3"
                      }}
                    >
                      {label}
                    </Typography>
                  ))}
                </Box>

                {previewRows.map((row) => (
                  <Box
                    key={`${row.projectCode}-${row.title}-${row.amount}`}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1.4fr 1.8fr 0.8fr 1fr",
                      gap: 2,
                      px: 2.5,
                      py: 2.2,
                      borderBottom: "1px solid rgba(213,236,248,0.66)"
                    }}
                  >
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#00342B" }}>{row.projectCode}</Typography>
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#00342B" }}>{row.title}</Typography>
                    <Typography sx={{ fontSize: "0.92rem", lineHeight: 1.55, color: "#5A6A84" }}>{row.description}</Typography>
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: "#00342B" }}>{formatCurrency(row.amount)}</Typography>
                    <Typography sx={{ fontSize: "0.92rem", color: "#42536D" }}>{row.requestedBy}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Stack>

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
            <Typography sx={{ fontSize: "0.95rem", color: "#42536D" }}>
              {previewRows.length} row{previewRows.length === 1 ? "" : "s"} ready to import.
            </Typography>
            <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
              <Button
                type="button"
                variant="outlined"
                onClick={onClose}
                sx={{
                  minWidth: 140,
                  py: 1.35,
                  borderRadius: 2.5,
                  borderColor: "rgba(0,52,43,0.12)",
                  color: "#00342B",
                  backgroundColor: "#FFFFFF"
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={submitting || previewRows.length === 0}
                sx={{
                  minWidth: 200,
                  py: 1.35,
                  borderRadius: 2.5,
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)"
                }}
              >
                {submitting ? "Importing..." : "Import to Pipeline"}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
