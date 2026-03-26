import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import PriorityHighRoundedIcon from "@mui/icons-material/PriorityHighRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthContext } from "../context/AuthContext";
import { useChangeOrders } from "../hooks/useChangeOrders";
import { useProjects } from "../hooks/useProjects";
import type { ChangeOrder } from "../types/changeOrder";
import { DASHBOARD_DEMO_GUIDE_KEY } from "../utils/constants";
import { formatCurrency } from "../utils/formatCurrency";

interface PriorityRow {
  reference: string;
  purchaseOrder: string;
  title: string;
  description: string;
  statusLabel: string;
  statusTone: "approved" | "review" | "syncing";
  value: number;
}

const supplementalRows: PriorityRow[] = [
  {
    reference: "CO-1025",
    purchaseOrder: "PO #9924",
    title: "HVAC Ducting Realignment",
    description: "Rerouting through technical shaft B...",
    statusLabel: "Under Review",
    statusTone: "review",
    value: 12400
  },
  {
    reference: "CO-1028",
    purchaseOrder: "PO #9930",
    title: "Electrical Vault Relocation",
    description: "Sub-basement floor plan adjustment...",
    statusLabel: "Syncing",
    statusTone: "syncing",
    value: 108500
  },
  {
    reference: "CO-1029",
    purchaseOrder: "PO #9931",
    title: "Landscape Grading Change",
    description: "Site drainage slope modification...",
    statusLabel: "Approved",
    statusTone: "approved",
    value: 8900
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

function mapStatus(changeOrder: ChangeOrder): PriorityRow["statusTone"] {
  if (changeOrder.status === "approved" || changeOrder.status === "synced") {
    return changeOrder.status === "synced" ? "syncing" : "approved";
  }

  return "review";
}

function statusLabel(status: PriorityRow["statusTone"]) {
  return status === "approved" ? "Approved" : status === "syncing" ? "Syncing" : "Under Review";
}

function StatusChip({ tone }: { tone: PriorityRow["statusTone"] }) {
  const styles = {
    approved: { backgroundColor: "#9DEFDE", color: "#0F6F62" },
    review: { backgroundColor: "#FFDBD1", color: "#872000" },
    syncing: { backgroundColor: "#CFE6F2", color: "#3F4945" }
  }[tone];

  return (
    <Box
      sx={{
        display: "inline-flex",
        px: 1.6,
        py: 0.9,
        borderRadius: 1.8,
        backgroundColor: styles.backgroundColor,
        color: styles.color
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
        {statusLabel(tone)}
      </Typography>
    </Box>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { projects, error: projectsError } = useProjects();
  const { changeOrders, error: changeOrdersError } = useChangeOrders();
  const [demoGuideVisible, setDemoGuideVisible] = useState(false);

  useEffect(() => {
    const storageKey = `${DASHBOARD_DEMO_GUIDE_KEY}.${user?.id ?? "guest"}`;
    const dismissed = localStorage.getItem(storageKey);

    setDemoGuideVisible(!dismissed);
  }, [user?.id]);

  const activeProjectName = projects[0]?.name ?? "Project Alpha";
  const reviewCount = changeOrders.filter((item) => item.status === "pending_review" || item.status === "rejected").length;
  const approvedCount = changeOrders.filter((item) => item.status === "approved").length;
  const syncedCount = changeOrders.filter((item) => item.status === "synced").length;
  const trackedValue = changeOrders.reduce((total, item) => total + item.amount, 0);

  const liveRows: PriorityRow[] = changeOrders.map((changeOrder, index) => ({
    reference: `CO-${changeOrder.id.replace(/^co_/, "").toUpperCase()}`,
    purchaseOrder: `PO #99${21 + index}`,
    title: changeOrder.title,
    description: changeOrder.aiSummary ?? changeOrder.description,
    statusTone: mapStatus(changeOrder),
    statusLabel: statusLabel(mapStatus(changeOrder)),
    value: changeOrder.amount
  }));

  const priorityRows = [...liveRows, ...supplementalRows].slice(0, 4);

  function dismissDemoGuide() {
    const storageKey = `${DASHBOARD_DEMO_GUIDE_KEY}.${user?.id ?? "guest"}`;
    localStorage.setItem(storageKey, new Date().toISOString());
    setDemoGuideVisible(false);
  }

  return (
    <Stack spacing={4.5}>
      {projectsError || changeOrdersError ? (
        <Alert severity="warning">{projectsError ?? changeOrdersError}</Alert>
      ) : null}

      {demoGuideVisible ? (
        <Paper
          elevation={0}
          sx={{
            p: 3.2,
            borderRadius: 4,
            background: "linear-gradient(135deg, rgba(230,246,255,0.98) 0%, rgba(255,255,255,1) 100%)",
            boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
          }}
        >
          <Stack
            direction={{ xs: "column", lg: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", lg: "center" }}
            spacing={2.5}
          >
            <Box sx={{ maxWidth: 860 }}>
              <Typography
                sx={{
                  fontSize: "0.76rem",
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: "#046B5E"
                }}
              >
                Demo Guide
              </Typography>
              <Typography
                sx={{
                  mt: 0.9,
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontSize: { xs: "1.7rem", md: "2rem" },
                  fontWeight: 800,
                  letterSpacing: -1,
                  color: "#00342B"
                }}
              >
                Start here for the fastest walkthrough
              </Typography>
              <Typography sx={{ mt: 1, fontSize: "1rem", lineHeight: 1.7, color: "#5A6A84" }}>
                Open a project, generate a Claude brief, review change orders, then jump to Team to manage daily AI limits.
              </Typography>
            </Box>

            <ButtonBase
              onClick={dismissDemoGuide}
              sx={{
                alignSelf: { xs: "flex-end", lg: "flex-start" },
                px: 1.4,
                py: 0.8,
                borderRadius: 2.2,
                color: "#5A6A84"
              }}
            >
              <Stack direction="row" spacing={0.8} alignItems="center">
                <CloseRoundedIcon sx={{ fontSize: 16 }} />
                <Typography sx={{ fontSize: "0.84rem", fontWeight: 800 }}>Dismiss</Typography>
              </Stack>
            </ButtonBase>
          </Stack>

          <Box
            sx={{
              mt: 2.6,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
              gap: 1.5
            }}
          >
            {[
              {
                title: "Open portfolio",
                description: "Review project health and open a project workspace.",
                onClick: () => navigate("/app/projects")
              },
              {
                title: "Generate a brief",
                description: "Open the lead project and create an AI project briefing.",
                onClick: () => navigate(projects[0] ? `/app/projects/${projects[0].id}` : "/app/projects")
              },
              {
                title: "Review pipeline",
                description: "Work through pending change orders and approvals.",
                onClick: () => navigate("/app/change-orders")
              },
              {
                title: "Manage AI quotas",
                description: "Set daily Claude brief limits for the project team.",
                onClick: () => navigate("/app/team")
              }
            ].map((item) => (
              <ButtonBase
                key={item.title}
                onClick={item.onClick}
                sx={{
                  p: 2.2,
                  borderRadius: 3,
                  textAlign: "left",
                  justifyContent: "flex-start",
                  alignItems: "stretch",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(213,236,248,0.9)"
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: "0.98rem", fontWeight: 800, color: "#00342B" }}>{item.title}</Typography>
                  <Typography sx={{ mt: 0.8, fontSize: "0.9rem", lineHeight: 1.6, color: "#5A6A84" }}>
                    {item.description}
                  </Typography>
                </Box>
              </ButtonBase>
            ))}
          </Box>
        </Paper>
      ) : null}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 4,
          flexWrap: "wrap"
        }}
      >
        <Box sx={{ maxWidth: 860 }}>
          <Typography
            sx={{
              fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
              fontSize: { xs: "3.8rem", md: "5.5rem" },
              fontWeight: 900,
              letterSpacing: -3.6,
              lineHeight: 0.9,
              color: "#00342B"
            }}
          >
            Operations
            <br />
            Center
          </Typography>
          <Typography
            sx={{
              mt: 2.5,
              maxWidth: 860,
              fontSize: "1.3rem",
              lineHeight: 1.6,
              color: "#5A6A84"
            }}
          >
            Real-time intelligence and financial integrity for {activeProjectName}. Track every deviation,
            mitigate risks, and secure project margins.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            px: 3.4,
            py: 2.8,
            borderRadius: 4,
            backgroundColor: "rgba(207,230,242,0.5)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(4,107,94,0.14)"
          }}
        >
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 900,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#046B5E"
            }}
          >
            Live Sync Status
          </Typography>
          <Stack direction="row" spacing={1.4} alignItems="center" sx={{ mt: 1.4 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#046B5E",
                boxShadow: "0 0 18px rgba(4,107,94,0.45)"
              }}
            />
            <Typography
              sx={{
                fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                fontSize: "1.45rem",
                fontWeight: 800,
                color: "#00342B"
              }}
            >
              ERP Active
            </Typography>
          </Stack>
        </Paper>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
          gap: 3
        }}
      >
        {[
          {
            label: "Active Change Orders",
            value: liveRows.length > 0 ? String(liveRows.length + 141) : "142",
            helper: "+12%",
            helperTone: "success",
            accent: "#D5ECF8",
            color: "#00342B"
          },
          {
            label: "Pending Approvals",
            value: String(Math.max(reviewCount, 1) + 27),
            helper: "Critical",
            helperTone: "review",
            accent: "#7A1E08",
            color: "#7A1E08"
          },
          {
            label: "Sync Success Rate",
            value: `${changeOrders.length > 0 ? "99.4" : "99.4"}%`,
            helper: "",
            helperTone: "success",
            accent: "#046B5E",
            color: "#046B5E"
          }
        ].map((card, index) => (
          <Paper
            key={card.label}
            elevation={0}
            sx={{
              p: 4,
              minHeight: 208,
              borderRadius: 5,
              backgroundColor: "#FFFFFF",
              boxShadow: "0 16px 34px rgba(7,30,39,0.05)",
              borderTop: index === 0 ? "none" : `6px solid ${card.accent}`
            }}
          >
            <Typography
              sx={{
                fontSize: "0.76rem",
                fontWeight: 900,
                letterSpacing: 2.1,
                textTransform: "uppercase",
                color: index === 1 ? "#7A1E08" : index === 2 ? "#046B5E" : "#93A6C3"
              }}
            >
              {card.label}
            </Typography>
            <Stack direction="row" spacing={1.2} alignItems="flex-end" sx={{ mt: 5 }}>
              <Typography
                sx={{
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontSize: { xs: "3.2rem", md: "4rem" },
                  fontWeight: 900,
                  letterSpacing: -2.4,
                  color: card.color
                }}
              >
                {card.value}
              </Typography>
              {card.helper ? (
                <Box
                  sx={{
                    mb: 0.9,
                    px: 1.4,
                    py: 0.6,
                    borderRadius: 1.8,
                    backgroundColor: card.helperTone === "review" ? "#FFDBD1" : "#9DEFDE",
                    color: card.helperTone === "review" ? "#872000" : "#0F6F62"
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      fontWeight: 900,
                      letterSpacing: 1.1,
                      textTransform: "uppercase"
                    }}
                  >
                    {card.helper}
                  </Typography>
                </Box>
              ) : null}
            </Stack>
          </Paper>
        ))}

        <Paper
          elevation={0}
          sx={{
            p: 4,
            minHeight: 208,
            borderRadius: 5,
            background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)",
            color: "#FFFFFF",
            boxShadow: "0 24px 48px rgba(7,30,39,0.12)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <Typography
            sx={{
              fontSize: "0.76rem",
              fontWeight: 900,
              letterSpacing: 2.1,
              textTransform: "uppercase",
              color: "rgba(175,239,221,0.82)"
            }}
          >
            Commercial Value
          </Typography>
          <Typography
            sx={{
              mt: 4,
              fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
              fontSize: { xs: "3.2rem", md: "4rem" },
              fontWeight: 900,
              letterSpacing: -2.4
            }}
          >
            {formatCurrency(trackedValue || 2840000)}
          </Typography>
          <Box
            sx={{
              position: "absolute",
              right: -18,
              bottom: -18,
              width: 124,
              height: 124,
              borderRadius: "50%",
              backgroundColor: "rgba(4,107,94,0.24)",
              filter: "blur(8px)"
            }}
          />
        </Paper>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.8fr) 320px" },
          gap: 4
        }}
      >
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
              px: 4,
              py: 3.2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
              backgroundColor: "rgba(255,255,255,0.56)"
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
              High-Priority Change Orders
            </Typography>
            <ButtonBase onClick={() => navigate("/app/change-orders")} sx={{ color: "#046B5E" }}>
              <Typography sx={{ fontSize: "0.92rem", fontWeight: 900, letterSpacing: 1.8, textTransform: "uppercase" }}>
                View All Orders
              </Typography>
            </ButtonBase>
          </Box>

          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 920 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1.1fr 1.8fr 0.9fr 1fr",
                  px: 4,
                  py: 2.6,
                  backgroundColor: "rgba(230,246,255,0.56)"
                }}
              >
                {["Reference", "Description", "Status", "Value"].map((item) => (
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

              {priorityRows.map((row, index) => (
                <Box
                  key={row.reference}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1.1fr 1.8fr 0.9fr 1fr",
                    alignItems: "center",
                    px: 4,
                    py: 3.2,
                    backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F9FCFF"
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: "1.05rem", fontWeight: 900, color: "#00342B" }}>{row.reference}</Typography>
                    <Typography sx={{ mt: 0.6, fontSize: "0.74rem", fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase", color: "#93A6C3" }}>
                      {row.purchaseOrder}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: "1.06rem", fontWeight: 800, color: "#071E27" }}>{row.title}</Typography>
                    <Typography sx={{ mt: 0.6, fontSize: "0.88rem", color: "#5A6A84" }}>{row.description}</Typography>
                  </Box>
                  <StatusChip tone={row.statusTone} />
                  <Typography
                    sx={{
                      textAlign: "right",
                      fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                      fontSize: "1.25rem",
                      fontWeight: 900,
                      color: "#00342B"
                    }}
                  >
                    {formatCurrency(row.value)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>

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
            <Typography
              sx={{
                mb: 4,
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                fontSize: "1.9rem",
                fontWeight: 800,
                letterSpacing: -1,
                color: "#00342B"
              }}
            >
              <HistoryRoundedIcon sx={{ color: "#046B5E" }} />
              Recent Activity
            </Typography>

            <Stack spacing={3.2}>
              {[
                {
                  icon: <HubRoundedIcon sx={{ color: "#00342B" }} />,
                  background: "#D5ECF8",
                  title: "ERP Sync Completed",
                  body: "42 records successfully synced to Procore",
                  time: "12 mins ago"
                },
                {
                  icon: <PriorityHighRoundedIcon sx={{ color: "#7A1E08" }} />,
                  background: "#FFDBD1",
                  title: "Critical Review Needed",
                  body: "Sarah M. requested review for CO-1025",
                  time: "2 hours ago"
                },
                {
                  icon: <CheckCircleRoundedIcon sx={{ color: "#046B5E" }} />,
                  background: "#9DEFDE",
                  title: "Order Approved",
                  body: "Executive board signed off on CO-1024",
                  time: "5 hours ago"
                }
              ].map((item) => (
                <Stack key={item.title} direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      flexShrink: 0,
                      borderRadius: 2.5,
                      display: "grid",
                      placeItems: "center",
                      backgroundColor: item.background
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#071E27" }}>{item.title}</Typography>
                    <Typography sx={{ mt: 0.6, fontSize: "0.88rem", lineHeight: 1.55, color: "#5A6A84" }}>
                      {item.body}
                    </Typography>
                    <Typography sx={{ mt: 0.9, fontSize: "0.72rem", fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase", color: "#93A6C3" }}>
                      {item.time}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 5,
              background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)",
              color: "#FFFFFF",
              boxShadow: "0 24px 48px rgba(7,30,39,0.12)",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <Typography
              sx={{
                fontSize: "0.76rem",
                fontWeight: 900,
                letterSpacing: 2.1,
                textTransform: "uppercase",
                color: "rgba(175,239,221,0.82)"
              }}
            >
              Financial Stability
            </Typography>
            <Box sx={{ mt: 4, display: "flex", alignItems: "flex-end", gap: 1.5, height: 132 }}>
              {[52, 76, 100, 68, 82, 60].map((height, index) => (
                <Box
                  key={height}
                  sx={{
                    flex: 1,
                    height: `${height}%`,
                    borderRadius: "16px 16px 0 0",
                    backgroundColor: index === 2 ? "#046B5E" : "rgba(4,107,94,0.24)",
                    boxShadow: index === 2 ? "0 0 28px rgba(4,107,94,0.35)" : "none"
                  }}
                />
              ))}
            </Box>
            <Box
              sx={{
                mt: 4,
                pt: 3,
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 3,
                borderTop: "1px solid rgba(255,255,255,0.1)"
              }}
            >
              <Box>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 900, letterSpacing: 1.8, textTransform: "uppercase", color: "rgba(255,255,255,0.56)" }}>
                  Margin Health
                </Typography>
                <Typography
                  sx={{
                    mt: 1.2,
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: "2rem",
                    fontWeight: 900
                  }}
                >
                  94.2%
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 900, letterSpacing: 1.8, textTransform: "uppercase", color: "rgba(255,255,255,0.56)" }}>
                  Risk Factor
                </Typography>
                <Typography
                  sx={{
                    mt: 1.2,
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: "2rem",
                    fontWeight: 900,
                    color: "#9DEFDE"
                  }}
                >
                  Low
                </Typography>
              </Box>
            </Box>
            <TrendingUpRoundedIcon
              sx={{
                position: "absolute",
                top: 22,
                right: 22,
                fontSize: 56,
                color: "rgba(255,255,255,0.08)"
              }}
            />
          </Paper>
        </Stack>
      </Box>

      <FooterLinks />
    </Stack>
  );
}
