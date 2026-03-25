import AddRoundedIcon from "@mui/icons-material/AddRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { useAuthContext } from "../../context/AuthContext";
import { AccountPopover } from "./AccountPopover";
import { getUserInitials } from "./accountUtils";
import { Button } from "../common/Button";

interface TopbarProps {
  onMenuClick: () => void;
}

interface TopbarTab {
  id: string;
  label: string;
  to?: string;
}

const tabs: TopbarTab[] = [
  { id: "projects", label: "Projects", to: "/app/projects" },
  { id: "analytics", label: "Analytics", to: "/app/integrations" },
  { id: "directory", label: "Directory", to: "/app/directory" },
  { id: "resources", label: "Resources", to: "/app/resources" }
];

function getRouteMeta(pathname: string) {
  if (/^\/app\/change-orders\/[^/]+$/.test(pathname)) {
    return {
      title: null,
      activeTab: "projects",
      searchPlaceholder: null
    } as const;
  }

  if (/^\/app\/projects\/[^/]+$/.test(pathname)) {
    return {
      title: null,
      activeTab: "projects",
      searchPlaceholder: null
    } as const;
  }

  if (pathname.startsWith("/app/integrations")) {
    return {
      title: "Integrations Center",
      activeTab: "analytics",
      searchPlaceholder: null
    } as const;
  }

  if (pathname.startsWith("/app/change-orders")) {
    return {
      title: null,
      activeTab: "projects",
      searchPlaceholder: "Search orders..."
    } as const;
  }

  if (pathname.startsWith("/app/directory")) {
    return {
      title: null,
      activeTab: "directory",
      searchPlaceholder: "Search people or contacts..."
    } as const;
  }

  if (pathname.startsWith("/app/resources")) {
    return {
      title: null,
      activeTab: "resources",
      searchPlaceholder: "Search resources..."
    } as const;
  }

  if (pathname.startsWith("/app/api-docs")) {
    return {
      title: "API Docs",
      activeTab: "resources",
      searchPlaceholder: null
    } as const;
  }

  if (
    pathname.startsWith("/app/dashboard") ||
    pathname.startsWith("/app/budget") ||
    pathname.startsWith("/app/schedule") ||
    pathname.startsWith("/app/team") ||
    pathname === "/app"
  ) {
    return {
      title: null,
      activeTab: "projects",
      searchPlaceholder: null
    } as const;
  }

  if (pathname.startsWith("/app/projects")) {
    return {
      title: null,
      activeTab: "projects",
      searchPlaceholder: "Search projects or documents..."
    } as const;
  }

  return {
    title: null,
    activeTab: "projects",
    searchPlaceholder: null
  } as const;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthContext();
  const [accountAnchorEl, setAccountAnchorEl] = useState<HTMLElement | null>(null);
  const routeMeta = getRouteMeta(location.pathname);
  const avatarLabel = getUserInitials(user?.firstName, user?.lastName);
  const searchValue = searchParams.get("search") ?? "";

  useEffect(() => {
    setAccountAnchorEl(null);
  }, [location.pathname, location.search]);

  function handleSearchChange(nextValue: string) {
    const next = new URLSearchParams(searchParams);

    if (nextValue.trim()) {
      next.set("search", nextValue);
    } else {
      next.delete("search");
    }

    setSearchParams(next, { replace: true });
  }

  function navigateShell(path: string) {
    setAccountAnchorEl(null);

    if (`${location.pathname}${location.search}` === path) {
      return;
    }

    navigate(path);
  }

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        px: { xs: 2, md: 4 },
        py: { xs: 1.5, md: 0 },
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 10px 24px rgba(7,30,39,0.04)"
      }}
    >
      <Box
        sx={{
          minHeight: { xs: 84, md: 92 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2.5,
          flexWrap: "wrap",
          py: { xs: 0.5, md: 0 }
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          useFlexGap
          flexWrap="wrap"
          sx={{ minWidth: 0, flex: 1 }}
        >
          <IconButton onClick={onMenuClick} sx={{ display: { md: "none" } }}>
            <MenuRoundedIcon />
          </IconButton>

          {routeMeta.title ? (
            <Typography
              sx={{
                display: { xs: "none", md: "block" },
                mr: { md: 1.5 },
                fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                fontSize: { md: "2rem", lg: "2.35rem" },
                fontWeight: 900,
                letterSpacing: -1.8,
                color: "#00342B"
              }}
            >
              {routeMeta.title}
            </Typography>
          ) : null}

          <Stack
            direction="row"
            spacing={3.5}
            alignItems="center"
            sx={{
              display: { xs: "none", lg: "flex" },
              minWidth: 0
            }}
          >
            {tabs.map((tab) => {
              const active = tab.id === routeMeta.activeTab;

              return (
                <Box
                  key={tab.id}
                  onClick={() => {
                    if (tab.to) {
                      navigateShell(tab.to);
                    }
                  }}
                  sx={{
                    pb: 0.65,
                    borderBottom: active ? "2px solid #046B5E" : "2px solid transparent",
                    color: active ? "#00342B" : "#5A6A84",
                    cursor: tab.to ? "pointer" : "default",
                    transition: "all 160ms ease",
                    "&:hover": tab.to
                      ? {
                          color: "#00342B"
                        }
                      : undefined
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "1rem",
                      fontWeight: active ? 800 : 700
                    }}
                  >
                    {tab.label}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Stack>

        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="flex-end"
          useFlexGap
          flexWrap="wrap"
          sx={{ minWidth: 0 }}
        >
          {routeMeta.searchPlaceholder ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                width: { xs: "100%", sm: 320, lg: 360 },
                maxWidth: "100%",
                px: 2,
                py: 1.15,
                borderRadius: 999,
                backgroundColor: "#D5ECF8"
              }}
            >
              <SearchRoundedIcon sx={{ color: "#7A869F" }} />
              <InputBase
                placeholder={routeMeta.searchPlaceholder}
                value={searchValue}
                onChange={(event) => handleSearchChange(event.target.value)}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: "0.98rem",
                  color: "#42536D"
                }}
              />
            </Box>
          ) : null}

          <Box sx={{ position: "relative" }}>
            <IconButton
              onClick={() => navigateShell("/app/resources?panel=updates")}
              sx={{
                color: "#5A6A84",
                "&:hover": {
                  backgroundColor: "#F3FAFF"
                }
              }}
            >
              <NotificationsNoneRoundedIcon />
            </IconButton>
            <Box
              sx={{
                position: "absolute",
                top: 9,
                right: 9,
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#7A1E08"
              }}
            />
          </Box>

          <IconButton
            onClick={() => navigateShell("/app/integrations")}
            sx={{
              color: "#5A6A84",
              "&:hover": {
                backgroundColor: "#F3FAFF"
              }
            }}
          >
            <SettingsRoundedIcon />
          </IconButton>

          <Button
            onClick={() => navigateShell("/app/change-orders?new=1")}
            startIcon={<AddRoundedIcon />}
            sx={{
              px: 3,
              py: 1.35,
              borderRadius: 2.5,
              fontWeight: 800,
              fontSize: "1rem",
              color: "common.white",
              background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #002A23 0%, #003E34 100%)"
              }
            }}
          >
            New Change Order
          </Button>

          <IconButton
            onClick={(event) => {
              setAccountAnchorEl((currentAnchorEl) => (currentAnchorEl ? null : event.currentTarget));
            }}
            aria-label="Open account settings"
            aria-expanded={Boolean(accountAnchorEl)}
            aria-haspopup="dialog"
            sx={{
              p: 0.25,
              border: "1px solid rgba(4,107,94,0.12)",
              boxShadow: "0 8px 20px rgba(7,30,39,0.08)",
              "&:hover": {
                backgroundColor: "#F3FAFF"
              }
            }}
          >
            <Avatar
              alt={`${user?.firstName ?? "ChangeFlow"} ${user?.lastName ?? "User"}`}
              sx={{
                width: 40,
                height: 40,
                bgcolor: "#00342B",
                color: "common.white",
                fontWeight: 800
              }}
            >
              {avatarLabel}
            </Avatar>
          </IconButton>
        </Stack>
      </Box>

      <AccountPopover anchorEl={accountAnchorEl} open={Boolean(accountAnchorEl)} onClose={() => setAccountAnchorEl(null)} />
    </Box>
  );
}
