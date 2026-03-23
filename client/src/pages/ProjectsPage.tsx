import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useProjects } from "../hooks/useProjects";

const portfolioCards = [
  {
    label: "ON TRACK",
    labelTone: "success",
    title: "Skyline Residences",
    location: "Austin, TX",
    value: "$412,500",
    health: "98",
    progress: 85,
    note: "85% Budget Utilization"
  },
  {
    label: "CRITICAL VARIANCE",
    labelTone: "danger",
    title: "Harbor Logistics Hub",
    location: "Savannah, GA",
    value: "$1,240,000",
    health: "42",
    progress: 100,
    note: "105% Over Initial Estimate"
  },
  {
    label: "DRAFT",
    labelTone: "neutral",
    title: "Phoenix Tech Plaza",
    location: "Phoenix, AZ",
    value: "$85,200",
    health: "--",
    progress: 10,
    note: "Initial Setup Phase"
  }
] as const;

const inventoryRows = [
  {
    name: "Oak Creek Bridge",
    meta: "Infrastructure • ID: 2991-A",
    client: "State DOT",
    contractValue: "$12,400,000",
    variance: "+4.2%",
    varianceTone: "danger",
    tasks: ["JB", "MK", "+3"],
    compliance: "PASSED",
    complianceTone: "success"
  },
  {
    name: "Northside Library Renovation",
    meta: "Public Works • ID: 1042-C",
    client: "City of Portland",
    contractValue: "$2,850,000",
    variance: "-0.8%",
    varianceTone: "success",
    tasks: ["AL", "BT"],
    compliance: "PASSED",
    complianceTone: "success"
  },
  {
    name: "Emerald Tower B",
    meta: "Commercial • ID: 7721-F",
    client: "Vanguard Dev Group",
    contractValue: "$45,000,000",
    variance: "+1.5%",
    varianceTone: "warning",
    tasks: ["RS", "NM", "WP", "+12"],
    compliance: "PENDING",
    complianceTone: "danger"
  }
] as const;

function StatusPill({
  label,
  tone
}: {
  label: string;
  tone: "success" | "danger" | "neutral";
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
      <Typography
        sx={{
          fontSize: "0.78rem",
          fontWeight: 700,
          letterSpacing: 0.2
        }}
      >
        {label}
      </Typography>
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
      <Typography
        sx={{
          fontSize: "0.72rem",
          fontWeight: 800,
          letterSpacing: 0.4
        }}
      >
        {label}
      </Typography>
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

export function ProjectsPage() {
  const { error } = useProjects();

  return (
    <Stack spacing={4}>
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
            Centralized visibility into 14 active construction projects, tracking financial variances
            and operational health in real-time.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
          <Paper
            elevation={0}
            sx={{
              px: 2.2,
              py: 1.4,
              borderRadius: 2.5,
              border: "none",
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
              border: "none",
              backgroundColor: "#D5ECF8",
              color: "#00342B"
            }}
          >
            <Stack direction="row" spacing={1.2} alignItems="center">
              <CalendarTodayRoundedIcon sx={{ fontSize: 20 }} />
              <Typography sx={{ fontSize: "1rem", fontWeight: 700 }}>Q4 2024</Typography>
            </Stack>
          </Paper>
        </Stack>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" },
          gap: 2.5
        }}
      >
        {portfolioCards.map((card) => (
          <Paper
            key={card.title}
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 4,
              border: "none",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
            }}
          >
            <StatusPill label={card.label} tone={card.labelTone} />

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
              {card.title}
            </Typography>

            <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 1 }}>
              <LocationOnRoundedIcon sx={{ fontSize: 16, color: "#6B7A90" }} />
              <Typography sx={{ fontSize: "0.98rem", color: "#6B7A90" }}>{card.location}</Typography>
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
                  CO Value
                </Typography>
                <Typography
                  sx={{
                    mt: 1,
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: "2rem",
                    fontWeight: 700,
                    letterSpacing: -1.1,
                    color: card.labelTone === "danger" ? "#5B1300" : "#00342B"
                  }}
                >
                  {card.value}
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
                      color: card.labelTone === "danger" ? "#5B1300" : "#00342B"
                    }}
                  >
                    {card.health}
                  </Typography>
                  {card.health !== "--" ? (
                    card.labelTone === "danger" ? (
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
                  width: `${card.progress}%`,
                  height: "100%",
                  borderRadius: 999,
                  backgroundColor:
                    card.labelTone === "danger" ? "#5B1300" : card.labelTone === "neutral" ? "#707975" : "#046B5E"
                }}
              />
            </Box>
            <Typography
              sx={{
                mt: 1.4,
                fontSize: "0.82rem",
                fontWeight: card.labelTone === "danger" ? 800 : 500,
                color: card.labelTone === "danger" ? "#5B1300" : "#93A6C3"
              }}
            >
              {card.note}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 5,
          border: "none",
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
            <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, letterSpacing: 2.2, textTransform: "uppercase", color: "#046B5E" }}>
              Export CSV
            </Typography>
            <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, letterSpacing: 2.2, textTransform: "uppercase", color: "#046B5E" }}>
              Bulk Actions
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 1040 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "2.2fr 1.5fr 1.6fr 1.2fr 1.5fr 1fr 0.2fr",
                px: 5,
                py: 3,
                backgroundColor: "rgba(230,246,255,0.56)"
              }}
            >
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

            {inventoryRows.map((row, index) => (
              <Box
                key={row.name}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "2.2fr 1.5fr 1.6fr 1.2fr 1.5fr 1fr 0.2fr",
                  alignItems: "center",
                  px: 5,
                  py: 3.5,
                  backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F9FCFF"
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>{row.name}</Typography>
                  <Typography sx={{ mt: 0.6, fontSize: "0.92rem", color: "#6B7A90" }}>{row.meta}</Typography>
                </Box>
                <Typography sx={{ fontSize: "1rem", color: "#071E27" }}>{row.client}</Typography>
                <Typography
                  sx={{
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    color: "#00342B"
                  }}
                >
                  {row.contractValue}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 800,
                    color:
                      row.varianceTone === "danger"
                        ? "#5B1300"
                        : row.varianceTone === "warning"
                          ? "#00342B"
                          : "#046B5E"
                  }}
                >
                  {row.variance}
                </Typography>
                <TaskAvatars tasks={row.tasks} />
                <CompliancePill label={row.compliance} tone={row.complianceTone} />
                <MoreHorizRoundedIcon sx={{ color: "#93A6C3" }} />
              </Box>
            ))}

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
              <Typography sx={{ fontSize: "0.95rem", color: "#5A6A84" }}>Showing 1-10 of 14 projects</Typography>
              <Stack direction="row" spacing={1.4} alignItems="center">
                <Paper
                  elevation={0}
                  sx={{
                    width: 38,
                    height: 38,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 1.8,
                    border: "none",
                    backgroundColor: "#FFFFFF",
                    color: "#00342B"
                  }}
                >
                  <Typography sx={{ fontWeight: 700 }}>1</Typography>
                </Paper>
                <Typography sx={{ fontSize: "1rem", color: "#7A869F" }}>2</Typography>
                <Typography sx={{ fontSize: "1.2rem", color: "#7A869F" }}>›</Typography>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Box
        sx={{
          pt: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 3,
          flexWrap: "wrap",
          color: "rgba(90,106,132,0.86)"
        }}
      >
        <Typography sx={{ fontSize: "0.82rem", letterSpacing: 2.2, textTransform: "uppercase" }}>
          © 2024 ChangeFlow Intelligence. Built for the modern jobsite.
        </Typography>
        <Stack direction="row" spacing={3.5} useFlexGap flexWrap="wrap">
          {["Terms", "Privacy", "Trust & Security", "API Docs"].map((item) => (
            <Typography key={item} sx={{ fontSize: "0.82rem", letterSpacing: 2.2, textTransform: "uppercase" }}>
              {item}
            </Typography>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
