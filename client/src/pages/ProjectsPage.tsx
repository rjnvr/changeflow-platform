import { useEffect, useMemo, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Checkbox from "@mui/material/Checkbox";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";

import { BulkProjectActionsModal } from "../components/projects/BulkProjectActionsModal";
import { CreateProjectModal } from "../components/projects/CreateProjectModal";
import { useAuthContext } from "../context/AuthContext";
import { useProjects } from "../hooks/useProjects";
import type { Project } from "../types/project";
import { formatCurrency } from "../utils/formatCurrency";

type PortfolioTone = "success" | "danger" | "neutral";

interface ProjectPresentation {
  sector: string;
  client: string;
  label?: string;
  labelTone?: PortfolioTone;
  health?: string;
  progress?: number;
  note?: string;
  variance?: string;
  varianceTone?: "danger" | "success" | "warning";
  tasks?: readonly string[];
  compliance?: "PASSED" | "PENDING";
  complianceTone?: "success" | "danger";
}

const projectPresentationMap: Record<string, ProjectPresentation> = {
  "CF-SR-2024": {
    sector: "Residential",
    client: "Westshore Capital",
    label: "ON TRACK",
    labelTone: "success",
    health: "98",
    progress: 85,
    note: "85% Budget Utilization",
    variance: "+0.8%",
    varianceTone: "success",
    tasks: ["JS", "AW", "+4"],
    compliance: "PASSED",
    complianceTone: "success"
  },
  "HLH-002": {
    sector: "Industrial",
    client: "Port Authority",
    label: "CRITICAL VARIANCE",
    labelTone: "danger",
    health: "42",
    progress: 100,
    note: "105% Over Initial Estimate",
    variance: "+4.2%",
    varianceTone: "danger",
    tasks: ["MK", "RS", "+3"],
    compliance: "PENDING",
    complianceTone: "danger"
  },
  "PTP-003": {
    sector: "Commercial",
    client: "Nexa Tech Fund",
    label: "DRAFT",
    labelTone: "neutral",
    health: "--",
    progress: 10,
    note: "Initial Setup Phase",
    variance: "-0.4%",
    varianceTone: "success",
    tasks: ["AL", "BT"],
    compliance: "PASSED",
    complianceTone: "success"
  },
  "OCB-004": {
    sector: "Infrastructure",
    client: "State DOT",
    variance: "+4.2%",
    varianceTone: "danger",
    tasks: ["JB", "MK", "+3"],
    compliance: "PASSED",
    complianceTone: "success"
  },
  "NLR-005": {
    sector: "Public Works",
    client: "City of Portland",
    variance: "-0.8%",
    varianceTone: "success",
    tasks: ["AL", "BT"],
    compliance: "PASSED",
    complianceTone: "success"
  },
  "ETB-006": {
    sector: "Commercial",
    client: "Vanguard Dev Group",
    variance: "+1.5%",
    varianceTone: "warning",
    tasks: ["RS", "NM", "WP", "+12"],
    compliance: "PENDING",
    complianceTone: "danger"
  }
};

function StatusPill({
  label,
  tone
}: {
  label: string;
  tone: PortfolioTone;
}) {
  const styles = {
    success: {
      backgroundColor: "#9DEFDE",
      color: "#0F6F62",
      dotColor: "#046B5E"
    },
    danger: {
      backgroundColor: "#FFDBD1",
      color: "#872000",
      dotColor: "#5B1300"
    },
    neutral: {
      backgroundColor: "#CFE6F2",
      color: "#3F4945",
      dotColor: "#707975"
    }
  }[tone];

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.9,
        px: 1.5,
        py: 0.5,
        borderRadius: 999,
        backgroundColor: styles.backgroundColor,
        color: styles.color
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: styles.dotColor
        }}
      />
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: 0.2 }}>{label}</Typography>
    </Box>
  );
}

function CompliancePill({
  label,
  tone
}: {
  label: string;
  tone: "success" | "danger";
}) {
  const styles =
    tone === "success"
      ? { backgroundColor: "#9DEFDE", color: "#0F6F62" }
      : { backgroundColor: "#FFDBD1", color: "#872000" };

  return (
    <Box
      sx={{
        display: "inline-flex",
        px: 1.4,
        py: 0.7,
        borderRadius: 1.4,
        backgroundColor: styles.backgroundColor,
        color: styles.color
      }}
    >
      <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: 0.4 }}>{label}</Typography>
    </Box>
  );
}

function TaskAvatars({ tasks }: { tasks: readonly string[] }) {
  const palette = ["#E2E8F0", "#00342B", "#046B5E", "#CFE6F2"];

  return (
    <Stack direction="row" spacing={-0.8}>
      {tasks.map((task, index) => {
        const dark = index % 4 === 1 || index % 4 === 2;

        return (
          <Box
            key={`${task}-${index}`}
            sx={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              backgroundColor: palette[index % palette.length],
              color: dark ? "#FFFFFF" : "#00342B",
              outline: "2px solid #FFFFFF",
              fontSize: "0.72rem",
              fontWeight: 800
            }}
          >
            {task}
          </Box>
        );
      })}
    </Stack>
  );
}

function featuredProjects(projects: Project[]) {
  const featuredOrder = ["CF-SR-2024", "HLH-002", "PTP-003"];
  const sorted = [...projects].sort((left, right) => featuredOrder.indexOf(left.code) - featuredOrder.indexOf(right.code));

  return sorted.filter((project) => featuredOrder.includes(project.code)).slice(0, 3);
}

function toCsvValue(value: string | number) {
  const normalized = String(value).replace(/"/g, "\"\"");
  return `"${normalized}"`;
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthContext();
  const { projects, error, refresh } = useProjects();
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const pageSize = 10;
  const searchQuery = searchParams.get("search")?.trim().toLowerCase() ?? "";

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        if (!searchQuery) {
          return true;
        }

        const presentation = projectPresentationMap[project.code];

        return (
          project.name.toLowerCase().includes(searchQuery) ||
          project.code.toLowerCase().includes(searchQuery) ||
          project.location.toLowerCase().includes(searchQuery) ||
          presentation?.client.toLowerCase().includes(searchQuery) ||
          presentation?.sector.toLowerCase().includes(searchQuery)
        );
      }),
    [projects, searchQuery]
  );

  const featured = useMemo(() => featuredProjects(filteredProjects), [filteredProjects]);
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedProjects = useMemo(
    () => filteredProjects.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filteredProjects]
  );
  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, index) => index + 1), [totalPages]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setSelectedProjectIds((current) => {
      const visibleProjectIds = new Set(filteredProjects.map((project) => project.id));
      const next = current.filter((projectId) => visibleProjectIds.has(projectId));

      if (next.length === current.length && next.every((projectId, index) => projectId === current[index])) {
        return current;
      }

      return next;
    });
  }, [filteredProjects]);

  function exportProjectsCsv() {
    const rows = projects.map((project) => {
      const presentation = projectPresentationMap[project.code];

      return [
        project.name,
        project.code,
        project.location,
        project.status,
        String(project.contractValue),
        presentation?.client ?? "Regional Portfolio",
        presentation?.variance ?? "0.0%",
        presentation?.compliance ?? "PASSED"
      ];
    });

    const csv = [
      ["Project Name", "Code", "Location", "Status", "Contract Value", "Client", "Variance", "Compliance"],
      ...rows
    ]
      .map((row) => row.map(toCsvValue).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "changeflow-projects.csv";
    link.click();
    URL.revokeObjectURL(url);

    setMessage("Project inventory exported as CSV.");
  }

  function toggleProjectSelection(projectId: string) {
    setSelectedProjectIds((current) =>
      current.includes(projectId) ? current.filter((item) => item !== projectId) : [...current, projectId]
    );
  }

  function togglePageSelection() {
    const pageProjectIds = pagedProjects.map((project) => project.id);
    const allSelected = pageProjectIds.every((projectId) => selectedProjectIds.includes(projectId));

    setSelectedProjectIds((current) => {
      if (allSelected) {
        return current.filter((projectId) => !pageProjectIds.includes(projectId));
      }

      return [...new Set([...current, ...pageProjectIds])];
    });
  }

  return (
    <Stack spacing={4}>
      {message ? <Alert severity="info">{message}</Alert> : null}
      {error ? <Alert severity="warning">{error}</Alert> : null}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 3,
          flexWrap: "wrap"
        }}
      >
        <Box>
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
            Executive Portfolio
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
              fontSize: { xs: "3rem", md: "4.1rem" },
              fontWeight: 900,
              letterSpacing: -2.4,
              lineHeight: 0.95,
              color: "#00342B"
            }}
          >
            Portfolio Overview
          </Typography>
          <Typography
            sx={{
              mt: 2,
              maxWidth: 760,
              fontSize: "1.08rem",
              lineHeight: 1.6,
              color: "#5A6A84"
            }}
          >
            Centralized visibility into {projects.length} active construction projects, tracking financial
            variances and operational health in real-time.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
          <Paper
            elevation={0}
            sx={{
              px: 2.2,
              py: 1.4,
              borderRadius: 2.5,
              backgroundColor: "#D5ECF8",
              color: "#00342B"
            }}
          >
            <Stack direction="row" spacing={1.2} alignItems="center">
              <FilterListRoundedIcon sx={{ fontSize: 20 }} />
              <Typography sx={{ fontSize: "1rem", fontWeight: 700 }}>Filter</Typography>
            </Stack>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              px: 2.2,
              py: 1.4,
              borderRadius: 2.5,
              backgroundColor: "#D5ECF8",
              color: "#00342B"
            }}
          >
            <Stack direction="row" spacing={1.2} alignItems="center">
              <CalendarTodayRoundedIcon sx={{ fontSize: 20 }} />
              <Typography sx={{ fontSize: "1rem", fontWeight: 700 }}>Q1 2026</Typography>
            </Stack>
          </Paper>
          <ButtonBase
            onClick={() => setCreateProjectOpen(true)}
            sx={{
              px: 2.2,
              py: 1.4,
              borderRadius: 2.5,
              backgroundColor: "#00342B",
              color: "#FFFFFF",
              boxShadow: "0 12px 24px rgba(7,30,39,0.08)"
            }}
          >
            <Stack direction="row" spacing={1.1} alignItems="center">
              <AddRoundedIcon sx={{ fontSize: 20 }} />
              <Typography sx={{ fontSize: "1rem", fontWeight: 800 }}>New Project</Typography>
            </Stack>
          </ButtonBase>
        </Stack>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" },
          gap: 2.5
        }}
      >
        {featured.map((project) => {
          const presentation = projectPresentationMap[project.code];

          return (
            <Paper
              key={project.id}
              elevation={0}
              onClick={() => navigate(`/app/projects/${project.id}`)}
              sx={{
                p: 3.5,
                borderRadius: 4,
                cursor: "pointer",
                backgroundColor: "#FFFFFF",
                boxShadow: "0 12px 32px rgba(7,30,39,0.04)",
                transition: "transform 180ms ease, box-shadow 180ms ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 18px 36px rgba(7,30,39,0.08)"
                }
              }}
            >
              {presentation?.label && presentation.labelTone ? (
                <StatusPill label={presentation.label} tone={presentation.labelTone} />
              ) : null}

              <Typography
                sx={{
                  mt: 2,
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontSize: "1.95rem",
                  fontWeight: 700,
                  letterSpacing: -1.2,
                  color: "#00342B"
                }}
              >
                {project.name}
              </Typography>

              <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 1 }}>
                <LocationOnRoundedIcon sx={{ fontSize: 16, color: "#6B7A90" }} />
                <Typography sx={{ fontSize: "0.98rem", color: "#6B7A90" }}>{project.location}</Typography>
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 2,
                  mt: 4.5,
                  mb: 4
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      color: "#93A6C3"
                    }}
                  >
                    Contract Value
                  </Typography>
                  <Typography
                    sx={{
                      mt: 1,
                      fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                      fontSize: "2rem",
                      fontWeight: 700,
                      letterSpacing: -1.1,
                      color: presentation?.labelTone === "danger" ? "#5B1300" : "#00342B"
                    }}
                  >
                    {formatCurrency(project.contractValue)}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      color: "#93A6C3"
                    }}
                  >
                    Health Score
                  </Typography>
                  <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mt: 1 }}>
                    <Typography
                      sx={{
                        fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                        fontSize: "2rem",
                        fontWeight: 700,
                        letterSpacing: -1.1,
                        color: presentation?.labelTone === "danger" ? "#5B1300" : "#00342B"
                      }}
                    >
                      {presentation?.health ?? "94"}
                    </Typography>
                    {presentation?.health && presentation.health !== "--" ? (
                      presentation.labelTone === "danger" ? (
                        <WarningAmberRoundedIcon sx={{ fontSize: 20, color: "#5B1300" }} />
                      ) : (
                        <FavoriteRoundedIcon sx={{ fontSize: 18, color: "#046B5E" }} />
                      )
                    ) : null}
                  </Stack>
                </Box>
              </Box>

              <Box sx={{ width: "100%", height: 8, borderRadius: 999, backgroundColor: "#D5ECF8", overflow: "hidden" }}>
                <Box
                  sx={{
                    width: `${presentation?.progress ?? 64}%`,
                    height: "100%",
                    borderRadius: 999,
                    backgroundColor:
                      presentation?.labelTone === "danger"
                        ? "#5B1300"
                        : presentation?.labelTone === "neutral"
                          ? "#707975"
                          : "#046B5E"
                  }}
                />
              </Box>
              <Typography
                sx={{
                  mt: 1.4,
                  fontSize: "0.82rem",
                  fontWeight: presentation?.labelTone === "danger" ? 800 : 500,
                  color: presentation?.labelTone === "danger" ? "#5B1300" : "#93A6C3"
                }}
              >
                {presentation?.note ?? `${presentation?.sector ?? "Project"} in active portfolio review`}
              </Typography>
            </Paper>
          );
        })}
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
        <Box
          sx={{
            px: { xs: 3, md: 5 },
            py: 3.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
            backgroundColor: "#E6F6FF"
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
              fontSize: "2rem",
              fontWeight: 700,
              letterSpacing: -1.2,
              color: "#00342B"
            }}
          >
            All Projects Inventory
          </Typography>

          <Stack direction="row" spacing={3} useFlexGap flexWrap="wrap">
            <ButtonLikeText label="Export CSV" onClick={exportProjectsCsv} />
            <ButtonLikeText
              label="Bulk Actions"
              onClick={() => {
                if (selectedProjectIds.length === 0) {
                  setSelectedProjectIds(pagedProjects.map((project) => project.id));
                }
                setBulkModalOpen(true);
              }}
            />
          </Stack>
        </Box>

        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 1040 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "0.42fr 2.2fr 1.5fr 1.6fr 1.2fr 1.5fr 1fr 0.2fr",
                px: 5,
                py: 3,
                backgroundColor: "rgba(230,246,255,0.56)"
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Checkbox
                  checked={pagedProjects.length > 0 && pagedProjects.every((project) => selectedProjectIds.includes(project.id))}
                  indeterminate={pagedProjects.some((project) => selectedProjectIds.includes(project.id)) && !pagedProjects.every((project) => selectedProjectIds.includes(project.id))}
                  onChange={togglePageSelection}
                  sx={{ color: "#93A6C3" }}
                />
              </Box>
              {["Project Name", "Client", "Contract Value", "CO Variance", "Active Tasks", "Compliance", ""].map((item) => (
                <Typography
                  key={item}
                  sx={{
                    fontSize: "0.72rem",
                    fontWeight: 900,
                    letterSpacing: 2.1,
                    textTransform: "uppercase",
                    color: "#93A6C3"
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Box>

            {pagedProjects.map((project, index) => {
              const presentation = projectPresentationMap[project.code] ?? {
                sector: "Construction",
                client: "Regional Portfolio",
                variance: "+1.1%",
                varianceTone: "warning" as const,
                tasks: ["PM", "QS", "+2"] as const,
                compliance: "PASSED" as const,
                complianceTone: "success" as const
              };

              return (
                <Box
                  key={project.id}
                  onClick={() => navigate(`/app/projects/${project.id}`)}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "0.42fr 2.2fr 1.5fr 1.6fr 1.2fr 1.5fr 1fr 0.2fr",
                    alignItems: "center",
                    px: 5,
                    py: 3.5,
                    cursor: "pointer",
                    backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F9FCFF",
                    transition: "background-color 160ms ease",
                    "&:hover": {
                      backgroundColor: "#F3FAFF"
                    }
                  }}
                >
                  <Box
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <Checkbox
                      checked={selectedProjectIds.includes(project.id)}
                      onChange={() => toggleProjectSelection(project.id)}
                      sx={{ color: "#93A6C3" }}
                    />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>{project.name}</Typography>
                    <Typography sx={{ mt: 0.6, fontSize: "0.92rem", color: "#6B7A90" }}>
                      {presentation.sector} • ID: {project.code}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: "1rem", color: "#071E27" }}>{presentation.client}</Typography>
                  <Typography
                    sx={{
                      fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                      fontSize: "1.15rem",
                      fontWeight: 700,
                      color: "#00342B"
                    }}
                  >
                    {formatCurrency(project.contractValue)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "1rem",
                      fontWeight: 800,
                      color:
                        presentation.varianceTone === "danger"
                          ? "#5B1300"
                          : presentation.varianceTone === "warning"
                            ? "#00342B"
                            : "#046B5E"
                    }}
                  >
                    {presentation.variance}
                  </Typography>
                  <TaskAvatars tasks={presentation.tasks ?? ["PM", "+2"]} />
                  <CompliancePill
                    label={presentation.compliance ?? "PASSED"}
                    tone={presentation.complianceTone ?? "success"}
                  />
                  <MoreHorizRoundedIcon sx={{ color: "#93A6C3" }} />
                </Box>
              );
            })}

            <Box
              sx={{
                px: 5,
                py: 2.8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
                backgroundColor: "#E6F6FF"
              }}
            >
              <Typography sx={{ fontSize: "0.95rem", color: "#5A6A84" }}>
                Showing {filteredProjects.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, filteredProjects.length)} of {filteredProjects.length} projects
              </Typography>
              <Stack direction="row" spacing={1.4} alignItems="center" useFlexGap flexWrap="wrap">
                {selectedProjectIds.length > 0 ? (
                  <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "#00342B" }}>
                    {selectedProjectIds.length} selected
                  </Typography>
                ) : null}
                <ButtonLikePage
                  active={false}
                  disabled={currentPage === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  label="‹"
                />
                {pageNumbers.map((pageNumber) => (
                  <ButtonLikePage
                    key={pageNumber}
                    active={currentPage === pageNumber}
                    onClick={() => setPage(pageNumber)}
                    label={String(pageNumber)}
                  />
                ))}
                <ButtonLikePage
                  active={false}
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  label="›"
                />
              </Stack>
            </Box>
          </Box>
        </Box>
      </Paper>

      <BulkProjectActionsModal
        open={bulkModalOpen}
        projectIds={selectedProjectIds}
        onClose={() => setBulkModalOpen(false)}
        onApplied={async () => {
          await refresh();
          setSelectedProjectIds([]);
          setMessage("Bulk project status update applied across the selected projects.");
        }}
      />
      {user ? (
        <CreateProjectModal
          open={createProjectOpen}
          ownerId={user.id}
          onClose={() => setCreateProjectOpen(false)}
          onCreated={async (project) => {
            await refresh();
            setMessage(`Project ${project.name} created and added to the portfolio.`);
            navigate(`/app/projects/${project.id}`);
          }}
        />
      ) : null}
    </Stack>
  );
}

function ButtonLikeText({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <ButtonBase onClick={onClick} sx={{ borderRadius: 2, color: "#046B5E" }}>
      <Typography
        sx={{
          fontSize: "0.9rem",
          fontWeight: 800,
          letterSpacing: 2.2,
          textTransform: "uppercase"
        }}
      >
        {label}
      </Typography>
    </ButtonBase>
  );
}

function ButtonLikePage({
  active,
  disabled = false,
  onClick,
  label
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <Paper
      elevation={0}
      onClick={disabled ? undefined : onClick}
      sx={{
        width: 38,
        height: 38,
        display: "grid",
        placeItems: "center",
        borderRadius: 1.8,
        cursor: disabled ? "default" : "pointer",
        backgroundColor: active ? "#FFFFFF" : "transparent",
        color: active ? "#00342B" : disabled ? "#B7C4D8" : "#7A869F"
      }}
    >
      <Typography sx={{ fontWeight: 700 }}>{label}</Typography>
    </Paper>
  );
}
