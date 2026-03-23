import { useEffect, useState } from "react";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import DrawRoundedIcon from "@mui/icons-material/DrawRounded";
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
import { useParams } from "react-router-dom";

import { getProject } from "../api/projects";
import { useChangeOrders } from "../hooks/useChangeOrders";
import type { Project } from "../types/project";
import type { ChangeOrder } from "../types/changeOrder";
import { formatCurrency } from "../utils/formatCurrency";

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
        {["Terms", "Privacy", "Trust & Security", "API Docs"].map((item) => (
          <Typography key={item} sx={{ fontSize: "0.78rem", letterSpacing: 2.2, textTransform: "uppercase" }}>
            {item}
          </Typography>
        ))}
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

export function ProjectDetailsPage() {
  const { projectId = "" } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { changeOrders } = useChangeOrders(projectId);

  useEffect(() => {
    getProject(projectId)
      .then(setProject)
      .catch((requestError: Error) => setError(requestError.message));
  }, [projectId]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!project) {
    return <Typography color="text.secondary">Loading project details...</Typography>;
  }

  const status = statusPresentation(project.status);
  const relatedChangeRows = [...changeOrders.map(mapChangeOrder), ...fallbackChangeRows].slice(0, 3);
  const impactValue = changeOrders.reduce((total, item) => total + item.amount, 0);
  const utilization = Math.min(64 + changeOrders.length * 4, 92);

  return (
    <Stack
      spacing={4.5}
      sx={{
        px: { xs: 0, md: 0 },
        backgroundImage: "radial-gradient(circle, rgba(4,107,94,0.12) 1px, transparent 1px)",
        backgroundSize: "24px 24px"
      }}
    >
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
      </Box>

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
              <ButtonBase sx={{ color: "#046B5E" }}>
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
              {[
                {
                  title: "Structural_V4.pdf",
                  subtitle: "Updated 2h ago",
                  icon: <DescriptionRoundedIcon sx={{ color: "#046B5E" }} />
                },
                {
                  title: "Site_Layout_Final.dwg",
                  subtitle: "Updated yesterday",
                  icon: <DrawRoundedIcon sx={{ color: "#7A1E08" }} />
                }
              ].map((document) => (
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
              {[
                { initials: "JS", name: "James Sterling", role: "Site Lead", color: "#D5ECF8" },
                { initials: "AW", name: "Anita Wong", role: "Architecture", color: "#E6F6FF" },
                { initials: "MT", name: "Marcus Thorne", role: "Foreman", color: "#E6F6FF" }
              ].map((member) => (
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
                    backgroundColor: member.color
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
                    {member.initials}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: "0.98rem", fontWeight: 800, color: "#00342B" }}>{member.name}</Typography>
                    <Typography sx={{ mt: 0.2, fontSize: "0.72rem", fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: "#93A6C3" }}>
                      {member.role}
                    </Typography>
                  </Box>
                </Box>
              ))}

              <ButtonBase
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
                sx={{
                  display: "grid",
                  gridTemplateColumns: "0.8fr 1.5fr 1fr 1fr",
                  alignItems: "center",
                  px: 4,
                  py: 3.1,
                  backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F9FCFF"
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

            <ButtonBase sx={{ width: "100%", py: 2.6, backgroundColor: "#D5ECF8", color: "#046B5E" }}>
              <Typography sx={{ fontSize: "1rem", fontWeight: 800 }}>View Full Change History</Typography>
            </ButtonBase>
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
            <Box
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
            </Box>
          </Paper>
        </Stack>
      </Box>

      <FooterLinks />
    </Stack>
  );
}
