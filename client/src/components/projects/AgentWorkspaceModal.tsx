import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { updateProjectRiskFlagStatus, updateProjectTaskStatus } from "../../api/projects";
import { useFeedbackContext } from "../../context/FeedbackContext";
import type { AgentMemoryEntry, AgentRun, DocumentProcessingRun, ProjectRiskFlag, ProjectTask } from "../../types/project";
import { formatDateTime } from "../../utils/formatDate";

interface AgentWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  tasks: ProjectTask[];
  riskFlags: ProjectRiskFlag[];
  processingRuns: DocumentProcessingRun[];
  agentRuns: AgentRun[];
  memoryEntries: AgentMemoryEntry[];
}

export function AgentWorkspaceModal({
  open,
  onClose,
  tasks,
  riskFlags,
  processingRuns,
  agentRuns,
  memoryEntries
}: AgentWorkspaceModalProps) {
  const navigate = useNavigate();
  const { showToast } = useFeedbackContext();
  const [localTasks, setLocalTasks] = useState(tasks);
  const [localRiskFlags, setLocalRiskFlags] = useState(riskFlags);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    setLocalRiskFlags(riskFlags);
  }, [riskFlags]);

  async function handleTaskStatusUpdate(taskId: string, status: "suggested" | "open" | "in_progress" | "done") {
    setUpdatingItemId(taskId);

    try {
      const updatedTask = await updateProjectTaskStatus(taskId, { status });
      setLocalTasks((currentTasks) => currentTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
      showToast({
        message: status === "open" ? "Task added to the board." : `Task moved to ${status.replace("_", " ")}.`,
        severity: "success"
      });
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function handleRiskFlagStatusUpdate(riskFlagId: string, status: "open" | "reviewed" | "mitigated") {
    setUpdatingItemId(riskFlagId);

    try {
      const updatedRiskFlag = await updateProjectRiskFlagStatus(riskFlagId, { status });
      setLocalRiskFlags((currentRiskFlags) =>
        currentRiskFlags.map((riskFlag) => (riskFlag.id === updatedRiskFlag.id ? updatedRiskFlag : riskFlag))
      );
      showToast({
        message: `Risk flag marked ${status}.`,
        severity: "success"
      });
    } finally {
      setUpdatingItemId(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} sx={{ zIndex: 1500 }}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, md: 4 },
          backgroundColor: "rgba(0,52,43,0.18)",
          backdropFilter: "blur(8px)"
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 1080,
            maxHeight: "90vh",
            overflow: "hidden",
            borderRadius: 5,
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
              alignItems: "flex-start",
              gap: 2,
              borderBottom: "1px solid rgba(191,201,196,0.18)"
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontSize: { xs: "2rem", md: "2.8rem" },
                  fontWeight: 900,
                  letterSpacing: -1.8,
                  color: "#00342B"
                }}
              >
                Agent Workspace
              </Typography>
              <Typography sx={{ mt: 1, fontSize: "1rem", color: "#42536D" }}>
                Review generated tasks, risk flags, and recent document-processing runs.
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
              maxHeight: "calc(90vh - 112px)",
              overflowY: "auto",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", xl: "repeat(4, minmax(0, 1fr))" },
              gap: 3
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AutoAwesomeRoundedIcon sx={{ color: "#046B5E" }} />
                <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: "#00342B" }}>Tasks</Typography>
              </Stack>
              {localTasks.length > 0 ? (
                localTasks.map((task) => (
                  <Paper key={task.id} elevation={0} sx={{ p: 2.2, borderRadius: 3, backgroundColor: "#F9FCFF", border: "1px solid rgba(213,236,248,0.9)" }}>
                    <Typography sx={{ fontSize: "0.98rem", fontWeight: 800, color: "#00342B" }}>{task.title}</Typography>
                    <Typography sx={{ mt: 0.8, fontSize: "0.9rem", lineHeight: 1.6, color: "#42536D" }}>{task.description}</Typography>
                    <Typography sx={{ mt: 1, fontSize: "0.74rem", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "#93A6C3" }}>
                      {task.status}{task.assignedTo ? ` • ${task.assignedTo}` : ""}
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.3 }}>
                      {task.status === "suggested" ? (
                        <ButtonBase
                          disabled={updatingItemId === task.id}
                          onClick={() => void handleTaskStatusUpdate(task.id, "open")}
                          sx={{ px: 1.4, py: 0.85, borderRadius: 2.2, backgroundColor: "#E6F6FF", color: "#00342B" }}
                        >
                          <Typography sx={{ fontSize: "0.74rem", fontWeight: 800 }}>Add to Task Board</Typography>
                        </ButtonBase>
                      ) : null}
                      <ButtonBase
                        onClick={() => {
                          onClose();
                          navigate(`/app/tasks/${task.id}`);
                        }}
                        sx={{ px: 1.2, py: 0.85, borderRadius: 2.2, color: "#046B5E" }}
                      >
                        <Typography sx={{ fontSize: "0.74rem", fontWeight: 800 }}>View Details</Typography>
                      </ButtonBase>
                      <ButtonBase
                        onClick={() => {
                          onClose();
                          navigate("/app/tasks");
                        }}
                        sx={{ px: 1.2, py: 0.85, borderRadius: 2.2, color: "#046B5E" }}
                      >
                        <Typography sx={{ fontSize: "0.74rem", fontWeight: 800 }}>Open Board</Typography>
                      </ButtonBase>
                    </Stack>
                  </Paper>
                ))
              ) : (
                <Typography sx={{ fontSize: "0.94rem", color: "#5A6A84" }}>No agent-created tasks yet.</Typography>
              )}
            </Stack>

            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <WarningAmberRoundedIcon sx={{ color: "#7A1E08" }} />
                <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: "#00342B" }}>Risk Flags</Typography>
              </Stack>
              {localRiskFlags.length > 0 ? (
                localRiskFlags.map((riskFlag) => (
                  <Paper key={riskFlag.id} elevation={0} sx={{ p: 2.2, borderRadius: 3, backgroundColor: "#FFF6F1", border: "1px solid rgba(255,219,209,0.95)" }}>
                    <Typography sx={{ fontSize: "0.98rem", fontWeight: 800, color: "#7A1E08" }}>{riskFlag.title}</Typography>
                    <Typography sx={{ mt: 0.8, fontSize: "0.9rem", lineHeight: 1.6, color: "#6B412C" }}>{riskFlag.description}</Typography>
                    <Typography sx={{ mt: 1, fontSize: "0.74rem", fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "#872000" }}>
                      {riskFlag.level} • {riskFlag.status}
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.3 }}>
                      {riskFlag.status !== "reviewed" ? (
                        <ButtonBase
                          disabled={updatingItemId === riskFlag.id}
                          onClick={() => void handleRiskFlagStatusUpdate(riskFlag.id, "reviewed")}
                          sx={{ px: 1.4, py: 0.85, borderRadius: 2.2, backgroundColor: "#FFDBD1", color: "#872000" }}
                        >
                          <Typography sx={{ fontSize: "0.74rem", fontWeight: 800 }}>Mark Reviewed</Typography>
                        </ButtonBase>
                      ) : null}
                      {riskFlag.status !== "mitigated" ? (
                        <ButtonBase
                          disabled={updatingItemId === riskFlag.id}
                          onClick={() => void handleRiskFlagStatusUpdate(riskFlag.id, "mitigated")}
                          sx={{ px: 1.4, py: 0.85, borderRadius: 2.2, backgroundColor: "#9DEFDE", color: "#0F6F62" }}
                        >
                          <Typography sx={{ fontSize: "0.74rem", fontWeight: 800 }}>Mark Mitigated</Typography>
                        </ButtonBase>
                      ) : null}
                      <ButtonBase
                        onClick={() => {
                          onClose();
                          navigate(`/app/risk-flags/${riskFlag.id}`);
                        }}
                        sx={{ px: 1.2, py: 0.85, borderRadius: 2.2, color: "#872000" }}
                      >
                        <Typography sx={{ fontSize: "0.74rem", fontWeight: 800 }}>View Details</Typography>
                      </ButtonBase>
                    </Stack>
                  </Paper>
                ))
              ) : (
                <Typography sx={{ fontSize: "0.94rem", color: "#5A6A84" }}>No risk flags generated yet.</Typography>
              )}
            </Stack>

            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AutorenewRoundedIcon sx={{ color: "#046B5E" }} />
                <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: "#00342B" }}>Processing Runs</Typography>
              </Stack>
              {processingRuns.length > 0 ? (
                processingRuns.map((run) => (
                  <Paper key={run.id} elevation={0} sx={{ p: 2.2, borderRadius: 3, backgroundColor: "#FFFFFF", border: "1px solid rgba(213,236,248,0.9)" }}>
                    <Typography sx={{ fontSize: "0.98rem", fontWeight: 800, color: "#00342B" }}>
                      {run.status} • {run.extractionMethod.replace(/_/g, " ")}
                    </Typography>
                    <Typography sx={{ mt: 0.7, fontSize: "0.88rem", color: "#5A6A84" }}>
                      {formatDateTime(run.updatedAt)}
                    </Typography>
                    {run.errorMessage ? (
                      <Typography sx={{ mt: 0.9, fontSize: "0.86rem", color: "#872000" }}>{run.errorMessage}</Typography>
                    ) : null}
                  </Paper>
                ))
              ) : (
                <Typography sx={{ fontSize: "0.94rem", color: "#5A6A84" }}>No document-processing runs recorded yet.</Typography>
              )}
            </Stack>

            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AutoAwesomeRoundedIcon sx={{ color: "#046B5E" }} />
                <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: "#00342B" }}>Agent Run History</Typography>
              </Stack>
              {agentRuns.length > 0 ? (
                agentRuns.slice(0, 5).map((run) => (
                  <Paper key={run.id} elevation={0} sx={{ p: 2.2, borderRadius: 3, backgroundColor: "#FFFFFF", border: "1px solid rgba(213,236,248,0.9)" }}>
                    <Typography sx={{ fontSize: "0.96rem", fontWeight: 800, color: "#00342B" }}>
                      {run.trigger.replace(/_/g, " ")} • {run.status}
                    </Typography>
                    <Typography sx={{ mt: 0.6, fontSize: "0.84rem", color: "#5A6A84" }}>
                      {formatDateTime(run.updatedAt)}{run.model ? ` • ${run.model}` : ""}
                    </Typography>
                    {run.summary ? (
                      <Typography sx={{ mt: 0.8, fontSize: "0.88rem", lineHeight: 1.6, color: "#42536D" }}>
                        {run.summary}
                      </Typography>
                    ) : null}
                    {run.steps.length > 0 ? (
                      <Stack spacing={0.8} sx={{ mt: 1.2 }}>
                        {run.steps.slice(0, 4).map((step) => (
                          <Box key={step.id}>
                            <Typography sx={{ fontSize: "0.75rem", fontWeight: 900, letterSpacing: 1.1, textTransform: "uppercase", color: "#93A6C3" }}>
                              {step.stepType} • {step.status}
                            </Typography>
                            <Typography sx={{ mt: 0.2, fontSize: "0.82rem", fontWeight: 700, color: "#00342B" }}>
                              {step.title}
                            </Typography>
                            {step.details ? (
                              <Typography sx={{ mt: 0.2, fontSize: "0.8rem", lineHeight: 1.55, color: "#5A6A84" }}>
                                {step.details}
                              </Typography>
                            ) : null}
                          </Box>
                        ))}
                      </Stack>
                    ) : null}
                  </Paper>
                ))
              ) : (
                <Typography sx={{ fontSize: "0.94rem", color: "#5A6A84" }}>No agent runs have been recorded yet.</Typography>
              )}
            </Stack>

            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <WarningAmberRoundedIcon sx={{ color: "#046B5E" }} />
                <Typography sx={{ fontSize: "1.2rem", fontWeight: 900, color: "#00342B" }}>Project Memory</Typography>
              </Stack>
              {memoryEntries.length > 0 ? (
                memoryEntries.slice(0, 6).map((entry) => (
                  <Paper key={entry.id} elevation={0} sx={{ p: 2.2, borderRadius: 3, backgroundColor: "#F9FCFF", border: "1px solid rgba(213,236,248,0.9)" }}>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 900, letterSpacing: 1.1, textTransform: "uppercase", color: "#93A6C3" }}>
                      {entry.kind.replace(/_/g, " ")}
                    </Typography>
                    <Typography sx={{ mt: 0.35, fontSize: "0.9rem", fontWeight: 800, color: "#00342B" }}>{entry.title}</Typography>
                    <Typography sx={{ mt: 0.55, fontSize: "0.84rem", lineHeight: 1.6, color: "#42536D" }}>{entry.content}</Typography>
                    <Typography sx={{ mt: 0.8, fontSize: "0.76rem", color: "#7A869F" }}>{formatDateTime(entry.updatedAt)}</Typography>
                  </Paper>
                ))
              ) : (
                <Typography sx={{ fontSize: "0.94rem", color: "#5A6A84" }}>No reusable project memory has been stored yet.</Typography>
              )}
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Modal>
  );
}
