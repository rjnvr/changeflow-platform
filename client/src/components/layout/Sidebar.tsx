import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import ArchitectureRoundedIcon from "@mui/icons-material/ArchitectureRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import HelpRoundedIcon from "@mui/icons-material/HelpRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import SyncAltRoundedIcon from "@mui/icons-material/SyncAltRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useLocation, useNavigate } from "react-router-dom";

const navigationItems = [
  {
    label: "Dashboard",
    to: "/app/dashboard",
    icon: <DashboardRoundedIcon />,
    matches: (pathname: string) => pathname === "/app" || pathname.startsWith("/app/dashboard")
  },
  {
    label: "Projects",
    to: "/app/projects",
    icon: <Inventory2RoundedIcon />,
    matches: (pathname: string) => pathname.startsWith("/app/projects")
  },
  {
    label: "Change Orders",
    to: "/app/change-orders",
    icon: <SyncAltRoundedIcon />,
    matches: (pathname: string) => pathname.startsWith("/app/change-orders")
  },
  {
    label: "Budget",
    to: "/app/budget",
    icon: <PaymentsRoundedIcon />,
    matches: (pathname: string) => pathname.startsWith("/app/budget")
  },
  {
    label: "Schedule",
    to: "/app/schedule",
    icon: <EventAvailableRoundedIcon />,
    matches: (pathname: string) => pathname.startsWith("/app/schedule")
  },
  {
    label: "Integrations",
    to: "/app/integrations",
    icon: <SyncAltRoundedIcon />,
    matches: (pathname: string) => pathname.startsWith("/app/integrations")
  },
  {
    label: "Team",
    to: "/app/team",
    icon: <GroupRoundedIcon />,
    matches: (pathname: string) => pathname.startsWith("/app/team") || pathname.startsWith("/app/directory")
  }
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

const drawerWidth = 272;

const profileImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAb9wofY1rySXN7XfuW_vEt_K9q_KpzKPkF3salIWTrTsWtfAskl8fqg_8wqhes0FtcsqNYMeMXx9rEPjg8-tjVAGs9f-qF-Ni-3QwOzFCDwQYFll7rsdWfp-j6QJX_Z3wBpe2aZnARkgV95EYEfnZcIFtTuUT4RFgtbfWcvUvtpOgw6mgcaRCgBnNqS9uZi20Z5q8SCEbbwZ2CoLf4op5unmGO9JbuEpwzMj1T_SZk5pxHjQsrPM3335OT-6eUn4l2R2mA-KFIBsB4";

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  function navigateShell(path: string) {
    onClose();

    if (`${location.pathname}${location.search}` === path) {
      return;
    }

    navigate(path);
  }

  const content = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        px: 3,
        py: 3.2,
        backgroundColor: "#F3FAFF",
        color: "#071E27"
      }}
    >
      <Box sx={{ mb: 4.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              backgroundColor: "#00342B",
              color: "common.white"
            }}
          >
            <ArchitectureRoundedIcon />
          </Box>
          <Box>
            <Typography
              sx={{
                fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                fontSize: "1.25rem",
                fontWeight: 700,
                letterSpacing: -0.8,
                color: "#00342B"
              }}
            >
              ChangeFlow
            </Typography>
            <Typography
              sx={{
                fontSize: "0.62rem",
                fontWeight: 800,
                letterSpacing: 2.2,
                textTransform: "uppercase",
                color: "#046B5E"
              }}
            >
              Intelligence
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.6,
          p: 2,
          borderRadius: 3,
          backgroundColor: "#DBF1FE",
          mb: 3.6
        }}
      >
        <Box
          component="img"
          src={profileImage}
          alt="Project Alpha profile"
          sx={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            objectFit: "cover"
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.78rem",
              fontWeight: 800,
              letterSpacing: 1.8,
              textTransform: "uppercase",
              color: "#046B5E"
            }}
          >
            Project Alpha
          </Typography>
          <Typography sx={{ mt: 0.2, fontSize: "1rem", color: "#42536D" }}>
            Construction Site 104
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0 }}>
        <Stack spacing={0.8}>
          {navigationItems.map((item) => {
            const active = item.matches ? item.matches(location.pathname) : false;

            return (
              <ButtonBase
                key={item.label}
                onClick={
                  item.to
                    ? () => {
                        navigateShell(item.to);
                      }
                    : undefined
                }
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 1.75,
                  px: 2.2,
                  py: 1.6,
                  borderRadius: 3,
                  cursor: item.to ? "pointer" : "default",
                  color: active ? "#00342B" : "#42536D",
                  backgroundColor: active ? "#FFFFFF" : "transparent",
                  boxShadow: active ? "0 8px 18px rgba(7,30,39,0.04)" : "none",
                  transition: "all 180ms ease",
                  "&:hover": item.to
                    ? {
                        transform: "translateX(4px)",
                        backgroundColor: active ? "#FFFFFF" : "#DBF1FE"
                      }
                    : undefined
                }}
              >
                <Box sx={{ display: "grid", placeItems: "center", color: active ? "#00342B" : "#42536D" }}>
                  {item.icon}
                </Box>
                <Typography
                  sx={{
                    fontFamily: '"Inter", "Manrope", sans-serif',
                    fontSize: "1rem",
                    fontWeight: active ? 700 : 500
                  }}
                >
                  {item.label}
                </Typography>
              </ButtonBase>
            );
          })}
        </Stack>
      </Box>

      <Box sx={{ pt: 3 }}>
        <Divider sx={{ mb: 3, borderColor: "#D5ECF8" }} />

        <Stack spacing={1.6}>
          {[
            { label: "Support", icon: <HelpRoundedIcon sx={{ fontSize: 18 }} />, to: "/app/resources?panel=support" },
            { label: "Archive", icon: <ArchiveRoundedIcon sx={{ fontSize: 18 }} />, to: "/app/resources?panel=archive" },
            { label: "Public Site", icon: <LaunchRoundedIcon sx={{ fontSize: 18 }} />, to: "/" }
          ].map((item) => (
            <ButtonBase
              key={item.label}
              onClick={
                item.to
                  ? () => {
                      navigateShell(item.to);
                    }
                  : undefined
              }
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 1.2,
                cursor: item.to ? "pointer" : "default",
                color: "#5A6A84",
                "&:hover": item.to
                  ? {
                      color: "#00342B"
                    }
                  : undefined
              }}
            >
              {item.icon}
              <Typography
                sx={{
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase"
                }}
              >
                {item.label}
              </Typography>
            </ButtonBase>
          ))}
        </Stack>
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          zIndex: (theme) => theme.zIndex.drawer + 2,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            border: "none",
            backgroundColor: "#F3FAFF",
            pointerEvents: "auto"
          }
        }}
      >
        {content}
      </Drawer>

      <Box
        component="aside"
        sx={{
          display: { xs: "none", md: "block" },
          position: "fixed",
          inset: "0 auto 0 0",
          width: drawerWidth,
          zIndex: (theme) => theme.zIndex.drawer + 2,
          backgroundColor: "#F3FAFF",
          borderRight: "1px solid rgba(213,236,248,0.9)",
          pointerEvents: "auto"
        }}
      >
        {content}
      </Box>
    </>
  );
}

export const sidebarWidth = drawerWidth;
