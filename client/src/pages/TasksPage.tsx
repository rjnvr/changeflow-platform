import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getProjectTasks, updateProjectTaskStatus } from "../api/projects";
import { WorkspaceBreadcrumbs } from "../components/layout/WorkspaceBreadcrumbs";
import { WorkspaceFooter } from "../components/layout/WorkspaceFooter";
import { useFeedbackContext } from "../context/FeedbackContext";
import type { ProjectTask } from "../types/project";
import { getTaskStatusMeta, getTaskTransitionLabel, getTaskTransitionMeta } from "../utils/taskStatus";

const columns: Array<{ key: ProjectTask["status"]; label: string }> = [
  { key: "suggested", label: "Needs Review" },
  { key: "open", label: "Ready to Start" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Completed" }
];

const nextStatusOptions: Record<ProjectTask["status"], Array<ProjectTask["status"]>> = {
  suggested: ["open"],
  open: ["in_progress", "done"],
  in_progress: ["done", "open"],
  done: ["open"]
};

export function TasksPage() {
  const navigate = useNavigate();
  const { showToast } = useFeedbackContext();
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  async function loadTasks() {
    try {
      setError(null);
      setTasks(await getProjectTasks());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load tasks.");
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  const groupedTasks = useMemo(() => {
    const groups = new Map<ProjectTask["status"], ProjectTask[]>();
    columns.forEach((column) => groups.set(column.key, []));

    tasks.forEach((task) => {
      const list = groups.get(task.status as ProjectTask["status"]);
      if (list) {
        list.push(task);
      }
    });

    return groups;
  }, [tasks]);

  async function handleUpdateStatus(taskId: string, status: ProjectTask["status"]) {
    setUpdatingTaskId(taskId);

    try {
      const updatedTask = await updateProjectTaskStatus(taskId, { status });
      setTasks((currentTasks) => currentTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
      showToast({
        message: `Task moved to ${status.replace("_", " ")}.`,
        severity: "success"
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update task status.");
    } finally {
      setUpdatingTaskId(null);
    }
  }

  return (
    <Stack spacing={4.5}>
      <WorkspaceBreadcrumbs items={[{ label: "Tasks" }]} />

      <Box>
        <Typography
          sx={{
            fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
            fontSize: { xs: "3rem", md: "4rem" },
            fontWeight: 900,
            letterSpacing: -2.5,
            color: "#00342B"
          }}
        >
          Task Board
        </Typography>
        <Typography sx={{ mt: 1.4, maxWidth: 760, fontSize: "1.1rem", lineHeight: 1.7, color: "#5A6A84" }}>
          Move work from review into active execution, see what is ready to start, and close tasks once the project follow-up is complete.
        </Typography>
      </Box>

      {error ? (
        <Paper elevation={0} sx={{ p: 2.4, borderRadius: 4, backgroundColor: "#FFF6F1", color: "#872000" }}>
          <Typography sx={{ fontSize: "0.98rem", fontWeight: 700 }}>{error}</Typography>
        </Paper>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "repeat(4, minmax(0, 1fr))" },
          gap: 2.5
        }}
      >
        {columns.map((column) => {
          const statusMeta = getTaskStatusMeta(column.key);
          const columnTasks = groupedTasks.get(column.key) ?? [];

          return (
            <Paper
              key={column.key}
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: 4,
                backgroundColor: "#F9FCFF",
                boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <AutoAwesomeRoundedIcon sx={{ color: statusMeta.accentColor }} />
                <Typography sx={{ fontSize: "1rem", fontWeight: 900, color: "#00342B" }}>{column.label}</Typography>
                <Typography sx={{ ml: "auto", fontSize: "0.78rem", fontWeight: 900, color: "#93A6C3" }}>
                  {columnTasks.length}
                </Typography>
              </Stack>
              <Typography sx={{ mb: 2, fontSize: "0.84rem", lineHeight: 1.55, color: "#5A6A84" }}>
                {statusMeta.description}
              </Typography>

              <Stack spacing={1.8}>
                {columnTasks.map((task) => {
                  const taskStatusMeta = getTaskStatusMeta(task.status);

                  return (
                    <Paper
                      key={task.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        backgroundColor: "#FFFFFF",
                        border: "1px solid rgba(213,236,248,0.9)"
                      }}
                    >
                      <Typography sx={{ fontSize: "0.98rem", fontWeight: 800, color: "#00342B" }}>{task.title}</Typography>
                      <Typography sx={{ mt: 0.7, fontSize: "0.9rem", lineHeight: 1.6, color: "#42536D" }}>{task.description}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.1 }}>
                    <Box
                      sx={{
                        px: 1.25,
                        py: 0.45,
                        borderRadius: 1.2,
                        backgroundColor: taskStatusMeta.backgroundColor,
                        display: "inline-flex",
                        alignItems: "center"
                      }}
                    >
                      <Typography sx={{ fontSize: "0.68rem", fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: taskStatusMeta.color, whiteSpace: "nowrap" }}>
                        {taskStatusMeta.label}
                      </Typography>
                    </Box>
                        <Typography sx={{ fontSize: "0.76rem", color: "#7A869F" }}>
                          {taskStatusMeta.description}
                        </Typography>
                      </Stack>
                      <Typography sx={{ mt: 1, fontSize: "0.74rem", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "#93A6C3" }}>
                        {task.projectName ?? "Project"}{task.assignedTo ? ` • ${task.assignedTo}` : ""}
                      </Typography>
                      <Typography sx={{ mt: 0.45, fontSize: "0.8rem", color: "#5A6A84" }}>
                        {task.relatedDocuments.length > 0
                          ? `${task.relatedDocuments.length} related file${task.relatedDocuments.length === 1 ? "" : "s"} attached`
                          : "No related files linked yet"}
                      </Typography>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                        {nextStatusOptions[task.status as ProjectTask["status"]]?.map((nextStatus) => (
                          <ButtonBase
                            key={nextStatus}
                        disabled={updatingTaskId === task.id}
                        onClick={() => void handleUpdateStatus(task.id, nextStatus)}
                        sx={{
                          px: 1.6,
                          py: 0.85,
                          borderRadius: 2.2,
                          backgroundColor: getTaskTransitionMeta(nextStatus).backgroundColor,
                          color: getTaskTransitionMeta(nextStatus).color,
                          opacity: updatingTaskId === task.id ? 0.65 : 1
                        }}
                      >
                            <Typography sx={{ fontSize: "0.76rem", fontWeight: 800 }}>
                              {getTaskTransitionLabel(task.status, nextStatus)}
                            </Typography>
                          </ButtonBase>
                        ))}
                        <ButtonBase
                          onClick={() => navigate(`/app/tasks/${task.id}`)}
                          sx={{ px: 1.2, py: 0.85, borderRadius: 2.2, color: "#046B5E" }}
                        >
                          <Typography sx={{ fontSize: "0.76rem", fontWeight: 800 }}>Details</Typography>
                        </ButtonBase>
                        <ButtonBase
                          onClick={() => navigate(`/app/projects/${task.projectId}`)}
                          sx={{ px: 1.2, py: 0.85, borderRadius: 2.2, color: "#046B5E" }}
                        >
                          <Typography sx={{ fontSize: "0.76rem", fontWeight: 800 }}>Open Project</Typography>
                        </ButtonBase>
                      </Stack>
                    </Paper>
                  );
                })}

                {columnTasks.length === 0 ? (
                  <Typography sx={{ fontSize: "0.88rem", color: "#7A869F" }}>No tasks in this column.</Typography>
                ) : null}
              </Stack>
            </Paper>
          );
        })}
      </Box>

      <WorkspaceFooter />
    </Stack>
  );
}
