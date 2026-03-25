import ApiRoundedIcon from "@mui/icons-material/ApiRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { WorkspaceFooter } from "../components/layout/WorkspaceFooter";
import { useChangeOrders } from "../hooks/useChangeOrders";
import { useProjects } from "../hooks/useProjects";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";

type ResourcePanel = "support" | "archive" | "updates" | "api-docs";

const panels: Array<{ id: ResourcePanel; label: string; icon: ReactNode }> = [
  { id: "support", label: "Support", icon: <HelpRoundedIcon /> },
  { id: "archive", label: "Archive", icon: <ArchiveRoundedIcon /> },
  { id: "updates", label: "Updates", icon: <NotificationsActiveRoundedIcon /> },
  { id: "api-docs", label: "API Docs", icon: <ApiRoundedIcon /> }
];

export function ResourcesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const panel = (searchParams.get("panel") as ResourcePanel | null) ?? "support";
  const searchQuery = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const { projects, error: projectError } = useProjects({ includeArchived: true });
  const { changeOrders, error: changeOrderError } = useChangeOrders(undefined, { includeArchived: true });

  const archivedProjects = useMemo(
    () => projects.filter((project) => Boolean(project.archivedAt)),
    [projects]
  );
  const archivedChangeOrders = useMemo(
    () => changeOrders.filter((changeOrder) => Boolean(changeOrder.archivedAt)),
    [changeOrders]
  );
  const recentChangeOrders = useMemo(
    () =>
      [...changeOrders.filter((changeOrder) => !changeOrder.archivedAt)]
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
        .slice(0, 8),
    [changeOrders]
  );
  const filteredArchivedProjects = useMemo(
    () =>
      archivedProjects.filter((project) => {
        if (!searchQuery) {
          return true;
        }

        return (
          project.name.toLowerCase().includes(searchQuery) ||
          project.location.toLowerCase().includes(searchQuery) ||
          project.code.toLowerCase().includes(searchQuery)
        );
      }),
    [archivedProjects, searchQuery]
  );
  const filteredRecentChangeOrders = useMemo(
    () =>
      recentChangeOrders.filter((changeOrder) => {
        if (!searchQuery) {
          return true;
        }

        return (
          changeOrder.title.toLowerCase().includes(searchQuery) ||
          changeOrder.requestedBy.toLowerCase().includes(searchQuery) ||
          (changeOrder.aiSummary ?? changeOrder.description).toLowerCase().includes(searchQuery)
        );
      }),
    [recentChangeOrders, searchQuery]
  );
  const filteredArchivedChangeOrders = useMemo(
    () =>
      archivedChangeOrders.filter((changeOrder) => {
        if (!searchQuery) {
          return true;
        }

        return (
          changeOrder.title.toLowerCase().includes(searchQuery) ||
          changeOrder.requestedBy.toLowerCase().includes(searchQuery) ||
          (changeOrder.assignedTo ?? "").toLowerCase().includes(searchQuery)
        );
      }),
    [archivedChangeOrders, searchQuery]
  );

  function setPanel(nextPanel: ResourcePanel) {
    const next = new URLSearchParams(searchParams);
    next.set("panel", nextPanel);
    setSearchParams(next);
  }

  return (
    <Stack spacing={4}>
      {projectError ? <Alert severity="warning">{projectError}</Alert> : null}
      {changeOrderError ? <Alert severity="warning">{changeOrderError}</Alert> : null}

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
          Operational Library
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
          Resources Hub
        </Typography>
        <Typography sx={{ mt: 2, maxWidth: 760, fontSize: "1.08rem", lineHeight: 1.65, color: "#5A6A84" }}>
          Keep support pathways, archived records, live updates, and implementation notes inside the workspace.
        </Typography>
      </Box>

      <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap">
        {panels.map((option) => {
          const active = panel === option.id;

          return (
            <ButtonBase
              key={option.id}
              onClick={() => setPanel(option.id)}
              sx={{
                px: 2.4,
                py: 1.2,
                borderRadius: 999,
                backgroundColor: active ? "#00342B" : "#D5ECF8",
                color: active ? "#FFFFFF" : "#00342B"
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                {option.icon}
                <Typography sx={{ fontSize: "0.92rem", fontWeight: 800 }}>{option.label}</Typography>
              </Stack>
            </ButtonBase>
          );
        })}
      </Stack>

      {panel === "support" ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 2.5
          }}
        >
          {[
            {
              title: "Integration Control Room",
              body: "Review sync health, webhook activity, and manual retry controls from the live integrations center.",
              to: "/app/integrations"
            },
            {
              title: "Portfolio Review Queue",
              body: "Jump into the change-order pipeline to clear pending approvals and commercial exceptions.",
              to: "/app/change-orders?status=pending"
            },
            {
              title: "Project Command Center",
              body: "Audit team coverage, documents, and commercial impact directly from the portfolio workspace.",
              to: "/app/projects"
            },
            {
              title: "Local Setup Notes",
              body: "Use the repo docs to run the app locally, seed demo data, and connect optional APIs later.",
              to: "/app/api-docs"
            }
          ]
            .filter((card) => {
              if (!searchQuery) {
                return true;
              }

              return (
                card.title.toLowerCase().includes(searchQuery) ||
                card.body.toLowerCase().includes(searchQuery)
              );
            })
            .map((card) => (
            <Paper
              key={card.title}
              elevation={0}
              sx={{
                p: 3.2,
                borderRadius: 4,
                backgroundColor: "#FFFFFF",
                boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
              }}
            >
              <Typography
                sx={{
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontSize: "1.6rem",
                  fontWeight: 800,
                  letterSpacing: -1,
                  color: "#00342B"
                }}
              >
                {card.title}
              </Typography>
              <Typography sx={{ mt: 1.4, fontSize: "1rem", lineHeight: 1.65, color: "#5A6A84" }}>
                {card.body}
              </Typography>
              <ButtonBase
                onClick={() => navigate(card.to)}
                sx={{
                  mt: 2.4,
                  px: 2,
                  py: 1.1,
                  borderRadius: 2.2,
                  backgroundColor: "#D5ECF8",
                  color: "#00342B"
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ fontSize: "0.9rem", fontWeight: 800 }}>Open</Typography>
                  <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
                </Stack>
              </ButtonBase>
            </Paper>
          ))}
        </Box>
      ) : null}

      {panel === "archive" ? (
        <Stack spacing={2.5}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              overflow: "hidden",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
            }}
          >
            <Box sx={{ px: 4, py: 3, backgroundColor: "#E6F6FF" }}>
              <Typography
                sx={{
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontSize: "2rem",
                  fontWeight: 800,
                  letterSpacing: -1.2,
                  color: "#00342B"
                }}
              >
                Archived Projects
              </Typography>
            </Box>

            <Stack spacing={0}>
              {filteredArchivedProjects.length > 0 ? (
                filteredArchivedProjects.map((project) => (
                  <Box
                    key={project.id}
                    sx={{
                      px: 4,
                      py: 2.6,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 2,
                      flexWrap: "wrap",
                      borderBottom: "1px solid rgba(213,236,248,0.72)"
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>{project.name}</Typography>
                      <Typography sx={{ mt: 0.5, fontSize: "0.92rem", color: "#5A6A84" }}>
                        {project.location} • Archived {project.archivedAt ? formatDate(project.archivedAt) : ""}
                      </Typography>
                    </Box>
                    <ButtonBase
                      onClick={() => navigate(`/app/projects/${project.id}`)}
                      sx={{
                        px: 2,
                        py: 1.1,
                        borderRadius: 2.2,
                        backgroundColor: "#D5ECF8",
                        color: "#00342B"
                      }}
                    >
                      <Typography sx={{ fontSize: "0.88rem", fontWeight: 800 }}>Open Record</Typography>
                    </ButtonBase>
                  </Box>
                ))
              ) : (
                <Box sx={{ px: 4, py: 3.2 }}>
                  <Typography sx={{ color: "#5A6A84" }}>No archived projects yet.</Typography>
                </Box>
              )}
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              overflow: "hidden",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
            }}
          >
            <Box sx={{ px: 4, py: 3, backgroundColor: "#F3FAFF" }}>
              <Typography
                sx={{
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontSize: "2rem",
                  fontWeight: 800,
                  letterSpacing: -1.2,
                  color: "#00342B"
                }}
              >
                Archived Change Orders
              </Typography>
            </Box>

            <Stack spacing={0}>
              {filteredArchivedChangeOrders.length > 0 ? (
                filteredArchivedChangeOrders.map((changeOrder) => (
                  <Box
                    key={changeOrder.id}
                    sx={{
                      px: 4,
                      py: 2.6,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 2,
                      flexWrap: "wrap",
                      borderBottom: "1px solid rgba(213,236,248,0.72)"
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>{changeOrder.title}</Typography>
                      <Typography sx={{ mt: 0.5, fontSize: "0.92rem", color: "#5A6A84" }}>
                        {formatCurrency(changeOrder.amount)} • Archived {changeOrder.archivedAt ? formatDate(changeOrder.archivedAt) : ""}
                      </Typography>
                    </Box>
                    <ButtonBase
                      onClick={() => navigate(`/app/change-orders/${changeOrder.id}`)}
                      sx={{
                        px: 2,
                        py: 1.1,
                        borderRadius: 2.2,
                        backgroundColor: "#D5ECF8",
                        color: "#00342B"
                      }}
                    >
                      <Typography sx={{ fontSize: "0.88rem", fontWeight: 800 }}>Open Record</Typography>
                    </ButtonBase>
                  </Box>
                ))
              ) : (
                <Box sx={{ px: 4, py: 3.2 }}>
                  <Typography sx={{ color: "#5A6A84" }}>No archived change orders yet.</Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        </Stack>
      ) : null}

      {panel === "updates" ? (
        <Stack spacing={2.2}>
          {filteredRecentChangeOrders.map((changeOrder) => (
            <Paper
              key={changeOrder.id}
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                backgroundColor: "#FFFFFF",
                boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
              }}
            >
              <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>{changeOrder.title}</Typography>
              <Typography sx={{ mt: 0.8, fontSize: "0.95rem", color: "#5A6A84" }}>
                Updated {formatDate(changeOrder.updatedAt)} • {changeOrder.requestedBy}
              </Typography>
              <Typography sx={{ mt: 1.2, fontSize: "0.98rem", lineHeight: 1.65, color: "#42536D" }}>
                {changeOrder.aiSummary ?? changeOrder.description}
              </Typography>
              <Typography sx={{ mt: 1.4, fontSize: "0.9rem", fontWeight: 800, color: "#046B5E" }}>
                {formatCurrency(changeOrder.amount)}
              </Typography>
            </Paper>
          ))}
        </Stack>
      ) : null}

      {panel === "api-docs" ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
            gap: 2.5
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3.2,
              borderRadius: 4,
              background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)",
              color: "#FFFFFF",
              gridColumn: { xs: "auto", lg: "1 / -1" }
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                fontSize: { xs: "2rem", md: "2.4rem" },
                fontWeight: 800,
                letterSpacing: -1.2
              }}
            >
              Need the full reference?
            </Typography>
            <Typography sx={{ mt: 1.2, maxWidth: 760, fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.78)" }}>
              Open the dedicated API docs page for live endpoint groups, request examples, response envelopes,
              upload flow notes, and webhook guidance.
            </Typography>
            <ButtonBase
              onClick={() => navigate("/app/api-docs")}
              sx={{
                mt: 2.2,
                px: 2.2,
                py: 1.2,
                borderRadius: 2.5,
                backgroundColor: "#9DEFDE",
                color: "#00342B"
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontSize: "0.92rem", fontWeight: 800 }}>Open API Docs Page</Typography>
                <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
              </Stack>
            </ButtonBase>
          </Paper>
          {[
            {
              title: "Local Docs",
              body: "Architecture, setup, and API configuration notes live in the repo docs for this workspace.",
              highlights: ["docs/architecture.md", "docs/setup.md", "docs/api-setup.md"]
            },
            {
              title: "API Surface",
              body: "The current local app already supports projects, team members, documents, change orders, integrations, and webhooks.",
              highlights: ["/projects", "/projects/:projectId/documents", "/change-orders/import"]
            },
            {
              title: "Optional External APIs",
              body: "Slack, Anthropic Claude, email, S3 storage, and sandbox ERP systems are optional for the current local build.",
              highlights: ["SLACK_WEBHOOK_URL", "ANTHROPIC_API_KEY", "EMAIL_API_KEY", "S3_*"]
            },
            {
              title: "Recommended Next Step",
              body: "After the internal workspace pass, wire the external providers so alerts, AI summaries, uploads, and SSO become fully real.",
              highlights: ["Slack", "Anthropic Claude", "Resend or SendGrid", "Google or Microsoft OAuth"]
            }
          ]
            .filter((card) => {
              if (!searchQuery) {
                return true;
              }

              return (
                card.title.toLowerCase().includes(searchQuery) ||
                card.body.toLowerCase().includes(searchQuery) ||
                card.highlights.some((item) => item.toLowerCase().includes(searchQuery))
              );
            })
            .map((card) => (
            <Paper
              key={card.title}
              elevation={0}
              sx={{
                p: 3.2,
                borderRadius: 4,
                backgroundColor: "#FFFFFF",
                boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
              }}
            >
              <Stack direction="row" spacing={1.2} alignItems="center">
                <AutoStoriesRoundedIcon sx={{ color: "#046B5E" }} />
                <Typography
                  sx={{
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    letterSpacing: -1,
                    color: "#00342B"
                  }}
                >
                  {card.title}
                </Typography>
              </Stack>
              <Typography sx={{ mt: 1.4, fontSize: "1rem", lineHeight: 1.65, color: "#5A6A84" }}>
                {card.body}
              </Typography>
              <Stack spacing={0.8} sx={{ mt: 2 }}>
                {card.highlights.map((item) => (
                  <Typography key={item} sx={{ fontSize: "0.9rem", fontWeight: 700, color: "#00342B" }}>
                    {item}
                  </Typography>
                ))}
              </Stack>
            </Paper>
          ))}
        </Box>
      ) : null}

      <WorkspaceFooter />
    </Stack>
  );
}
