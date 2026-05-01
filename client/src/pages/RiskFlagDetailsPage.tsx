import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getProject, getProjectDocuments, getProjectRiskFlag, updateProjectRiskFlagStatus } from "../api/projects";
import { WorkspaceBreadcrumbs } from "../components/layout/WorkspaceBreadcrumbs";
import { WorkspaceFooter } from "../components/layout/WorkspaceFooter";
import { useFeedbackContext } from "../context/FeedbackContext";
import type { Project, ProjectDocument, ProjectRiskFlag } from "../types/project";
import { formatDateTime } from "../utils/formatDate";

function levelTone(level: string) {
  if (level === "high") {
    return { backgroundColor: "#FFD8CF", color: "#7A1E08" };
  }

  if (level === "medium") {
    return { backgroundColor: "#FFDBD1", color: "#872000" };
  }

  return { backgroundColor: "#EEF3F8", color: "#52637E" };
}

function statusTone(status: ProjectRiskFlag["status"]) {
  return {
    open: { backgroundColor: "#FFF6F1", color: "#872000", label: "Open" },
    reviewed: { backgroundColor: "#E6F6FF", color: "#046B5E", label: "Reviewed" },
    mitigated: { backgroundColor: "#9DEFDE", color: "#0F6F62", label: "Mitigated" }
  }[status];
}

export function RiskFlagDetailsPage() {
  const navigate = useNavigate();
  const { riskFlagId = "" } = useParams();
  const { showToast } = useFeedbackContext();
  const [riskFlag, setRiskFlag] = useState<ProjectRiskFlag | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<ProjectRiskFlag["status"] | null>(null);

  useEffect(() => {
    async function load() {
      if (!riskFlagId) {
        setError("Risk flag not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nextRiskFlag = await getProjectRiskFlag(riskFlagId);
        const [nextProject, nextDocuments] = await Promise.all([
          getProject(nextRiskFlag.projectId),
          getProjectDocuments(nextRiskFlag.projectId)
        ]);

        setRiskFlag(nextRiskFlag);
        setProject(nextProject);
        setDocuments(nextDocuments);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to load the risk flag.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [riskFlagId]);

  const linkedDocument = useMemo(
    () => documents.find((document) => document.id === riskFlag?.sourceDocumentId),
    [documents, riskFlag?.sourceDocumentId]
  );

  async function handleUpdateStatus(status: ProjectRiskFlag["status"]) {
    if (!riskFlag) {
      return;
    }

    setUpdatingStatus(status);

    try {
      const updatedRiskFlag = await updateProjectRiskFlagStatus(riskFlag.id, { status });
      setRiskFlag(updatedRiskFlag);
      showToast({
        message: `Risk flag marked ${status}.`,
        severity: "success"
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update the risk flag.");
    } finally {
      setUpdatingStatus(null);
    }
  }

  const riskLevelTone = riskFlag ? levelTone(riskFlag.level) : null;
  const riskStatusTone = riskFlag ? statusTone(riskFlag.status) : null;

  return (
    <Stack spacing={4.5}>
      <WorkspaceBreadcrumbs
        items={[
          project ? { label: project.name, to: `/app/projects/${project.id}` } : undefined,
          { label: riskFlag?.title ?? "Risk Flag Details" }
        ].filter(Boolean) as Array<{ label: string; to?: string }>}
      />

      {loading ? (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, backgroundColor: "#FFFFFF" }}>
          <Typography sx={{ fontSize: "1rem", color: "#5A6A84" }}>Loading risk flag details...</Typography>
        </Paper>
      ) : error || !riskFlag || !project ? (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, backgroundColor: "#FFF6F1" }}>
          <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "#872000" }}>
            {error ?? "Risk flag not found."}
          </Typography>
        </Paper>
      ) : (
        <>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 5,
              backgroundColor: "#FFFFFF",
              boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
            }}
          >
            <Stack spacing={2.4}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
                <Box>
                  <Stack direction="row" spacing={1.2} alignItems="center" useFlexGap flexWrap="wrap">
                    <WarningAmberRoundedIcon sx={{ color: "#7A1E08" }} />
                    <Typography
                      sx={{
                        fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                        fontSize: { xs: "2.2rem", md: "3.2rem" },
                        fontWeight: 900,
                        letterSpacing: -1.8,
                        color: "#00342B"
                      }}
                    >
                      {riskFlag.title}
                    </Typography>
                  </Stack>
                  <Typography sx={{ mt: 1.2, maxWidth: 860, fontSize: "1.04rem", lineHeight: 1.75, color: "#4C5D78" }}>
                    {riskFlag.description}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {riskLevelTone ? (
                    <Box sx={{ px: 1.4, py: 0.9, borderRadius: 2.2, backgroundColor: riskLevelTone.backgroundColor }}>
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 900, letterSpacing: 1.1, textTransform: "uppercase", color: riskLevelTone.color }}>
                        {riskFlag.level}
                      </Typography>
                    </Box>
                  ) : null}
                  {riskStatusTone ? (
                    <Box sx={{ px: 1.4, py: 0.9, borderRadius: 2.2, backgroundColor: riskStatusTone.backgroundColor }}>
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 900, letterSpacing: 1.1, textTransform: "uppercase", color: riskStatusTone.color }}>
                        {riskStatusTone.label}
                      </Typography>
                    </Box>
                  ) : null}
                </Stack>
              </Stack>

              <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap">
                {riskFlag.status !== "reviewed" ? (
                  <ButtonBase
                    disabled={updatingStatus === "reviewed"}
                    onClick={() => void handleUpdateStatus("reviewed")}
                    sx={{ px: 1.8, py: 0.95, borderRadius: 2.4, backgroundColor: "#FFDBD1", color: "#872000" }}
                  >
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 800 }}>Mark Reviewed</Typography>
                  </ButtonBase>
                ) : null}
                {riskFlag.status !== "mitigated" ? (
                  <ButtonBase
                    disabled={updatingStatus === "mitigated"}
                    onClick={() => void handleUpdateStatus("mitigated")}
                    sx={{ px: 1.8, py: 0.95, borderRadius: 2.4, backgroundColor: "#9DEFDE", color: "#0F6F62" }}
                  >
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 800 }}>Mark Mitigated</Typography>
                  </ButtonBase>
                ) : null}
                <ButtonBase
                  onClick={() => navigate(`/app/projects/${project.id}`)}
                  sx={{ px: 1.6, py: 0.95, borderRadius: 2.4, color: "#046B5E" }}
                >
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 800 }}>Open Project</Typography>
                </ButtonBase>
              </Stack>
            </Stack>
          </Paper>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) minmax(320px, 0.78fr)" },
              gap: 3
            }}
          >
            <Paper elevation={0} sx={{ p: 3.2, borderRadius: 4, backgroundColor: "#FFFFFF", boxShadow: "0 12px 32px rgba(7,30,39,0.04)" }}>
              <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: "#00342B" }}>Risk Context</Typography>
              <Stack spacing={1.2} sx={{ mt: 2.2 }}>
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "#93A6C3" }}>
                  Project
                </Typography>
                <Typography sx={{ fontSize: "1rem", color: "#00342B", fontWeight: 700 }}>{project.name}</Typography>
                <Typography sx={{ fontSize: "0.96rem", color: "#5A6A84" }}>
                  {project.code} • {project.location}
                </Typography>
              </Stack>

              <Stack spacing={1.2} sx={{ mt: 2.6 }}>
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "#93A6C3" }}>
                  Origin
                </Typography>
                <Typography sx={{ fontSize: "1rem", color: "#00342B", fontWeight: 700 }}>
                  {riskFlag.createdByAgent ? "Agent-generated risk signal" : "Manual risk flag"}
                </Typography>
                <Typography sx={{ fontSize: "0.96rem", color: "#5A6A84" }}>
                  Created {formatDateTime(riskFlag.createdAt)} • Updated {formatDateTime(riskFlag.updatedAt)}
                </Typography>
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: 3.2, borderRadius: 4, backgroundColor: "#FFF6F1", boxShadow: "0 12px 32px rgba(7,30,39,0.04)" }}>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <DescriptionRoundedIcon sx={{ color: "#7A1E08" }} />
                <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: "#00342B" }}>Linked Evidence</Typography>
              </Stack>

              {linkedDocument ? (
                <Paper elevation={0} sx={{ mt: 2.2, p: 2.2, borderRadius: 3, backgroundColor: "#FFFFFF", border: "1px solid rgba(255,219,209,0.95)" }}>
                  <Typography sx={{ fontSize: "0.98rem", fontWeight: 800, color: "#00342B" }}>{linkedDocument.title}</Typography>
                  <Typography sx={{ mt: 0.7, fontSize: "0.9rem", lineHeight: 1.6, color: "#6B412C" }}>
                    {linkedDocument.aiSummary || linkedDocument.summary || "Document summary unavailable."}
                  </Typography>
                  <ButtonBase
                    onClick={() => navigate(`/app/projects/${project.id}`)}
                    sx={{ mt: 1.2, color: "#872000", display: "inline-flex", alignItems: "center", gap: 0.6 }}
                  >
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 800 }}>Open Project Document Vault</Typography>
                    <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
                  </ButtonBase>
                </Paper>
              ) : (
                <Typography sx={{ mt: 2.2, fontSize: "0.95rem", color: "#6B412C" }}>
                  This risk flag is not linked to a specific source document.
                </Typography>
              )}
            </Paper>
          </Box>
        </>
      )}

      <WorkspaceFooter />
    </Stack>
  );
}
