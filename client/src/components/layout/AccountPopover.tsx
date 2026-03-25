import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthContext } from "../../context/AuthContext";
import { WORKSPACE_PREFERENCES_KEY } from "../../utils/constants";
import { Button } from "../common/Button";
import { AccountSettingsModal } from "./AccountSettingsModal";

interface AccountPopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

interface WorkspacePreferences {
  emailNotifications: boolean;
  approvalAlerts: boolean;
  compactTables: boolean;
}

const defaultPreferences: WorkspacePreferences = {
  emailNotifications: true,
  approvalAlerts: true,
  compactTables: false
};

function readStoredPreferences(): WorkspacePreferences {
  const rawPreferences = localStorage.getItem(WORKSPACE_PREFERENCES_KEY);

  if (!rawPreferences) {
    return defaultPreferences;
  }

  try {
    const parsed = JSON.parse(rawPreferences) as Partial<WorkspacePreferences>;

    return {
      emailNotifications: parsed.emailNotifications ?? defaultPreferences.emailNotifications,
      approvalAlerts: parsed.approvalAlerts ?? defaultPreferences.approvalAlerts,
      compactTables: parsed.compactTables ?? defaultPreferences.compactTables
    };
  } catch {
    return defaultPreferences;
  }
}

function formatRoleLabel(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function PreferenceRow({
  title,
  description,
  checked,
  onChange
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Stack
      direction="row"
      spacing={1.75}
      alignItems="center"
      justifyContent="space-between"
      sx={{
        px: 1.8,
        py: 1.5,
        borderRadius: 3,
        backgroundColor: "#F3FAFF",
        border: "1px solid #D5ECF8"
      }}
    >
      <Box sx={{ minWidth: 0, pr: 1.5 }}>
        <Typography sx={{ fontSize: "0.96rem", fontWeight: 700, color: "#00342B" }}>{title}</Typography>
        <Typography sx={{ mt: 0.35, fontSize: "0.86rem", lineHeight: 1.5, color: "#5A6A84" }}>
          {description}
        </Typography>
      </Box>
      <Switch checked={checked} onChange={(_, nextValue) => onChange(nextValue)} />
    </Stack>
  );
}

export function AccountPopover({ anchorEl, open, onClose }: AccountPopoverProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [storedPreferences, setStoredPreferences] = useState<WorkspacePreferences>(defaultPreferences);
  const [draftPreferences, setDraftPreferences] = useState<WorkspacePreferences>(defaultPreferences);
  const [statusMessage, setStatusMessage] = useState("Profile settings are saved locally on this device.");

  useEffect(() => {
    const currentPreferences = readStoredPreferences();

    setStoredPreferences(currentPreferences);

    if (open) {
      setDraftPreferences(currentPreferences);
      setStatusMessage("Profile settings are saved locally on this device.");
    }
  }, [open]);

  const userInitials = useMemo(() => {
    if (!user) {
      return "CF";
    }

    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }, [user]);

  const fullName = user ? `${user.firstName} ${user.lastName}` : "ChangeFlow User";

  function updatePreference<Key extends keyof WorkspacePreferences>(key: Key, value: WorkspacePreferences[Key]) {
    setDraftPreferences((currentPreferences) => ({
      ...currentPreferences,
      [key]: value
    }));
    setStatusMessage("Unsaved changes");
  }

  function handleSave() {
    localStorage.setItem(WORKSPACE_PREFERENCES_KEY, JSON.stringify(draftPreferences));
    setStoredPreferences(draftPreferences);
    setStatusMessage("Settings saved to this browser.");
  }

  function handleRestoreDefaults() {
    setDraftPreferences(defaultPreferences);
    setStatusMessage("Defaults restored. Save to apply.");
  }

  function handleNavigate(pathname: string) {
    onClose();
    navigate(pathname);
  }

  function handleSignOut() {
    onClose();
    logout();
    navigate("/login", { replace: true });
  }

  function handleOpenAccountCenter() {
    onClose();
    setAccountSettingsOpen(true);
  }

  const hasUnsavedChanges =
    draftPreferences.emailNotifications !== storedPreferences.emailNotifications ||
    draftPreferences.approvalAlerts !== storedPreferences.approvalAlerts ||
    draftPreferences.compactTables !== storedPreferences.compactTables;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          sx: {
            mt: 1.25,
            width: 390,
            maxWidth: "calc(100vw - 24px)",
            maxHeight: "calc(100vh - 24px)",
            borderRadius: 4,
            border: "1px solid rgba(213,236,248,0.95)",
            boxShadow: "0 28px 54px rgba(7,30,39,0.16)",
            overflow: "hidden"
          }
        }
      }}
    >
      <Box
        sx={{
          p: 2.4,
          maxHeight: "calc(100vh - 24px)",
          overflowY: "auto"
        }}
      >
        <Stack spacing={2.2}>
          <Stack direction="row" spacing={1.4} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                backgroundColor: "#00342B",
                color: "common.white"
              }}
            >
              <ManageAccountsRoundedIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  letterSpacing: -0.7,
                  color: "#00342B"
                }}
              >
                Account Settings
              </Typography>
              <Typography sx={{ mt: 0.35, fontSize: "0.9rem", color: "#5A6A84" }}>
                Manage your profile session and workspace preferences.
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              p: 2,
              borderRadius: 3.25,
              background: "linear-gradient(180deg, #F3FAFF 0%, #FFFFFF 100%)",
              border: "1px solid #D5ECF8"
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                sx={{
                  width: 54,
                  height: 54,
                  bgcolor: "#00342B",
                  color: "common.white",
                  fontWeight: 800
                }}
              >
                {userInitials}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>{fullName}</Typography>
                <Typography sx={{ mt: 0.35, fontSize: "0.9rem", color: "#5A6A84" }}>{user?.email}</Typography>
                <Chip
                  size="small"
                  label={formatRoleLabel(user?.role ?? "project_manager")}
                  sx={{
                    mt: 1,
                    width: "fit-content",
                    bgcolor: "#DBF1FE",
                    color: "#046B5E",
                    fontWeight: 700
                  }}
                />
              </Box>
            </Stack>
          </Box>

          <Divider sx={{ borderColor: "#D5ECF8" }} />

          <Button
            variant="outlined"
            startIcon={<ManageAccountsRoundedIcon />}
            onClick={handleOpenAccountCenter}
            sx={{
              py: 1.2,
              borderColor: "#BFD8E8",
              color: "#00342B",
              backgroundColor: "#FFFFFF",
              "&:hover": {
                borderColor: "#89B7D3",
                backgroundColor: "#F3FAFF"
              }
            }}
          >
            Open Account Center
          </Button>

          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <TuneRoundedIcon sx={{ fontSize: 20, color: "#046B5E" }} />
              <Typography sx={{ fontSize: "0.92rem", fontWeight: 800, letterSpacing: 1.1, textTransform: "uppercase" }}>
                Workspace Preferences
              </Typography>
            </Stack>

            <Stack spacing={1.2}>
              <PreferenceRow
                title="Email notifications"
                description="Receive change-order reminders and portfolio updates in your inbox."
                checked={draftPreferences.emailNotifications}
                onChange={(checked) => updatePreference("emailNotifications", checked)}
              />
              <PreferenceRow
                title="Approval alerts"
                description="Highlight review-ready and critical commercial variance activity."
                checked={draftPreferences.approvalAlerts}
                onChange={(checked) => updatePreference("approvalAlerts", checked)}
              />
              <PreferenceRow
                title="Compact tables"
                description="Use denser portfolio tables when you want more information on screen."
                checked={draftPreferences.compactTables}
                onChange={(checked) => updatePreference("compactTables", checked)}
              />
            </Stack>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <Button
              variant="outlined"
              onClick={() => handleNavigate("/app/team")}
              sx={{
                flex: 1,
                py: 1.15,
                borderColor: "#BFD8E8",
                color: "#00342B",
                backgroundColor: "#FFFFFF",
                "&:hover": {
                  borderColor: "#89B7D3",
                  backgroundColor: "#F3FAFF"
                }
              }}
            >
              Team Workspace
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleNavigate("/app/resources")}
              sx={{
                flex: 1,
                py: 1.15,
                borderColor: "#BFD8E8",
                color: "#00342B",
                backgroundColor: "#FFFFFF",
                "&:hover": {
                  borderColor: "#89B7D3",
                  backgroundColor: "#F3FAFF"
                }
              }}
            >
              Help & Resources
            </Button>
          </Stack>

          <Box
            sx={{
              px: 1.4,
              py: 1.15,
              borderRadius: 2.5,
              backgroundColor: hasUnsavedChanges ? "#FFF1EC" : "#ECFBF7",
              color: hasUnsavedChanges ? "#7A1E08" : "#046B5E"
            }}
          >
            <Typography sx={{ fontSize: "0.86rem", fontWeight: 700 }}>{statusMessage}</Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <Button
              variant="text"
              startIcon={<RestoreRoundedIcon />}
              onClick={handleRestoreDefaults}
              sx={{
                justifyContent: "flex-start",
                px: 0.5,
                color: "#5A6A84",
                "&:hover": {
                  backgroundColor: "transparent",
                  color: "#00342B"
                }
              }}
            >
              Restore defaults
            </Button>

            <Box sx={{ flex: 1 }} />

            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              sx={{
                minWidth: 150,
                px: 2.6,
                py: 1.15,
                color: "common.white",
                background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #002A23 0%, #003E34 100%)"
                }
              }}
            >
              Save Changes
            </Button>
          </Stack>

          <Box
            sx={{
              position: "sticky",
              bottom: -19.2,
              pt: 1.2,
              pb: 0.2,
              background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, #FFFFFF 24%)"
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<LogoutRoundedIcon />}
              onClick={handleSignOut}
              sx={{
                width: "100%",
                py: 1.2,
                borderColor: "#E4C6BE",
                color: "#7A1E08",
                backgroundColor: "#FFF7F3",
                "&:hover": {
                  borderColor: "#D7A899",
                  backgroundColor: "#FFF1EC"
                }
              }}
            >
              Sign Out
            </Button>
          </Box>
        </Stack>
      </Box>
      <AccountSettingsModal open={accountSettingsOpen} onClose={() => setAccountSettingsOpen(false)} />
    </Popover>
  );
}
