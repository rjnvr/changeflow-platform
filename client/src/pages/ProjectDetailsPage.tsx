import { useEffect, useState } from "react";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import DrawRoundedIcon from "@mui/icons-material/DrawRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import SensorsRoundedIcon from "@mui/icons-material/SensorsRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useNavigate, useParams } from "react-router-dom";

import { archiveProject, deleteProjectTeamMember, generateProjectBrief, getProject } from "../api/projects";
import { WorkspaceBreadcrumbs } from "../components/layout/WorkspaceBreadcrumbs";
import { AddTeamMemberModal } from "../components/projects/AddTeamMemberModal";
import { EditProjectModal } from "../components/projects/EditProjectModal";
import { ProjectDocumentVaultModal } from "../components/projects/ProjectDocumentVaultModal";
import { useAuthContext } from "../context/AuthContext";
import { useFeedbackContext } from "../context/FeedbackContext";
import { useChangeOrders } from "../hooks/useChangeOrders";
import { useProjectDocuments } from "../hooks/useProjectDocuments";
import { useProjectTeamMembers } from "../hooks/useProjectTeamMembers";
import type { Project, ProjectAnalyticsBrief, ProjectTeamMember } from "../types/project";
import type { ChangeOrder } from "../types/changeOrder";
import { PROJECT_ANALYTICS_BRIEF_KEY } from "../utils/constants";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate, formatDateTime } from "../utils/formatDate";

interface RelatedChangeRow {
  id: string;
  title: string;
  impact: number;
  status: "pending" | "approved";
}

const fallbackChangeRows: RelatedChangeRow[] = [
  {
    id: "#442",
    title: "HVAC Spec Adjustment",
    impact: 12500,
    status: "pending"
  },
  {
    id: "#439",
    title: "Lobby Stone Upgrade",
    impact: 48000,
    status: "approved"
  },
  {
    id: "#435",
    title: "Glazing Reroute",
    impact: -2100,
    status: "approved"
  }
];

function FooterLinks() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        mt: 7,
        pt: 4.5,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 3,
        flexWrap: "wrap",
        borderTop: "1px solid rgba(213,236,248,0.9)",
        color: "rgba(90,106,132,0.86)"
      }}
    >
      <Typography sx={{ fontSize: "0.78rem", letterSpacing: 2.2, textTransform: "uppercase" }}>
        © 2024 ChangeFlow Intelligence. Built for the modern jobsite.
      </Typography>
      <Stack direction="row" spacing={3.5} useFlexGap flexWrap="wrap">
        {["Terms", "Privacy", "Trust & Security"].map((item) => (
          <Typography key={item} sx={{ fontSize: "0.78rem", letterSpacing: 2.2, textTransform: "uppercase" }}>
            {item}
          </Typography>
        ))}
        <ButtonBase onClick={() => navigate("/app/api-docs")} sx={{ color: "inherit" }}>
          <Typography sx={{ fontSize: "0.78rem", letterSpacing: 2.2, textTransform: "uppercase", fontWeight: 700 }}>
            API Docs
          </Typography>
        </ButtonBase>
      </Stack>
    </Box>
  );
}

function statusPresentation(status: Project["status"]) {
  if (status === "completed") {
    return { label: "Completed", backgroundColor: "#CFE6F2", color: "#3F4945" };
  }

  if (status === "on-hold") {
    return { label: "On Hold", backgroundColor: "#FFDBD1", color: "#872000" };
  }

  return { label: "On Track", backgroundColor: "#9DEFDE", color: "#0F6F62" };
}

function mapChangeOrder(changeOrder: ChangeOrder): RelatedChangeRow {
  return {
    id: `#${changeOrder.id.replace(/^co_/, "")}`,
    title: changeOrder.title,
    impact: changeOrder.amount,
    status: changeOrder.status === "approved" || changeOrder.status === "synced" ? "approved" : "pending"
  };
}

function teamMemberInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function teamMemberColor(name: string) {
  const palette = ["#D5ECF8", "#E6F6FF", "#DBF1FE", "#CFE6F2"];
  const hash = [...name].reduce((total, character) => total + character.charCodeAt(0), 0);
  return palette[hash % palette.length] ?? "#E6F6FF";
}

const fallbackTeamMembers: ProjectTeamMember[] = [
  {
    id: "fallback-1",
    projectId: "fallback",
    name: "James Sterling",
    role: "Site Lead",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "fallback-2",
    projectId: "fallback",
    name: "Anita Wong",
    role: "Architecture",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "fallback-3",
    projectId: "fallback",
    name: "Marcus Thorne",
    role: "Foreman",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function projectBriefStorageKey(projectId: string, userId?: string) {
  return `${PROJECT_ANALYTICS_BRIEF_KEY}.${userId ?? "guest"}.${projectId}`;
}

function readStoredProjectBrief(projectId: string, userId?: string) {
  try {
    const rawValue = localStorage.getItem(projectBriefStorageKey(projectId, userId));

    if (!rawValue) {
      return null;
    }

    const parsedBrief = JSON.parse(rawValue) as Partial<ProjectAnalyticsBrief>;

    if (
      !parsedBrief ||
      typeof parsedBrief.summary !== "string" ||
      !parsedBrief.usage ||
      typeof parsedBrief.usage.userLimit !== "number" ||
      typeof parsedBrief.usage.globalLimit !== "number" ||
      typeof parsedBrief.usage.dayEnd !== "string"
    ) {
      return null;
    }

    if (parsedBrief.usage.dayEnd && new Date(parsedBrief.usage.dayEnd).getTime() <= Date.now()) {
      return null;
    }

    return parsedBrief as ProjectAnalyticsBrief;
  } catch {
    return null;
  }
}

function writeStoredProjectBrief(projectId: string, userId: string | undefined, brief: ProjectAnalyticsBrief) {
  try {
    localStorage.setItem(projectBriefStorageKey(projectId, userId), JSON.stringify(brief));
  } catch {
    // Ignore storage failures and keep the live brief in memory.
  }
}

export function ProjectDetailsPage() {
  const navigate = useNavigate();
  const { projectId = "" } = useParams();
  const { user } = useAuthContext();
  const { showToast } = useFeedbackContext();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [documentVaultOpen, setDocumentVaultOpen] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [projectBrief, setProjectBrief] = useState<ProjectAnalyticsBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState<ProjectTeamMember | null>(null);
  const { changeOrders } = useChangeOrders(projectId, { includeArchived: true });
  const { teamMembers, error: teamError, refresh: refreshTeamMembers } = useProjectTeamMembers(projectId);
  const { documents, error: documentError, refresh: refreshDocuments } = useProjectDocuments(projectId);

  useEffect(() => {
    setProjectBrief(null);
    setBriefError(null);
    getProject(projectId)
      .then(setProject)
      .catch((requestError: Error) => setError(requestError.message));
  }, [projectId]);

  useEffect(() => {
    const storedBrief = readStoredProjectBrief(projectId, user?.id);

    if (storedBrief) {
      setProjectBrief(storedBrief);
    }
  }, [projectId, user?.id]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!project) {
    return <Typography color="text.secondary">Loading project details...</Typography>;
  }

  const status = statusPresentation(project.status);
  const canEditProject = Boolean(user && (user.role === "admin" || user.id === project.ownerId));
  const canManageProject = canEditProject && !project.archivedAt;
  const relatedChangeRows = [...changeOrders.map(mapChangeOrder), ...fallbackChangeRows].slice(0, 3);
  const hasRealTeamMembers = teamMembers.length > 0;
  const displayTeamMembers = teamMembers.length > 0 ? teamMembers : fallbackTeamMembers;
  const displayDocuments =
    documents.length > 0
      ? documents.slice(0, 2).map((document) => ({
          title: document.title,
          subtitle: document.assignedTo
            ? `Assigned to ${document.assignedTo} • Updated ${formatDate(document.updatedAt)}`
            : `Updated ${formatDate(document.updatedAt)}`,
          icon:
            document.kind.toLowerCase().includes("drawing") ? (
              <DrawRoundedIcon sx={{ color: "#7A1E08" }} />
            ) : (
              <DescriptionRoundedIcon sx={{ color: "#046B5E" }} />
            )
        }))
      : [
          {
            title: "No project documents yet",
            subtitle: "Open the vault to add the first file reference",
            icon: <DescriptionRoundedIcon sx={{ color: "#046B5E" }} />
          }
        ];
  const impactValue = changeOrders.reduce((total, item) => total + item.amount, 0);
  const utilization = Math.min(64 + changeOrders.length * 4, 92);

  async function handleGenerateBrief() {
    setBriefLoading(true);
    setBriefError(null);

    try {
      const brief = await generateProjectBrief(projectId);
      setProjectBrief(brief);
      writeStoredProjectBrief(projectId, user?.id, brief);
      showToast({
        message:
          brief.source === "claude"
            ? "Claude generated a fresh project analytics brief."
            : "Project analytics brief generated using the local fallback summary.",
        severity: brief.source === "claude" ? "success" : "info"
      });
    } catch (requestError) {
      setBriefError(requestError instanceof Error ? requestError.message : "Unable to generate the project brief.");
    } finally {
      setBriefLoading(false);
    }
  }

  return (
    <Stack
      spacing={4.5}
      sx={{
        px: { xs: 0, md: 0 },
        backgroundImage: "radial-gradient(circle, rgba(4,107,94,0.12) 1px, transparent 1px)",
        backgroundSize: "24px 24px"
      }}
    >
      {project.archivedAt ? <Alert severity="warning">This project is archived and read-only.</Alert> : null}
      {teamError ? <Alert severity="warning">{teamError}</Alert> : null}
      {documentError ? <Alert severity="warning">{documentError}</Alert> : null}

      <WorkspaceBreadcrumbs
        items={[
          { label: "Projects", to: "/app/projects" },
          { label: project.name }
        ]}
      />

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 3,
          flexWrap: "wrap"
        }}
      >
        <Box sx={{ maxWidth: 760 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" useFlexGap flexWrap="wrap">
            <Box
              sx={{
                px: 1.8,
                py: 0.9,
                borderRadius: 999,
                backgroundColor: status.backgroundColor,
                color: status.color
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.76rem",
                  fontWeight: 900,
                  letterSpacing: 1.7,
                  textTransform: "uppercase"
                }}
              >
                {status.label}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: "1rem", color: "#93A6C3" }}>Project ID: {project.code}</Typography>
          </Stack>

          <Typography
            sx={{
              mt: 2.2,
              fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
              fontSize: { xs: "3.5rem", md: "4.8rem" },
              fontWeight: 900,
              letterSpacing: -3,
              lineHeight: 0.92,
              color: "#00342B"
            }}
          >
            {project.name}
          </Typography>

          <Stack direction="row" spacing={3.2} useFlexGap flexWrap="wrap" sx={{ mt: 2.6 }}>
            <Stack direction="row" spacing={0.9} alignItems="center">
              <LocationOnRoundedIcon sx={{ color: "#5A6A84" }} />
              <Typography sx={{ fontSize: "1.1rem", color: "#42536D" }}>{project.location}</Typography>
            </Stack>
            <Stack direction="row" spacing={0.9} alignItems="center">
              <CalendarTodayRoundedIcon sx={{ color: "#046B5E" }} />
              <Typography sx={{ fontSize: "1.1rem", color: "#42536D" }}>Completion: Sep 2025</Typography>
            </Stack>
          </Stack>
        </Box>

        <Stack spacing={1.5} alignItems="flex-end">
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {canManageProject ? (
              <ButtonBase
                onClick={() => setEditProjectOpen(true)}
                sx={{
                  px: 2,
                  py: 1.1,
                  borderRadius: 2.5,
                  backgroundColor: "#E6F6FF",
                  color: "#00342B"
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <EditRoundedIcon sx={{ fontSize: 18 }} />
                  <Typography sx={{ fontSize: "0.9rem", fontWeight: 800 }}>Edit Project</Typography>
                </Stack>
              </ButtonBase>
            ) : null}
            {canManageProject ? (
              <ButtonBase
                onClick={async () => {
                  if (!window.confirm(`Archive ${project.name}?`)) {
                    return;
                  }

                  try {
                    await archiveProject(project.id);
                    showToast({
                      message: `${project.name} archived. You can review it from Resources > Archive.`,
                      severity: "success"
                    });
                    navigate("/app/resources?panel=archive");
                  } catch (requestError) {
                    setError(requestError instanceof Error ? requestError.message : "Unable to archive project.");
                  }
                }}
                sx={{
                  px: 2,
                  py: 1.1,
                  borderRadius: 2.5,
                  backgroundColor: "#FFDBD1",
                  color: "#872000"
                }}
              >
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 800 }}>Archive Project</Typography>
              </ButtonBase>
            ) : null}
          </Stack>
          <Paper
            elevation={0}
            sx={{
              px: 3.5,
              py: 3,
              minWidth: 240,
              display: "flex",
              gap: 2.5,
              alignItems: "center",
              borderRadius: 4,
              backgroundColor: "#FFFFFF",
              boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
            }}
          >
            <Box sx={{ textAlign: "right" }}>
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: "#93A6C3"
                }}
              >
                Health Score
              </Typography>
              <Typography
                sx={{
                  mt: 0.8,
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontSize: "3.5rem",
                  fontWeight: 900,
                  letterSpacing: -2.2,
                  color: "#046B5E"
                }}
              >
                98
              </Typography>
            </Box>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                position: "relative",
                display: "grid",
                placeItems: "center",
                border: "4px solid #9DEFDE"
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: "4px solid #046B5E",
                  borderTopColor: "transparent",
                  transform: "rotate(-46deg)"
                }}
              />
              <ShieldRoundedIcon sx={{ fontSize: 34, color: "#046B5E" }} />
            </Box>
          </Paper>
        </Stack>
      </Box>

      <Paper
        elevation={0}
        sx={{
          px: 2.8,
          py: 2.2,
          borderRadius: 4,
          backgroundColor: "#FFFFFF",
          boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
        }}
      >
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={1.6}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", lg: "center" }}
        >
          <Stack direction="row" spacing={1.2} alignItems="flex-start">
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                backgroundColor: canManageProject ? "#E6F6FF" : "#FFF5EE",
                color: canManageProject ? "#046B5E" : "#7A1E08"
              }}
            >
              {canManageProject ? <EditRoundedIcon sx={{ fontSize: 18 }} /> : <ShieldRoundedIcon sx={{ fontSize: 18 }} />}
            </Box>
            <Box>
              <Typography sx={{ fontSize: "0.92rem", fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", color: "#93A6C3" }}>
                Access Level
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>
                {project.archivedAt
                  ? "Archived workspace"
                  : canManageProject
                    ? user?.id === project.ownerId
                      ? "Owner access"
                      : "Admin override access"
                    : "Read-only access"}
              </Typography>
              <Typography sx={{ mt: 0.55, fontSize: "0.92rem", lineHeight: 1.65, color: "#5A6A84" }}>
                {project.archivedAt
                  ? "Records stay visible for reporting, but edits, team changes, and document updates are locked."
                  : canManageProject
                    ? user?.id === project.ownerId
                      ? "You can edit project details, manage the on-site team, update the document vault, and archive the project."
                      : "As an admin, you can manage this project even though another workspace owner is assigned to it."
                    : "You can review the project, related change orders, documents, and activity, but only the owner or an admin can make changes."}
              </Typography>
            </Box>
          </Stack>
          <Typography sx={{ fontSize: "0.88rem", color: "#7A869F" }}>
            {user?.id === project.ownerId ? "Assigned owner: you" : `Owner record: ${project.ownerId}`}
          </Typography>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.3fr) minmax(320px, 0.9fr)" },
          gap: 4
        }}
      >
        <Stack spacing={4}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 5,
              backgroundColor: "#FFFFFF",
              boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
              <Typography
                sx={{
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontSize: "2rem",
                  fontWeight: 800,
                  letterSpacing: -1.1,
                  color: "#00342B"
                }}
              >
                Project Overview
              </Typography>
              <MoreHorizRoundedIcon sx={{ color: "#D5ECF8" }} />
            </Stack>

            <Typography sx={{ fontSize: "1.24rem", lineHeight: 1.7, color: "#42536D" }}>
              {project.name} is a premium construction program in {project.location}. Contract value stands
              at {` ${formatCurrency(project.contractValue)} `} with {changeOrders.length} tracked change
              order{changeOrders.length === 1 ? "" : "s"} and a current commercial impact of
              {` ${formatCurrency(impactValue || 58400)}.`}
            </Typography>

            <Box sx={{ mt: 5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.6 }}>
                <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>Budget Utilization</Typography>
                <Typography sx={{ fontSize: "1rem", color: "#5A6A84" }}>
                  {utilization}% ({formatCurrency(project.contractValue * (utilization / 100))} of {formatCurrency(project.contractValue)})
                </Typography>
              </Stack>
              <Box sx={{ width: "100%", height: 16, borderRadius: 999, backgroundColor: "#D5ECF8", overflow: "hidden" }}>
                <Box
                  sx={{
                    width: `${utilization}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: "linear-gradient(90deg, #00342B 0%, #046B5E 100%)"
                  }}
                />
              </Box>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 5,
              background: "linear-gradient(180deg, rgba(230,246,255,0.85) 0%, #FFFFFF 100%)",
              boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={2}
              sx={{ mb: 3 }}
            >
              <Box>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <AutoAwesomeRoundedIcon sx={{ color: "#046B5E" }} />
                  <Typography
                    sx={{
                      fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                      fontSize: "2rem",
                      fontWeight: 800,
                      letterSpacing: -1.1,
                      color: "#00342B"
                    }}
                  >
                    Project Analytics Brief
                  </Typography>
                </Stack>
                <Typography sx={{ mt: 1, fontSize: "1rem", color: "#5A6A84" }}>
                  Generate a quick operational readout of what is happening now, what has progressed, and what needs attention.
                </Typography>
              </Box>
              <ButtonBase
                onClick={handleGenerateBrief}
                disabled={briefLoading}
                sx={{
                  minWidth: 118,
                  px: 1.8,
                  py: 1.15,
                  borderRadius: 2.5,
                  backgroundColor: "#00342B",
                  color: "#FFFFFF",
                  opacity: briefLoading ? 0.72 : 1
                }}
              >
                <Stack direction="row" spacing={0.9} alignItems="center">
                  <AutoAwesomeRoundedIcon sx={{ fontSize: 17 }} />
                  <Typography
                    sx={{
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      lineHeight: 1.02,
                      textAlign: "left"
                    }}
                  >
                    <Box component="span" sx={{ display: "block" }}>
                      {briefLoading ? "Generating" : projectBrief ? "Refresh" : "Generate"}
                    </Box>
                    <Box component="span" sx={{ display: "block" }}>
                      Brief
                    </Box>
                  </Typography>
                </Stack>
              </ButtonBase>
            </Stack>

            {briefError ? (
              <Alert severity="warning" sx={{ mb: 3 }}>
                {briefError}
              </Alert>
            ) : null}

            {projectBrief ? (
              <Stack spacing={3}>
                <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap" alignItems="center">
                  <Box
                    sx={{
                      px: 1.4,
                      py: 0.7,
                      borderRadius: 999,
                      backgroundColor: projectBrief.source === "claude" ? "#9DEFDE" : "#CFE6F2",
                      color: projectBrief.source === "claude" ? "#0F6F62" : "#3F4945"
                    }}
                  >
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 900, letterSpacing: 1.3, textTransform: "uppercase" }}>
                      {projectBrief.source === "claude" ? "Claude Insight" : "Local Insight"}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: "0.84rem", color: "#93A6C3" }}>
                    Generated {formatDateTime(projectBrief.generatedAt)}
                  </Typography>
                  <Typography sx={{ fontSize: "0.84rem", color: "#93A6C3" }}>
                    Your daily quota: {projectBrief.usage.userUsed}/{projectBrief.usage.userLimit}
                  </Typography>
                  <Typography sx={{ fontSize: "0.84rem", color: "#93A6C3" }}>
                    Workspace pool: {projectBrief.usage.globalUsed}/{projectBrief.usage.globalLimit}
                  </Typography>
                </Stack>

                <Typography sx={{ fontSize: "1.08rem", lineHeight: 1.7, color: "#42536D" }}>
                  {projectBrief.summary}
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                    gap: 2.2
                  }}
                >
                  {[
                    { title: "Current State", items: projectBrief.currentState, tone: "#E6F6FF" },
                    { title: "Recent Progress", items: projectBrief.recentProgress, tone: "#FFFFFF" },
                    { title: "Next Steps", items: projectBrief.nextSteps, tone: "#FFFFFF" },
                    { title: "Watchouts", items: projectBrief.watchouts, tone: "#FFFAF8" }
                  ].map((section) => (
                    <Paper
                      key={section.title}
                      elevation={0}
                      sx={{
                        p: 2.4,
                        borderRadius: 3.5,
                        backgroundColor: section.tone,
                        border: "1px solid rgba(213,236,248,0.8)"
                      }}
                    >
                      <Typography
                        sx={{
                          mb: 1.6,
                          fontSize: "0.78rem",
                          fontWeight: 900,
                          letterSpacing: 1.7,
                          textTransform: "uppercase",
                          color: "#93A6C3"
                        }}
                      >
                        {section.title}
                      </Typography>
                      <Stack spacing={1.1}>
                        {section.items.map((item) => (
                          <Stack key={item} direction="row" spacing={1.1} alignItems="flex-start">
                            <Box
                              sx={{
                                width: 7,
                                height: 7,
                                mt: 0.9,
                                borderRadius: "50%",
                                backgroundColor: "#046B5E",
                                flexShrink: 0
                              }}
                            />
                            <Typography sx={{ fontSize: "0.96rem", lineHeight: 1.6, color: "#42536D" }}>
                              {item}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Paper>
                  ))}
                </Box>
              </Stack>
            ) : (
              <Stack
                spacing={2}
                sx={{
                  px: { xs: 0, md: 1 },
                  py: { xs: 1, md: 2 }
                }}
              >
                <Typography sx={{ fontSize: "1rem", lineHeight: 1.7, color: "#5A6A84", maxWidth: 760 }}>
                  This uses the live project record, related change orders, on-site team, and document vault to generate a quick briefing a PM can act on immediately.
                </Typography>
                <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap">
                  {["Current state", "Recent progress", "Next steps", "Watchouts"].map((item) => (
                    <Box
                      key={item}
                      sx={{
                        px: 1.4,
                        py: 0.8,
                        borderRadius: 999,
                        backgroundColor: "#FFFFFF",
                        border: "1px solid rgba(213,236,248,0.95)"
                      }}
                    >
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: "#42536D" }}>{item}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            )}
          </Paper>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 5,
              overflow: "hidden",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
            }}
          >
            <Box sx={{ px: 4, py: 3.2 }}>
              <Typography
                sx={{
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontSize: "2rem",
                  fontWeight: 800,
                  letterSpacing: -1.1,
                  color: "#00342B"
                }}
              >
                Related Change Orders
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "0.8fr 1.5fr 1fr 1fr",
                px: 4,
                py: 2.4,
                backgroundColor: "#D5ECF8"
              }}
            >
              {["ID", "Title", "Impact", "Status"].map((item) => (
                <Typography
                  key={item}
                  sx={{
                    fontSize: "0.72rem",
                    fontWeight: 900,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "#93A6C3"
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Box>

            {relatedChangeRows.map((row, index) => (
              <Box
                key={row.id}
                onClick={() => navigate(`/app/change-orders?projectId=${projectId}`)}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "0.8fr 1.5fr 1fr 1fr",
                  alignItems: "center",
                  px: 4,
                  py: 3.1,
                  cursor: "pointer",
                  backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F9FCFF",
                  transition: "background-color 160ms ease",
                  "&:hover": {
                    backgroundColor: "#F3FAFF"
                  }
                }}
              >
                <Typography sx={{ fontSize: "0.94rem", fontWeight: 800, color: "#00342B" }}>{row.id}</Typography>
                <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "#071E27" }}>{row.title}</Typography>
                <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>
                  {row.impact >= 0 ? "+" : "-"}
                  {formatCurrency(Math.abs(row.impact))}
                </Typography>
                <Box sx={{ justifySelf: "start" }}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      px: 1.4,
                      py: 0.8,
                      borderRadius: 999,
                      backgroundColor: row.status === "approved" ? "#9DEFDE" : "#FFDBD1",
                      color: row.status === "approved" ? "#0F6F62" : "#872000"
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight: 900,
                        letterSpacing: 1.2,
                        textTransform: "uppercase"
                      }}
                    >
                      {row.status}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}

            <ButtonBase
              onClick={() => navigate(`/app/change-orders?projectId=${projectId}`)}
              sx={{ width: "100%", py: 2.6, backgroundColor: "#D5ECF8", color: "#046B5E" }}
            >
              <Typography sx={{ fontSize: "1rem", fontWeight: 800 }}>View Full Change History</Typography>
            </ButtonBase>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 5,
              backgroundColor: "#D5ECF8",
              boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
              <Typography
                sx={{
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontSize: "2rem",
                  fontWeight: 800,
                  letterSpacing: -1.1,
                  color: "#00342B"
                }}
              >
                Recent Documents
              </Typography>
              <ButtonBase
                onClick={() => setDocumentVaultOpen(true)}
                sx={{ color: "#046B5E" }}
              >
                <Typography sx={{ fontSize: "1rem", fontWeight: 800 }}>View All</Typography>
              </ButtonBase>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                gap: 2.5
              }}
            >
              {displayDocuments.map((document) => (
                <Paper
                  key={document.title}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    display: "flex",
                    gap: 2,
                    alignItems: "center",
                    borderRadius: 3.5,
                    backgroundColor: "#FFFFFF"
                  }}
                >
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2.5,
                      display: "grid",
                      placeItems: "center",
                      backgroundColor: "#E6F6FF"
                    }}
                  >
                    {document.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>{document.title}</Typography>
                    <Typography sx={{ mt: 0.6, fontSize: "0.76rem", fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "#93A6C3" }}>
                      {document.subtitle}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 5,
              backgroundColor: "#FFFFFF",
              boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
            }}
          >
            <Typography
              sx={{
                mb: 4,
                fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                fontSize: "2rem",
                fontWeight: 800,
                letterSpacing: -1.1,
                color: "#00342B"
              }}
            >
              On-Site Team
            </Typography>

            <Stack direction="row" spacing={1.8} useFlexGap flexWrap="wrap">
              {displayTeamMembers.map((member) => (
                <Box
                  key={member.name}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 1.5,
                    py: 1.2,
                    pr: 2.2,
                    borderRadius: 999,
                    backgroundColor: teamMemberColor(member.name)
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      backgroundColor: "#00342B",
                      color: "#FFFFFF",
                      fontWeight: 800
                    }}
                  >
                    {teamMemberInitials(member.name)}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: "0.98rem", fontWeight: 800, color: "#00342B" }}>{member.name}</Typography>
                    <Typography sx={{ mt: 0.2, fontSize: "0.72rem", fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "#93A6C3" }}>
                      {member.role}
                    </Typography>
                    {canManageProject && hasRealTeamMembers ? (
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 0.7 }}>
                        <ButtonBase
                          onClick={() => {
                            setSelectedTeamMember(member);
                            setTeamModalOpen(true);
                          }}
                          sx={{ color: "#046B5E" }}
                        >
                          <Stack direction="row" spacing={0.6} alignItems="center">
                            <EditRoundedIcon sx={{ fontSize: 14 }} />
                            <Typography sx={{ fontSize: "0.72rem", fontWeight: 800 }}>Edit</Typography>
                          </Stack>
                        </ButtonBase>
                        <ButtonBase
                          onClick={async () => {
                            if (!window.confirm(`Remove ${member.name} from this project?`)) {
                              return;
                            }

                            try {
                              await deleteProjectTeamMember(project.id, member.id);
                              await refreshTeamMembers();
                              showToast({
                                message: "Team member removed from the roster.",
                                severity: "success"
                              });
                            } catch (requestError) {
                              setError(requestError instanceof Error ? requestError.message : "Unable to remove team member.");
                            }
                          }}
                          sx={{ color: "#872000" }}
                        >
                          <Typography sx={{ fontSize: "0.72rem", fontWeight: 800 }}>Remove</Typography>
                        </ButtonBase>
                      </Stack>
                    ) : null}
                  </Box>
                </Box>
              ))}

              {canManageProject ? (
                <ButtonBase
                  onClick={() => {
                    setSelectedTeamMember(null);
                    setTeamModalOpen(true);
                  }}
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    border: "2px dashed rgba(191,201,196,0.8)",
                    color: "#93A6C3"
                  }}
                >
                  <Typography sx={{ fontSize: "2rem", lineHeight: 1 }}>+</Typography>
                </ButtonBase>
              ) : null}
            </Stack>
          </Paper>
        </Stack>

        <Stack spacing={4}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 5,
              background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)",
              color: "#FFFFFF",
              boxShadow: "0 24px 48px rgba(7,30,39,0.12)"
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
              <Typography
                sx={{
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontSize: "2rem",
                  fontWeight: 800,
                  letterSpacing: -1.1
                }}
              >
                Project Activity
              </Typography>
              <SensorsRoundedIcon sx={{ color: "#9DEFDE" }} />
            </Stack>

            <Box sx={{ position: "relative" }}>
              <Box
                sx={{
                  position: "absolute",
                  left: 11,
                  top: 10,
                  bottom: 12,
                  width: 2,
                  backgroundColor: "rgba(255,255,255,0.12)"
                }}
              />

              <Stack spacing={3.5}>
                {[
                  {
                    icon: <CheckCircleRoundedIcon sx={{ color: "#FFFFFF", fontSize: 16 }} />,
                    backgroundColor: "#046B5E",
                    title: "Foundation inspection approved",
                    body: "1 hour ago by City Inspector"
                  },
                  {
                    icon: <WarningAmberRoundedIcon sx={{ color: "#FFFFFF", fontSize: 16 }} />,
                    backgroundColor: "#7A1E08",
                    title: "New Change Order Submitted",
                    body: "4 hours ago • CO #442"
                  },
                  {
                    icon: <DescriptionRoundedIcon sx={{ color: "#FFFFFF", fontSize: 16 }} />,
                    backgroundColor: "#42536D",
                    title: "Weekly Progress Photo uploaded",
                    body: "Yesterday by Site Drone"
                  }
                ].map((item) => (
                  <Stack key={item.title} direction="row" spacing={1.8}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        zIndex: 1,
                        flexShrink: 0,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        backgroundColor: item.backgroundColor
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: "1.02rem", fontWeight: 800, color: "#FFFFFF" }}>{item.title}</Typography>
                      <Typography sx={{ mt: 0.5, fontSize: "0.88rem", color: "rgba(255,255,255,0.68)" }}>{item.body}</Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 0,
              overflow: "hidden",
              borderRadius: 5,
              backgroundColor: "#C7DDE9",
              boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
            }}
          >
            <Box
              sx={{
                height: 220,
                background:
                  "linear-gradient(135deg, rgba(123,174,205,0.9) 0%, rgba(179,214,194,0.9) 100%)"
              }}
            />
            <ButtonBase
              onClick={() => {
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.location)}`,
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
              sx={{
                m: 2.2,
                px: 2.2,
                py: 1.8,
                borderRadius: 2.5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(12px)"
              }}
            >
              <Typography sx={{ fontSize: "0.96rem", fontWeight: 800, color: "#00342B" }}>
                Site Address: 1202 Georgia St.
              </Typography>
              <OpenInNewRoundedIcon sx={{ color: "#046B5E" }} />
            </ButtonBase>
          </Paper>
        </Stack>
      </Box>

      <FooterLinks />

      <AddTeamMemberModal
        open={teamModalOpen}
        projectId={projectId}
        teamMember={selectedTeamMember}
        onClose={() => {
          setTeamModalOpen(false);
          setSelectedTeamMember(null);
        }}
        onCreated={async () => {
          await refreshTeamMembers();
          showToast({
            message: selectedTeamMember ? "Team member updated." : "Team member added to the on-site roster.",
            severity: "success"
          });
        }}
      />
      <EditProjectModal
        open={editProjectOpen}
        project={project}
        onClose={() => setEditProjectOpen(false)}
        onSaved={async (updatedProject) => {
          setProject(updatedProject);
          showToast({
            message: "Project details updated.",
            severity: "success"
          });
        }}
      />
      <ProjectDocumentVaultModal
        open={documentVaultOpen}
        project={project}
        documents={documents}
        teamMembers={teamMembers}
        canEdit={canManageProject}
        onClose={() => setDocumentVaultOpen(false)}
        onCreated={async () => {
          await refreshDocuments();
          showToast({
            message: "Project vault updated.",
            severity: "success"
          });
        }}
      />
    </Stack>
  );
}
