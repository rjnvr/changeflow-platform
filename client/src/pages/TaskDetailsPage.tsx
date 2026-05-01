import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getProject, getProjectDocuments, getProjectTask, updateProjectTaskStatus } from "../api/projects";
import { WorkspaceBreadcrumbs } from "../components/layout/WorkspaceBreadcrumbs";
import { WorkspaceFooter } from "../components/layout/WorkspaceFooter";
import { useFeedbackContext } from "../context/FeedbackContext";
import type { Project, ProjectDocument, ProjectTask } from "../types/project";
import { formatDateTime } from "../utils/formatDate";

const nextStatusOptions: Record<ProjectTask["status"], Array<ProjectTask["status"]>> = {
  suggested: ["open"],
  open: ["in_progress", "done"],
  in_progress: ["done", "open"],
  done: ["open"]
};

function statusTone(status: ProjectTask["status"]) {
  return {
    suggested: { backgroundColor: "#EEF3F8", color: "#52637E", label: "Suggested" },
    open: { backgroundColor: "#E6F6FF", color: "#046B5E", label: "Open" },
    in_progress: { backgroundColor: "#D5ECF8", color: "#0C5A72", label: "In Progress" },
    done: { backgroundColor: "#9DEFDE", color: "#0F6F62", label: "Done" }
  }[status];
}

export function TaskDetailsPage() {
  const navigate = useNavigate();
  const { taskId = "" } = useParams();
  const { showToast } = useFeedbackContext();
  const [task, setTask] = useState<ProjectTask | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<ProjectTask["status"] | null>(null);

  useEffect(() => {
    async function load() {
      if (!taskId) {
        setError("Task not found.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nextTask = await getProjectTask(taskId);
        const [nextProject, nextDocuments] = await Promise.all([
          getProject(nextTask.projectId),
          getProjectDocuments(nextTask.projectId)
        ]);

        setTask(nextTask);
        setProject(nextProject);
        setDocuments(nextDocuments);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to load the task.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [taskId]);

  const linkedDocument = useMemo(
    () => documents.find((document) => document.id === task?.sourceDocumentId),
    [documents, task?.sourceDocumentId]
  );

  async function handleUpdateStatus(status: ProjectTask["status"]) {
    if (!task) {
      return;
    }

    setUpdatingStatus(status);

    try {
      const updatedTask = await updateProjectTaskStatus(task.id, { status });
      setTask(updatedTask);
      showToast({
        message:
          status === "open" && task.status === "suggested"
            ? "Task added to the board."
            : `Task moved to ${status.replace("_", " ")}.`,
        severity: "success"
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update the task.");
    } finally {
      setUpdatingStatus(null);
    }
  }

  const status = task ? statusTone(task.status) : null;

  return (
    <Stack spacing={4.5}>
      <WorkspaceBreadcrumbs
        items={[
          { label: "Tasks", to: "/app/tasks" },
          project ? { label: project.name, to: `/app/projects/${project.id}` } : undefined,
          { label: task?.title ?? "Task Details" }
        ].filter(Boolean) as Array<{ label: string; to?: string }>}
      />

      {loading ? (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, backgroundColor: "#FFFFFF" }}>
          <Typography sx={{ fontSize: "1rem", color: "#5A6A84" }}>Loading task details...</Typography>
        </Paper>
      ) : error || !task || !project ? (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, backgroundColor: "#FFF6F1" }}>
          <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "#872000" }}>
            {error ?? "Task not found."}
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
                    <AutoAwesomeRoundedIcon sx={{ color: "#046B5E" }} />
                    <Typography
                      sx={{
                        fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                        fontSize: { xs: "2.2rem", md: "3.2rem" },
                        fontWeight: 900,
                        letterSpacing: -1.8,
                        color: "#00342B"
                      }}
                    >
                      {task.title}
                    </Typography>
                  </Stack>
                  <Typography sx={{ mt: 1.2, maxWidth: 860, fontSize: "1.04rem", lineHeight: 1.75, color: "#4C5D78" }}>
                    {task.description}
                  </Typography>
                </Box>

                {status ? (
                  <Box sx={{ px: 1.6, py: 1, borderRadius: 2.5, backgroundColor: status.backgroundColor }}>
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase", color: status.color }}>
                      {status.label}
                    </Typography>
                  </Box>
                ) : null}
              </Stack>

              <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap">
                {nextStatusOptions[task.status]?.map((nextStatus) => (
                  <ButtonBase
                    key={nextStatus}
                    disabled={updatingStatus === nextStatus}
                    onClick={() => void handleUpdateStatus(nextStatus)}
                    sx={{
                      px: 1.8,
                      py: 0.95,
                      borderRadius: 2.4,
                      backgroundColor:
                        nextStatus === "open" ? "#E6F6FF" : nextStatus === "in_progress" ? "#D5ECF8" : "#9DEFDE",
                      color: nextStatus === "done" ? "#0F6F62" : "#00342B",
                      opacity: updatingStatus === nextStatus ? 0.65 : 1
                    }}
                  >
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 800 }}>
                      {task.status === "suggested" && nextStatus === "open"
                        ? "Add to Task Board"
                        : nextStatus === "in_progress"
                          ? "Start Task"
                          : nextStatus === "done"
                            ? "Complete Task"
                            : "Reopen Task"}
                    </Typography>
                  </ButtonBase>
                ))}
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
              <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: "#00342B" }}>Task Context</Typography>
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
                  Assignment
                </Typography>
                <Typography sx={{ fontSize: "1rem", color: "#00342B", fontWeight: 700 }}>
                  {task.assignedTo ?? "Unassigned"}
                </Typography>
              </Stack>

              <Stack spacing={1.2} sx={{ mt: 2.6 }}>
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "#93A6C3" }}>
                  Origin
                </Typography>
                <Typography sx={{ fontSize: "1rem", color: "#00342B", fontWeight: 700 }}>
                  {task.createdByAgent ? "Agent-generated follow-up" : "Manual project task"}
                </Typography>
                <Typography sx={{ fontSize: "0.96rem", color: "#5A6A84" }}>
                  Created {formatDateTime(task.createdAt)} • Updated {formatDateTime(task.updatedAt)}
                </Typography>
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: 3.2, borderRadius: 4, backgroundColor: "#F9FCFF", boxShadow: "0 12px 32px rgba(7,30,39,0.04)" }}>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <DescriptionRoundedIcon sx={{ color: "#046B5E" }} />
                <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: "#00342B" }}>Linked Evidence</Typography>
              </Stack>

              {linkedDocument ? (
                <Paper elevation={0} sx={{ mt: 2.2, p: 2.2, borderRadius: 3, backgroundColor: "#FFFFFF", border: "1px solid rgba(213,236,248,0.9)" }}>
                  <Typography sx={{ fontSize: "0.98rem", fontWeight: 800, color: "#00342B" }}>{linkedDocument.title}</Typography>
                  <Typography sx={{ mt: 0.7, fontSize: "0.9rem", lineHeight: 1.6, color: "#42536D" }}>
                    {linkedDocument.aiSummary || linkedDocument.summary || "Document summary unavailable."}
                  </Typography>
                  <ButtonBase
                    onClick={() => navigate(`/app/projects/${project.id}`)}
                    sx={{ mt: 1.2, color: "#046B5E", display: "inline-flex", alignItems: "center", gap: 0.6 }}
                  >
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 800 }}>Open Project Document Vault</Typography>
                    <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
                  </ButtonBase>
                </Paper>
              ) : (
                <Typography sx={{ mt: 2.2, fontSize: "0.95rem", color: "#5A6A84" }}>
                  This task is not linked to a specific source document.
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
