import type { ReactNode } from "react";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import ViewKanbanRoundedIcon from "@mui/icons-material/ViewKanbanRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type PlaceholderSection = "budget" | "schedule" | "team" | "directory" | "resources";

interface PlaceholderContent {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  highlights: string[];
  primaryLabel: string;
  primaryTo: string;
  secondaryLabel: string;
  secondaryTo: string;
}

function getContent(section: PlaceholderSection, panel: string | null): PlaceholderContent {
  if (section === "resources") {
    if (panel === "support") {
      return {
        eyebrow: "Operator Support",
        title: "Support Center",
        description:
          "Route field questions, integration issues, and demo prep requests through a single workspace handoff.",
        icon: <SupportAgentRoundedIcon sx={{ fontSize: 32 }} />,
        highlights: ["Live webhook diagnostics", "Escalation templates", "Demo environment checklist"],
        primaryLabel: "Open Integrations",
        primaryTo: "/app/integrations",
        secondaryLabel: "View Public Site",
        secondaryTo: "/"
      };
    }

    if (panel === "archive") {
      return {
        eyebrow: "Historical Records",
        title: "Archive Workspace",
        description:
          "Review completed projects, old change orders, and audit trails without cluttering the active command center.",
        icon: <Inventory2RoundedIcon sx={{ fontSize: 32 }} />,
        highlights: ["Completed project snapshots", "Archived sync logs", "Closed-out commercial history"],
        primaryLabel: "Back to Projects",
        primaryTo: "/app/projects",
        secondaryLabel: "View Change Orders",
        secondaryTo: "/app/change-orders"
      };
    }

    if (panel === "updates") {
      return {
        eyebrow: "Workspace Notifications",
        title: "System Updates",
        description:
          "Track sync alerts, approval nudges, and workflow notifications in one place during demos and review sessions.",
        icon: <PendingActionsRoundedIcon sx={{ fontSize: 32 }} />,
        highlights: ["Pending executive approvals", "Recent ERP syncs", "Integration retry notices"],
        primaryLabel: "Review Change Orders",
        primaryTo: "/app/change-orders",
        secondaryLabel: "Open Integrations",
        secondaryTo: "/app/integrations"
      };
    }

    if (panel === "api-docs") {
      return {
        eyebrow: "Technical References",
        title: "API & Webhook Docs",
        description:
          "Reference the integration model, webhook patterns, and operational notes that support the ChangeFlow demo stack.",
        icon: <AutoStoriesRoundedIcon sx={{ fontSize: 32 }} />,
        highlights: ["Webhook payload conventions", "Change order sync flow", "Audit log and status lifecycle"],
        primaryLabel: "Open Integrations",
        primaryTo: "/app/integrations",
        secondaryLabel: "Back to Resources",
        secondaryTo: "/app/resources"
      };
    }

    return {
      eyebrow: "Operational Library",
      title: "Resources Hub",
      description:
        "Keep onboarding docs, system notes, and support pathways close to the live product experience.",
      icon: <AutoStoriesRoundedIcon sx={{ fontSize: 32 }} />,
      highlights: ["Support workflows", "Archived project references", "API and webhook documentation"],
      primaryLabel: "Support Center",
      primaryTo: "/app/resources?panel=support",
      secondaryLabel: "Open API Docs",
      secondaryTo: "/app/resources?panel=api-docs"
    };
  }

  if (section === "directory") {
    return {
      eyebrow: "People & Roles",
      title: "Team Directory",
      description:
        "Surface project leaders, coordinators, and commercial owners so the right people are easy to find in demos.",
      icon: <GroupsRoundedIcon sx={{ fontSize: 32 }} />,
      highlights: ["Site leadership roster", "Commercial ownership map", "Architecture and field contacts"],
      primaryLabel: "Open Team Workspace",
      primaryTo: "/app/team",
      secondaryLabel: "View Projects",
      secondaryTo: "/app/projects"
    };
  }

  if (section === "budget") {
    return {
      eyebrow: "Financial Control",
      title: "Budget Workspace",
      description:
        "Review commercial impact, variance exposure, and contract health across the seeded project portfolio.",
      icon: <SavingsRoundedIcon sx={{ fontSize: 32 }} />,
      highlights: ["Portfolio-level cost variance", "High-value exposure tracking", "Contract utilization summaries"],
      primaryLabel: "Open Change Orders",
      primaryTo: "/app/change-orders",
      secondaryLabel: "Portfolio Overview",
      secondaryTo: "/app/projects"
    };
  }

  if (section === "schedule") {
    return {
      eyebrow: "Delivery Planning",
      title: "Schedule Workspace",
      description:
        "Use this area to connect activity planning with the commercial changes already seeded into the demo environment.",
      icon: <PendingActionsRoundedIcon sx={{ fontSize: 32 }} />,
      highlights: ["Milestone visibility", "Sequence and dependency planning", "Change-order impact review"],
      primaryLabel: "Open Projects",
      primaryTo: "/app/projects",
      secondaryLabel: "Review Change Orders",
      secondaryTo: "/app/change-orders"
    };
  }

  return {
    eyebrow: "Project Personnel",
    title: "Team Workspace",
    description:
      "Coordinate the on-site team, ownership structure, and accountability paths that support day-to-day project delivery.",
    icon: <ViewKanbanRoundedIcon sx={{ fontSize: 32 }} />,
    highlights: ["Role-based project coverage", "Team roster and ownership", "Quick navigation into project details"],
    primaryLabel: "Open Directory",
    primaryTo: "/app/directory",
    secondaryLabel: "Go to Projects",
    secondaryTo: "/app/projects"
  };
}

export function WorkspacePlaceholderPage({ section }: { section: PlaceholderSection }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const content = useMemo(
    () => getContent(section, searchParams.get("panel")),
    [searchParams, section]
  );

  return (
    <Stack spacing={4.5}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.3fr) 320px" },
          gap: 3.5
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3.5, md: 4.5 },
            borderRadius: 5,
            backgroundColor: "#FFFFFF",
            boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
          }}
        >
          <Typography
            sx={{
              fontSize: "0.82rem",
              fontWeight: 900,
              letterSpacing: 2.2,
              textTransform: "uppercase",
              color: "#046B5E"
            }}
          >
            {content.eyebrow}
          </Typography>
          <Typography
            sx={{
              mt: 1.8,
              fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
              fontSize: { xs: "3rem", md: "4.4rem" },
              fontWeight: 900,
              letterSpacing: -2.6,
              lineHeight: 0.94,
              color: "#00342B"
            }}
          >
            {content.title}
          </Typography>
          <Typography
            sx={{
              mt: 2.4,
              maxWidth: 760,
              fontSize: "1.14rem",
              lineHeight: 1.65,
              color: "#5A6A84"
            }}
          >
            {content.description}
          </Typography>

          <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" sx={{ mt: 4 }}>
            <ButtonBase
              onClick={() => navigate(content.primaryTo)}
              sx={{
                px: 3.4,
                py: 1.9,
                borderRadius: 3,
                background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)",
                color: "#FFFFFF",
                boxShadow: "0 18px 30px rgba(7,30,39,0.12)"
              }}
            >
              <Typography sx={{ fontSize: "1rem", fontWeight: 800 }}>{content.primaryLabel}</Typography>
            </ButtonBase>

            <ButtonBase
              onClick={() => navigate(content.secondaryTo)}
              sx={{
                px: 3.4,
                py: 1.9,
                borderRadius: 3,
                backgroundColor: "#D5ECF8",
                color: "#00342B"
              }}
            >
              <Typography sx={{ fontSize: "1rem", fontWeight: 800 }}>{content.secondaryLabel}</Typography>
            </ButtonBase>
          </Stack>
        </Paper>

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
          <Box
            sx={{
              width: 64,
              height: 64,
              display: "grid",
              placeItems: "center",
              borderRadius: 3,
              backgroundColor: "rgba(157,239,222,0.16)",
              color: "#AFEFDD"
            }}
          >
            {content.icon}
          </Box>

          <Typography
            sx={{
              mt: 3.5,
              fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
              fontSize: "1.9rem",
              fontWeight: 800,
              letterSpacing: -1.1
            }}
          >
            What’s Ready
          </Typography>

          <Stack spacing={2} sx={{ mt: 3 }}>
            {content.highlights.map((item) => (
              <Stack key={item} direction="row" spacing={1.3} alignItems="center">
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: "#9DEFDE"
                  }}
                />
                <Typography sx={{ fontSize: "1rem", color: "rgba(255,255,255,0.86)" }}>{item}</Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 3.5, md: 4 },
          borderRadius: 5,
          backgroundColor: "#D5ECF8",
          boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
            fontSize: "2rem",
            fontWeight: 800,
            letterSpacing: -1.1,
            color: "#00342B"
          }}
        >
          Demo Notes
        </Typography>
        <Typography sx={{ mt: 1.8, fontSize: "1rem", lineHeight: 1.7, color: "#42536D" }}>
          This route is intentionally lightweight for the student build, but it keeps every visible navigation
          control functional and gives you a clean place to expand the product later without breaking the demo.
        </Typography>
      </Paper>
    </Stack>
  );
}
