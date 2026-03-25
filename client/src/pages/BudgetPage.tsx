import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { WorkspaceFooter } from "../components/layout/WorkspaceFooter";
import { useChangeOrders } from "../hooks/useChangeOrders";
import { useProjects } from "../hooks/useProjects";
import type { Project } from "../types/project";
import { formatCurrency } from "../utils/formatCurrency";

type ProjectFilter = "all" | Project["status"];

function SummaryCard({
  label,
  value,
  icon,
  tone
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: "default" | "success" | "warning";
}) {
  const palette =
    tone === "success"
      ? { background: "#9DEFDE", color: "#046B5E" }
      : tone === "warning"
        ? { background: "#FFDBD1", color: "#872000" }
        : { background: "#D5ECF8", color: "#00342B" };

  return (
    <Paper
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
            {label}
          </Typography>
          <Typography
            sx={{
              mt: 1.4,
              fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
              fontSize: { xs: "2.2rem", md: "2.6rem" },
              fontWeight: 900,
              letterSpacing: -1.6,
              color: "#00342B"
            }}
          >
            {value}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2.5,
            display: "grid",
            placeItems: "center",
            backgroundColor: palette.background,
            color: palette.color,
            flexShrink: 0
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
}

export function BudgetPage() {
  const navigate = useNavigate();
  const { projects, error: projectError } = useProjects();
  const { changeOrders, error: changeOrderError } = useChangeOrders();
  const [filter, setFilter] = useState<ProjectFilter>("all");

  const impactByProject = useMemo(() => {
    const totals = new Map<string, number>();

    changeOrders.forEach((changeOrder) => {
      totals.set(changeOrder.projectId, (totals.get(changeOrder.projectId) ?? 0) + changeOrder.amount);
    });

    return totals;
  }, [changeOrders]);

  const filteredProjects = useMemo(
    () => projects.filter((project) => (filter === "all" ? true : project.status === filter)),
    [filter, projects]
  );

  const projectRows = useMemo(
    () =>
      filteredProjects
        .map((project) => {
          const impact = impactByProject.get(project.id) ?? 0;
          const ratio = project.contractValue > 0 ? (impact / project.contractValue) * 100 : 0;
          const pendingCount = changeOrders.filter(
            (changeOrder) => changeOrder.projectId === project.id && changeOrder.status === "pending_review"
          ).length;

          return {
            project,
            impact,
            ratio,
            pendingCount
          };
        })
        .sort((left, right) => right.ratio - left.ratio),
    [changeOrders, filteredProjects, impactByProject]
  );

  const totalContractValue = filteredProjects.reduce((total, project) => total + project.contractValue, 0);
  const totalExposure = projectRows.reduce((total, row) => total + row.impact, 0);
  const pendingExposure = changeOrders
    .filter((changeOrder) => changeOrder.status === "pending_review")
    .reduce((total, changeOrder) => total + changeOrder.amount, 0);
  const atRiskProjects = projectRows.filter((row) => row.ratio >= 3 || row.pendingCount >= 2).length;

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
            Commercial Control
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
            Budget Command
          </Typography>
          <Typography sx={{ mt: 2, fontSize: "1.08rem", lineHeight: 1.65, color: "#5A6A84" }}>
            Monitor contract health, active exposure, and approval risk across the live project portfolio.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap">
          {[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "on-hold", label: "On Hold" },
            { value: "completed", label: "Completed" }
          ].map((option) => {
            const active = filter === option.value;

            return (
              <ButtonBase
                key={option.value}
                onClick={() => setFilter(option.value as ProjectFilter)}
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
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
          gap: 2.5
        }}
      >
        <SummaryCard label="Portfolio Contract" value={formatCurrency(totalContractValue)} icon={<PaymentsRoundedIcon />} tone="default" />
        <SummaryCard label="Tracked Exposure" value={formatCurrency(totalExposure)} icon={<TrendingUpRoundedIcon />} tone="default" />
        <SummaryCard label="Pending Review Value" value={formatCurrency(pendingExposure)} icon={<WarningAmberRoundedIcon />} tone="warning" />
        <SummaryCard label="At-Risk Projects" value={String(atRiskProjects)} icon={<TrendingDownRoundedIcon />} tone="success" />
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
            Project Exposure Register
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
            <Typography sx={{ fontSize: "0.92rem", fontWeight: 800 }}>Open Pending Reviews</Typography>
          </ButtonBase>
        </Box>

        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 880 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr 1fr 0.8fr",
                px: 4,
                py: 2.2,
                backgroundColor: "rgba(230,246,255,0.56)"
              }}
            >
              {["Project", "Status", "Contract", "CO Impact", "Exposure", "Review"].map((label) => (
                <Typography
                  key={label}
                  sx={{
                    fontSize: "0.74rem",
                    fontWeight: 900,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "#93A6C3"
                  }}
                >
                  {label}
                </Typography>
              ))}
            </Box>

            {projectRows.map((row) => (
              <Box
                key={row.project.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1.2fr 1.2fr 1fr 0.8fr",
                  px: 4,
                  py: 2.8,
                  alignItems: "center",
                  borderBottom: "1px solid rgba(213,236,248,0.72)"
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>{row.project.name}</Typography>
                  <Typography sx={{ mt: 0.5, fontSize: "0.92rem", color: "#5A6A84" }}>
                    {row.project.location} • {row.project.code}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, color: "#42536D" }}>{row.project.status}</Typography>
                <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "#00342B" }}>
                  {formatCurrency(row.project.contractValue)}
                </Typography>
                <Typography sx={{ fontSize: "1rem", fontWeight: 700, color: row.impact > 0 ? "#00342B" : "#5A6A84" }}>
                  {formatCurrency(row.impact)}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 800,
                    color: row.ratio >= 3 ? "#872000" : row.ratio >= 1 ? "#00342B" : "#046B5E"
                  }}
                >
                  {row.ratio.toFixed(1)}%
                </Typography>
                <ButtonBase
                  onClick={() => navigate(`/app/change-orders?projectId=${row.project.id}`)}
                  sx={{
                    px: 1.8,
                    py: 1,
                    borderRadius: 2.2,
                    backgroundColor: "#D5ECF8",
                    color: "#00342B",
                    justifySelf: "start"
                  }}
                >
                  <Typography sx={{ fontSize: "0.86rem", fontWeight: 800 }}>Open</Typography>
                </ButtonBase>
              </Box>
            ))}
          </Box>
        </Box>
      </Paper>

      <WorkspaceFooter />
    </Stack>
  );
}
