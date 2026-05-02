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
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useNavigate, useParams } from "react-router-dom";

import {
  archiveProject,
  askProjectQuestion,
  deleteProjectTeamMember,
  generateProjectBrief,
  getProject,
  getProjectAgentWorkspace
} from "../api/projects";
import { WorkspaceBreadcrumbs } from "../components/layout/WorkspaceBreadcrumbs";
import { AddTeamMemberModal } from "../components/projects/AddTeamMemberModal";
import { AgentWorkspaceModal } from "../components/projects/AgentWorkspaceModal";
import { EditProjectModal } from "../components/projects/EditProjectModal";
import { ProjectDocumentVaultModal } from "../components/projects/ProjectDocumentVaultModal";
import { useAuthContext } from "../context/AuthContext";
import { useFeedbackContext } from "../context/FeedbackContext";
import { useChangeOrders } from "../hooks/useChangeOrders";
import { useProjectDocuments } from "../hooks/useProjectDocuments";
import { useProjectTeamMembers } from "../hooks/useProjectTeamMembers";
import type {
  AgentMemoryEntry,
  AgentPendingAction,
  AgentRun,
  AgentToolExecution,
  DocumentProcessingRun,
  Project,
  ProjectAgentWorkspace,
  ProjectAnalyticsBrief,
  ProjectComment,
  ProjectRiskFlag,
  ProjectQuestionAnswer,
  ProjectTask,
  ProjectTeamMember
} from "../types/project";
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
  const [agentWorkspace, setAgentWorkspace] = useState<ProjectAgentWorkspace | null>(null);
  const [agentWorkspaceError, setAgentWorkspaceError] = useState<string | null>(null);
  const [agentWorkspaceOpen, setAgentWorkspaceOpen] = useState(false);
  const [projectQuestion, setProjectQuestion] = useState("");
  const [projectQuestionLoading, setProjectQuestionLoading] = useState(false);
  const [projectQuestionError, setProjectQuestionError] = useState<string | null>(null);
  const [projectQuestionAnswer, setProjectQuestionAnswer] = useState<ProjectQuestionAnswer | null>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState<ProjectTeamMember | null>(null);
  const { changeOrders } = useChangeOrders(projectId, { includeArchived: true });
  const { teamMembers, error: teamError, refresh: refreshTeamMembers } = useProjectTeamMembers(projectId);
  const { documents, error: documentError, refresh: refreshDocuments } = useProjectDocuments(projectId);

  async function refreshAgentWorkspace() {
    try {
      setAgentWorkspaceError(null);
      setAgentWorkspace(await getProjectAgentWorkspace(projectId));
    } catch (requestError) {
      setAgentWorkspaceError(requestError instanceof Error ? requestError.message : "Unable to load agent workspace.");
    }
  }

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

  useEffect(() => {
    setAgentWorkspace(null);
    void refreshAgentWorkspace();
  }, [projectId]);

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
          aiSummary: document.aiSummary,
          status: document.agentStatus,
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
            aiSummary: undefined,
            status: "idle",
            subtitle: "Open the vault to add the first file reference",
            icon: <DescriptionRoundedIcon sx={{ color: "#046B5E" }} />
          }
        ];
  const projectTasks = agentWorkspace?.tasks ?? [];
  const projectRiskFlags = agentWorkspace?.riskFlags ?? [];
  const projectComments = agentWorkspace?.comments ?? [];
  const latestProcessingRuns = agentWorkspace?.processingRuns.slice(0, 3) ?? [];
  const latestAgentRuns = agentWorkspace?.agentRuns.slice(0, 2) ?? [];
  const latestToolExecutions = agentWorkspace?.toolExecutions.slice(0, 3) ?? [];
  const pendingAgentActions = agentWorkspace?.pendingActions ?? [];
  const latestPendingAgentActions = pendingAgentActions.filter((action) => action.status === "pending").slice(0, 3);
  const latestMemoryEntries = agentWorkspace?.memoryEntries.slice(0, 3) ?? [];
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

  async function handleAskProjectQuestion() {
    if (projectQuestion.trim().length < 8) {
      setProjectQuestionError("Ask a more specific question so the system can retrieve the right project context.");
      return;
    }

    setProjectQuestionLoading(true);
    setProjectQuestionError(null);

    try {
      const answer = await askProjectQuestion(projectId, {
        question: projectQuestion.trim()
      });
      setProjectQuestionAnswer(answer);
      showToast({
        message:
          answer.source === "claude"
            ? "Grounded project answer generated from the latest document evidence."
            : "Project answer generated using the local fallback retrieval.",
        severity: answer.source === "claude" ? "success" : "info"
      });
    } catch (requestError) {
      setProjectQuestionError(
        requestError instanceof Error ? requestError.message : "Unable to answer this project question."
      );
    } finally {
      setProjectQuestionLoading(false);
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
      {agentWorkspaceError ? <Alert severity="warning">{agentWorkspaceError}</Alert> : null}

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

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.2}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        sx={{ maxWidth: 1240, width: "100%", mx: "auto", px: 0.4 }}
      >
        <Typography sx={{ fontSize: "0.8rem", lineHeight: 1.5, color: "#7A869F" }}>
          <Box component="span" sx={{ fontWeight: 700, color: "#42536D" }}>
            {project.archivedAt
              ? "Archived workspace"
              : canManageProject
                ? user?.id === project.ownerId
                  ? "Owner access"
                  : "Admin override access"
                : "Read-only access"}
          </Box>{" "}
          {project.archivedAt
            ? "Edits and document updates are locked."
            : canManageProject
              ? "You can manage project details, documents, and team changes."
              : "Only the owner or admin can make changes."}
        </Typography>
        <Typography sx={{ fontSize: "0.74rem", color: "#93A6C3" }}>
          {user?.id === project.ownerId ? "Assigned owner: you" : `Owner record: ${project.ownerId}`}
        </Typography>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          gap: 3
        }}
      >
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 4,
                backgroundColor: "#FFFFFF",
                boxShadow: "0 10px 24px rgba(7,30,39,0.035)"
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography
                  sx={{
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: "1.55rem",
                    fontWeight: 700,
                    letterSpacing: -0.6,
                    color: "#00342B"
                  }}
                >
                  Agent Tasks
                </Typography>
                <AutoAwesomeRoundedIcon sx={{ color: "#046B5E" }} />
              </Stack>

              {latestAgentRuns.length > 0 || latestMemoryEntries.length > 0 || latestToolExecutions.length > 0 || latestPendingAgentActions.length > 0 ? (
                <Stack spacing={1.5} sx={{ mb: 2.6 }}>
                  {latestAgentRuns.map((run: AgentRun) => (
                    <Paper
                      key={run.id}
                      elevation={0}
                      sx={{
                        p: 1.8,
                        borderRadius: 3,
                        backgroundColor: "#F6FBFF",
                        border: "1px solid rgba(213,236,248,0.9)"
                      }}
                    >
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase", color: "#93A6C3" }}>
                        {run.trigger.replace(/_/g, " ")} • {run.status}
                      </Typography>
                      <Typography sx={{ mt: 0.35, fontSize: "0.9rem", fontWeight: 700, color: "#00342B" }}>
                        {run.summary ?? "Recent agent run recorded."}
                      </Typography>
                    </Paper>
                  ))}
                  {latestMemoryEntries.map((entry: AgentMemoryEntry) => (
                    <Typography key={entry.id} sx={{ fontSize: "0.84rem", lineHeight: 1.55, color: "#5A6A84" }}>
                      <Box component="span" sx={{ fontWeight: 700, color: "#046B5E" }}>
                        {entry.kind.replace(/_/g, " ")}:
                      </Box>{" "}
                      {entry.title}
                    </Typography>
                  ))}
                  {latestPendingAgentActions.length > 0 ? (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.8,
                        borderRadius: 3,
                        backgroundColor: "#FFFFFF",
                        border: "1px solid rgba(213,236,248,0.9)"
                      }}
                    >
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase", color: "#93A6C3" }}>
                        Pending Review Queue
                      </Typography>
                      <Stack spacing={0.8} sx={{ mt: 1 }}>
                        {latestPendingAgentActions.map((action: AgentPendingAction) => (
                          <Box key={action.id}>
                            <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: "#00342B" }}>
                              {action.title}
                            </Typography>
                            <Typography sx={{ mt: 0.2, fontSize: "0.78rem", color: "#5A6A84" }}>
                              {action.actionType.replace(/_/g, " ")} • {action.status}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  ) : latestToolExecutions.length > 0 ? (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.8,
                        borderRadius: 3,
                        backgroundColor: "#FFFFFF",
                        border: "1px solid rgba(213,236,248,0.9)"
                      }}
                    >
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase", color: "#93A6C3" }}>
                        Latest Tool Activity
                      </Typography>
                      <Stack spacing={0.8} sx={{ mt: 1 }}>
                        {latestToolExecutions.map((execution: AgentToolExecution) => (
                          <Box key={execution.id}>
                            <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: "#00342B" }}>
                              {execution.title}
                            </Typography>
                            <Typography sx={{ mt: 0.2, fontSize: "0.78rem", color: "#5A6A84" }}>
                              {execution.toolName.replace(/_/g, " ")} • {execution.status}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  ) : null}
                </Stack>
              ) : null}

              {projectTasks.length > 0 ? (
                <Stack spacing={2}>
                  {projectTasks.slice(0, 4).map((task: ProjectTask) => (
                    <Paper
                      key={task.id}
                      elevation={0}
                      sx={{
                        p: 2.2,
                        borderRadius: 3.5,
                        backgroundColor: "#F9FCFF",
                        border: "1px solid rgba(213,236,248,0.9)"
                      }}
                    >
                      <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "#00342B" }}>{task.title}</Typography>
                      <Typography sx={{ mt: 0.8, fontSize: "0.94rem", lineHeight: 1.6, color: "#42536D" }}>
                        {task.description}
                      </Typography>
                      <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap" sx={{ mt: 1.4 }}>
                        <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, letterSpacing: 1.3, textTransform: "uppercase", color: "#93A6C3" }}>
                          {task.status}
                        </Typography>
                        {task.assignedTo ? (
                          <Typography sx={{ fontSize: "0.82rem", color: "#046B5E", fontWeight: 600 }}>
                            Assigned to {task.assignedTo}
                          </Typography>
                        ) : null}
                      </Stack>
                      <ButtonBase onClick={() => navigate(`/app/tasks/${task.id}`)} sx={{ mt: 1.2, color: "#046B5E" }}>
                        <Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>Open Task</Typography>
                      </ButtonBase>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Typography sx={{ fontSize: "0.98rem", lineHeight: 1.7, color: "#5A6A84" }}>
                  Upload or link a project document and the document agent will create actionable follow-up tasks here.
                </Typography>
              )}
              {projectTasks.length > 0 ? (
                <ButtonBase
                  onClick={() => setAgentWorkspaceOpen(true)}
                  sx={{ mt: 2.5, color: "#046B5E" }}
                >
                  <Typography sx={{ fontSize: "0.94rem", fontWeight: 700 }}>Open Agent Tasks</Typography>
                </ButtonBase>
              ) : null}
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 4,
                backgroundColor: "#FFFFFF",
                boxShadow: "0 10px 24px rgba(7,30,39,0.035)"
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography
                  sx={{
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: "1.55rem",
                    fontWeight: 700,
                    letterSpacing: -0.6,
                    color: "#00342B"
                  }}
                >
                  Risk Flags
                </Typography>
                <WarningAmberRoundedIcon sx={{ color: "#7A1E08" }} />
              </Stack>

              {projectRiskFlags.length > 0 ? (
                <Stack spacing={2}>
                  {projectRiskFlags.slice(0, 4).map((riskFlag: ProjectRiskFlag) => (
                    <Paper
                      key={riskFlag.id}
                      elevation={0}
                      sx={{
                        p: 2.2,
                        borderRadius: 3.5,
                        backgroundColor: "#FFF6F1",
                        border: "1px solid rgba(255,219,209,0.95)"
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                        <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "#7A1E08" }}>{riskFlag.title}</Typography>
                        <Typography sx={{ fontSize: "0.75rem", fontWeight: 900, letterSpacing: 1.4, textTransform: "uppercase", color: "#872000" }}>
                          {riskFlag.level}
                        </Typography>
                      </Stack>
                      <Typography sx={{ mt: 0.8, fontSize: "0.94rem", lineHeight: 1.6, color: "#6B412C" }}>
                        {riskFlag.description}
                      </Typography>
                      <ButtonBase onClick={() => navigate(`/app/risk-flags/${riskFlag.id}`)} sx={{ mt: 1.2, color: "#872000" }}>
                        <Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>Open Risk Flag</Typography>
                      </ButtonBase>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Typography sx={{ fontSize: "0.98rem", lineHeight: 1.7, color: "#5A6A84" }}>
                  No agent-generated risk flags yet. The first uploaded document with scope, cost, or schedule signal will surface here.
                </Typography>
              )}
            </Paper>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.65fr) minmax(280px, 0.65fr)" },
          gap: 4
        }}
      >
        <Stack spacing={4}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              backgroundColor: "#FFFFFF",
              boxShadow: "0 10px 24px rgba(7,30,39,0.035)"
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
              <Typography
                sx={{
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontSize: "1.7rem",
                  fontWeight: 700,
                  letterSpacing: -0.75,
                  color: "#00342B"
                }}
              >
                Project Overview
              </Typography>
              <MoreHorizRoundedIcon sx={{ color: "#D5ECF8" }} />
            </Stack>

            <Typography sx={{ fontSize: "1.08rem", lineHeight: 1.75, color: "#42536D" }}>
              {project.name} is a premium construction program in {project.location}. Contract value stands
              at {` ${formatCurrency(project.contractValue)} `} with {changeOrders.length} tracked change
              order{changeOrders.length === 1 ? "" : "s"} and a current commercial impact of
              {` ${formatCurrency(impactValue || 58400)}.`}
            </Typography>

            <Box sx={{ mt: 5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.6 }}>
                <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "#00342B" }}>Budget Utilization</Typography>
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
              borderRadius: 4,
              backgroundColor: "#FFFFFF",
              boxShadow: "0 10px 24px rgba(7,30,39,0.035)"
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={2}
              sx={{ mb: 4 }}
            >
              <Box sx={{ width: "100%", textAlign: { xs: "left", md: "center" } }}>
                <Typography
                  sx={{
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: "1.7rem",
                    fontWeight: 700,
                    letterSpacing: -0.75,
                    color: "#00342B"
                  }}
                >
                  Recent Documents
                </Typography>
              </Box>
              <ButtonBase
                onClick={() => setDocumentVaultOpen(true)}
                sx={{ color: "#046B5E", alignSelf: { xs: "flex-start", md: "center" } }}
              >
                <Typography sx={{ fontSize: "1rem", fontWeight: 700 }}>View All</Typography>
              </ButtonBase>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                gap: 2.5,
                maxWidth: 980,
                mx: "auto"
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
                    backgroundColor: "#F9FCFF",
                    border: "1px solid rgba(213,236,248,0.82)"
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
                    <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "#00342B" }}>{document.title}</Typography>
                    {document.aiSummary ? (
                      <Typography sx={{ mt: 0.65, fontSize: "0.88rem", lineHeight: 1.55, color: "#42536D" }}>
                        {document.aiSummary}
                      </Typography>
                    ) : null}
                    <Typography sx={{ mt: 0.6, fontSize: "0.76rem", fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "#93A6C3" }}>
                      {document.subtitle}
                    </Typography>
                    {document.status ? (
                      <Typography sx={{ mt: 0.45, fontSize: "0.72rem", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: document.status === "completed" ? "#046B5E" : document.status === "failed" ? "#872000" : "#5A6A84" }}>
                        Agent {document.status}
                      </Typography>
                    ) : null}
                  </Box>
                </Paper>
              ))}
            </Box>
          </Paper>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.2fr) minmax(0, 0.95fr)" },
              gap: 3
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                backgroundColor: "#FFFFFF",
                boxShadow: "0 10px 24px rgba(7,30,39,0.035)"
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                spacing={1.5}
                sx={{ mb: 2.2 }}
              >
                <Box sx={{ width: "100%" }}>
                  <Typography
                    sx={{
                      fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                      fontSize: { xs: "1.45rem", md: "1.65rem" },
                      fontWeight: 700,
                      letterSpacing: -0.65,
                      color: "#00342B"
                    }}
                  >
                    Ask This Project
                  </Typography>
                  <Typography sx={{ mt: 0.6, fontSize: "0.9rem", lineHeight: 1.6, color: "#5A6A84" }}>
                    Ask a grounded question over uploaded project documents and get a cited answer back.
                  </Typography>
                </Box>
                <ButtonBase
                  onClick={() => setAgentWorkspaceOpen(true)}
                  sx={{
                    px: 2.1,
                    py: 1.05,
                    borderRadius: 2.5,
                    backgroundColor: "#E6F6FF",
                    color: "#00342B"
                  }}
                >
                  <Typography sx={{ fontSize: "0.84rem", fontWeight: 700 }}>Open Agent Workspace</Typography>
                </ButtonBase>
              </Stack>

              <Stack spacing={1.3} sx={{ width: "100%" }}>
                <TextField
                  value={projectQuestion}
                  onChange={(event) => setProjectQuestion(event.target.value)}
                  placeholder="What changed in this project that could affect the current budget or schedule?"
                  multiline
                  minRows={2}
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      backgroundColor: "#F9FCFF"
                    }
                  }}
                />
                <ButtonBase
                  onClick={() => void handleAskProjectQuestion()}
                  disabled={projectQuestionLoading}
                  sx={{
                    minWidth: 180,
                    px: 2.2,
                    py: 1.2,
                    borderRadius: 3,
                    backgroundColor: "#00342B",
                    color: "#FFFFFF",
                    alignSelf: "flex-start",
                    opacity: projectQuestionLoading ? 0.65 : 1
                  }}
                >
                  <Stack spacing={0.2} alignItems="flex-start">
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, letterSpacing: 1.1, textTransform: "uppercase" }}>
                      {projectQuestionLoading ? "Thinking..." : "Ask Project"}
                    </Typography>
                    <Typography sx={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.74)" }}>
                      Grounded answer
                    </Typography>
                  </Stack>
                </ButtonBase>
              </Stack>

              {projectQuestionError ? <Alert severity="warning" sx={{ mt: 2.2 }}>{projectQuestionError}</Alert> : null}

              {projectQuestionAnswer ? (
                <Paper
                  elevation={0}
                  sx={{
                    mt: 2.4,
                    p: 2.4,
                    borderRadius: 3.5,
                    backgroundColor: "#F9FCFF",
                    border: "1px solid rgba(213,236,248,0.95)"
                  }}
                >
                  <Typography sx={{ fontSize: "0.96rem", lineHeight: 1.72, color: "#00342B" }}>
                    {projectQuestionAnswer.answer}
                  </Typography>
                  <Stack spacing={1.2} sx={{ mt: 2 }}>
                    {projectQuestionAnswer.citations.map((citation) => (
                      <Paper
                        key={`${citation.documentId}-${citation.chunkIndex}`}
                        elevation={0}
                        sx={{
                          p: 1.8,
                          borderRadius: 3,
                          backgroundColor: "#FFFFFF",
                          border: "1px solid rgba(213,236,248,0.82)"
                        }}
                      >
                        <Typography sx={{ fontSize: "0.78rem", fontWeight: 900, letterSpacing: 1.1, textTransform: "uppercase", color: "#93A6C3" }}>
                          {citation.documentTitle} • chunk {citation.chunkIndex + 1}
                        </Typography>
                        <Typography sx={{ mt: 0.75, fontSize: "0.86rem", lineHeight: 1.6, color: "#42536D" }}>
                          {citation.excerpt}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Paper>
              ) : null}
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 4,
                background: "linear-gradient(180deg, rgba(230,246,255,0.85) 0%, #FFFFFF 100%)",
                boxShadow: "0 10px 24px rgba(7,30,39,0.035)"
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
                        fontSize: "1.7rem",
                        fontWeight: 700,
                        letterSpacing: -0.75,
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
                p: 4,
                borderRadius: 4,
                backgroundColor: "#FFFFFF",
                boxShadow: "0 10px 24px rgba(7,30,39,0.035)"
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography
                  sx={{
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: "1.55rem",
                    fontWeight: 700,
                    letterSpacing: -0.6,
                    color: "#00342B"
                  }}
                >
                  Agent Notes
                </Typography>
                <AutoAwesomeRoundedIcon sx={{ color: "#046B5E" }} />
              </Stack>

              {projectComments.length > 0 ? (
                <Stack spacing={1.8}>
                  {projectComments.slice(0, 3).map((comment: ProjectComment) => (
                    <Paper
                      key={comment.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        backgroundColor: "#F9FCFF",
                        border: "1px solid rgba(213,236,248,0.9)"
                      }}
                    >
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 900, letterSpacing: 1.1, textTransform: "uppercase", color: "#93A6C3" }}>
                        {comment.authorName} {comment.createdByAgent ? "• agent" : ""}
                      </Typography>
                      <Typography sx={{ mt: 0.7, fontSize: "0.92rem", lineHeight: 1.65, color: "#42536D" }}>
                        {comment.body}
                      </Typography>
                      <Typography sx={{ mt: 0.75, fontSize: "0.76rem", color: "#7A869F" }}>
                        {formatDateTime(comment.updatedAt)}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Typography sx={{ fontSize: "0.95rem", lineHeight: 1.65, color: "#5A6A84" }}>
                  Agent notes will appear here when a processed document generates a project-facing summary or follow-up recommendation.
                </Typography>
              )}
            </Paper>
          </Box>

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
              p: 3,
              borderRadius: 4,
              background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)",
              color: "#FFFFFF",
              boxShadow: "0 16px 32px rgba(7,30,39,0.1)"
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontSize: "1.45rem",
                  fontWeight: 700,
                  letterSpacing: -0.55
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

              <Stack spacing={2.6}>
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
                  },
                  ...latestProcessingRuns.map((run: DocumentProcessingRun) => ({
                    icon: <AutoAwesomeRoundedIcon sx={{ color: "#FFFFFF", fontSize: 16 }} />,
                    backgroundColor: run.status === "failed" ? "#7A1E08" : "#046B5E",
                    title: `Document agent ${run.status}`,
                    body: `${run.extractionMethod.replace(/_/g, " ")} • ${formatDateTime(run.updatedAt)}`
                  }))
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
                      <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, color: "#FFFFFF" }}>{item.title}</Typography>
                      <Typography sx={{ mt: 0.35, fontSize: "0.8rem", color: "rgba(255,255,255,0.68)" }}>{item.body}</Typography>
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
              borderRadius: 4,
              backgroundColor: "#C7DDE9",
              boxShadow: "0 10px 24px rgba(7,30,39,0.04)"
            }}
          >
            <Box
              sx={{
                height: 150,
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
                m: 1.6,
                px: 1.8,
                py: 1.35,
                borderRadius: 2.2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(12px)"
              }}
            >
              <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: "#00342B" }}>
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
          await refreshAgentWorkspace();
          showToast({
            message: "Project vault updated.",
            severity: "success"
          });
        }}
      />
      <AgentWorkspaceModal
        open={agentWorkspaceOpen}
        onClose={() => setAgentWorkspaceOpen(false)}
        onRefresh={async () => {
          await Promise.all([refreshAgentWorkspace(), refreshDocuments()]);
        }}
        projectId={projectId}
        canReviewActions={canEditProject}
        tasks={projectTasks}
        riskFlags={projectRiskFlags}
        comments={projectComments}
        processingRuns={agentWorkspace?.processingRuns ?? []}
        agentRuns={agentWorkspace?.agentRuns ?? []}
        toolExecutions={agentWorkspace?.toolExecutions ?? []}
        pendingActions={agentWorkspace?.pendingActions ?? []}
        memoryEntries={agentWorkspace?.memoryEntries ?? []}
      />
    </Stack>
  );
}
