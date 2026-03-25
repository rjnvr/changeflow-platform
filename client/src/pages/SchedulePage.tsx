import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import LanRoundedIcon from "@mui/icons-material/LanRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { WorkspaceFooter } from "../components/layout/WorkspaceFooter";
import { useChangeOrders } from "../hooks/useChangeOrders";
import { useProjects } from "../hooks/useProjects";
import type { Project } from "../types/project";
import { formatDate } from "../utils/formatDate";

type BoardFilter = "all" | "watch" | "blocked";

function computeMilestone(project: Project, pendingCount: number, index: number) {
  const nextMilestoneDate = new Date(project.updatedAt);
  nextMilestoneDate.setDate(nextMilestoneDate.getDate() + 7 + index * 3);

  const board = project.status === "on-hold" || pendingCount >= 2 ? "blocked" : pendingCount > 0 ? "watch" : "all";

  return {
    projectId: project.id,
    projectName: project.name,
    projectCode: project.code,
    location: project.location,
    pendingCount,
    board: board as BoardFilter,
    milestone: pendingCount >= 2 ? "Executive review gate" : pendingCount > 0 ? "Commercial coordination review" : "Scheduled field milestone",
    dueDate: nextMilestoneDate.toISOString()
  };
}

export function SchedulePage() {
  const navigate = useNavigate();
  const { projects, error: projectError } = useProjects();
  const { changeOrders, error: changeOrderError } = useChangeOrders();
  const [filter, setFilter] = useState<BoardFilter>("all");

  const scheduleRows = useMemo(
    () =>
      projects
        .map((project, index) => {
          const pendingCount = changeOrders.filter(
            (changeOrder) => changeOrder.projectId === project.id && changeOrder.status === "pending_review"
          ).length;

          return computeMilestone(project, pendingCount, index);
        })
        .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime()),
    [changeOrders, projects]
  );

  const visibleRows = scheduleRows.filter((row) => {
    if (filter === "all") {
      return true;
    }

    return row.board === filter;
  });

  const blockedCount = scheduleRows.filter((row) => row.board === "blocked").length;
  const watchCount = scheduleRows.filter((row) => row.board === "watch").length;

  return (
    <Stack spacing={4}>
      {projectError ? <Alert severity="warning">{projectError}</Alert> : null}
      {changeOrderError ? <Alert severity="warning">{changeOrderError}</Alert> : null}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 3,
          flexWrap: "wrap"
        }}
      >
        <Box sx={{ maxWidth: 760 }}>
          <Typography
            sx={{
              mb: 1,
              fontSize: "0.82rem",
              fontWeight: 800,
              letterSpacing: 2.2,
              textTransform: "uppercase",
              color: "#046B5E"
            }}
          >
            Delivery Planning
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
              fontSize: { xs: "3rem", md: "4.4rem" },
              fontWeight: 900,
              letterSpacing: -2.4,
              lineHeight: 0.95,
              color: "#00342B"
            }}
          >
            Schedule Board
          </Typography>
          <Typography sx={{ mt: 2, fontSize: "1.08rem", lineHeight: 1.65, color: "#5A6A84" }}>
            Tie delivery milestones to the commercial change pipeline so field execution and approvals stay aligned.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap">
          {[
            { value: "all", label: "All Milestones" },
            { value: "watch", label: `Needs Watch (${watchCount})` },
            { value: "blocked", label: `Blocked (${blockedCount})` }
          ].map((option) => {
            const active = filter === option.value;

            return (
              <ButtonBase
                key={option.value}
                onClick={() => setFilter(option.value as BoardFilter)}
                sx={{
                  px: 2.4,
                  py: 1.2,
                  borderRadius: 999,
                  backgroundColor: active ? "#00342B" : "#D5ECF8",
                  color: active ? "#FFFFFF" : "#00342B"
                }}
              >
                <Typography sx={{ fontSize: "0.92rem", fontWeight: 800 }}>{option.label}</Typography>
              </ButtonBase>
            );
          })}
        </Stack>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          gap: 2.5
        }}
      >
        {[
          { label: "Upcoming Milestones", value: String(scheduleRows.length), icon: <CalendarMonthRoundedIcon /> },
          { label: "Needs Watch", value: String(watchCount), icon: <PendingActionsRoundedIcon /> },
          { label: "Blocked by Variance", value: String(blockedCount), icon: <EventBusyRoundedIcon /> }
        ].map((card) => (
          <Paper
            key={card.label}
            elevation={0}
            sx={{
              p: 3.2,
              borderRadius: 4,
              backgroundColor: "#FFFFFF",
              boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
            }}
          >
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Box>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: 900,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "#93A6C3"
                  }}
                >
                  {card.label}
                </Typography>
                <Typography
                  sx={{
                    mt: 1.4,
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: "2.5rem",
                    fontWeight: 900,
                    letterSpacing: -1.6,
                    color: "#00342B"
                  }}
                >
                  {card.value}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2.5,
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: "#D5ECF8",
                  color: "#00342B"
                }}
              >
                {card.icon}
              </Box>
            </Stack>
          </Paper>
        ))}
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
        }}
      >
        <Box
          sx={{
            px: { xs: 3, md: 4 },
            py: 3,
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
            backgroundColor: "#E6F6FF"
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
              fontSize: "2rem",
              fontWeight: 800,
              letterSpacing: -1.2,
              color: "#00342B"
            }}
          >
            Milestone Sequence
          </Typography>
          <ButtonBase
            onClick={() => navigate("/app/change-orders?status=pending")}
            sx={{
              px: 2.4,
              py: 1.2,
              borderRadius: 2.5,
              backgroundColor: "#D5ECF8",
              color: "#00342B"
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <LanRoundedIcon sx={{ fontSize: 18 }} />
              <Typography sx={{ fontSize: "0.92rem", fontWeight: 800 }}>Review Pending COs</Typography>
            </Stack>
          </ButtonBase>
        </Box>

        <Stack spacing={0}>
          {visibleRows.map((row) => (
            <Box
              key={row.projectId}
              sx={{
                px: { xs: 3, md: 4 },
                py: 3,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
                borderBottom: "1px solid rgba(213,236,248,0.72)"
              }}
            >
              <Box>
                <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>{row.projectName}</Typography>
                <Typography sx={{ mt: 0.6, fontSize: "0.92rem", color: "#5A6A84" }}>
                  {row.location} • {row.milestone}
                </Typography>
              </Box>

              <Stack direction="row" spacing={2.2} alignItems="center" useFlexGap flexWrap="wrap">
                <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, color: "#42536D" }}>
                  Due {formatDate(row.dueDate)}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.92rem",
                    fontWeight: 800,
                    color: row.board === "blocked" ? "#872000" : row.board === "watch" ? "#00342B" : "#046B5E"
                  }}
                >
                  {row.pendingCount} pending change order{row.pendingCount === 1 ? "" : "s"}
                </Typography>
                <ButtonBase
                  onClick={() => navigate(`/app/projects/${row.projectId}`)}
                  sx={{
                    px: 1.8,
                    py: 1,
                    borderRadius: 2.2,
                    backgroundColor: "#D5ECF8",
                    color: "#00342B"
                  }}
                >
                  <Typography sx={{ fontSize: "0.86rem", fontWeight: 800 }}>Open Project</Typography>
                </ButtonBase>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Paper>

      <WorkspaceFooter />
    </Stack>
  );
}
