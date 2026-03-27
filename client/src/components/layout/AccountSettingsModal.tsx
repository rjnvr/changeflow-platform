import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { useAuthContext } from "../../context/AuthContext";
import { PROTECTED_DEMO_EMAILS } from "../../utils/constants";
import { Button } from "../common/Button";

interface AccountSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const fieldStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    backgroundColor: "#E6F6FF",
    "& fieldset": {
      borderColor: "rgba(191,201,196,0.24)"
    },
    "&:hover fieldset": {
      borderColor: "rgba(4,107,94,0.28)"
    },
    "&.Mui-focused fieldset": {
      borderColor: "#046B5E"
    }
  }
} as const;

export function AccountSettingsModal({ open, onClose }: AccountSettingsModalProps) {
  const { user, updateProfile, changePassword, loading } = useAuthContext();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (!open || !user) {
      return;
    }

    setEmail(user.email);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setProfileMessage("");
    setPasswordMessage("");
    setProfileError("");
    setPasswordError("");
  }, [open, user]);

  const isDemoAccount = useMemo(
    () => Boolean(user?.email && PROTECTED_DEMO_EMAILS.includes(user.email.toLowerCase())),
    [user?.email]
  );

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setProfileError("First name, last name, and email are required.");
      return;
    }

    setProfileError("");
    setProfileMessage("");

    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase()
      });
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Unable to update your profile.");
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentPassword || !newPassword) {
      setPasswordError("Add your current password and a new password.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setPasswordError("");
    setPasswordMessage("");

    try {
      const response = await changePassword({
        currentPassword,
        newPassword
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage(response.message);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Unable to change your password.");
    }
  }

  return (
    <Modal open={open} onClose={onClose} sx={{ zIndex: 1500 }}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, md: 4 },
          backgroundColor: "rgba(0,52,43,0.16)",
          backdropFilter: "blur(8px)"
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 920,
            maxHeight: "92vh",
            overflow: "hidden",
            borderRadius: 6,
            backgroundColor: "#FFFFFF",
            boxShadow: "0 32px 64px rgba(7,30,39,0.18)"
          }}
        >
          <Box
            sx={{
              px: { xs: 3, md: 5 },
              py: 3.5,
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              alignItems: "flex-start",
              borderBottom: "1px solid rgba(191,201,196,0.18)"
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontSize: { xs: "2rem", md: "3rem" },
                  fontWeight: 900,
                  letterSpacing: -1.8,
                  color: "#00342B"
                }}
              >
                Account Center
              </Typography>
              <Typography sx={{ mt: 1, fontSize: "1rem", color: "#42536D" }}>
                Update your profile details and manage account security without leaving the workspace.
              </Typography>
            </Box>
            <IconButton onClick={onClose} sx={{ color: "#707975" }}>
              <CloseRoundedIcon sx={{ fontSize: 32 }} />
            </IconButton>
          </Box>

          <Box sx={{ px: { xs: 3, md: 5 }, py: 4, maxHeight: "calc(92vh - 110px)", overflowY: "auto" }}>
            <Stack spacing={3.5}>
              {isDemoAccount ? (
                <Alert severity="info">
                  Seeded demo accounts are read-only for profile and password changes. Use Request Platform Access to create a local account for full account-management testing.
                </Alert>
              ) : null}

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
                  gap: 3
                }}
              >
                <Box
                  component="form"
                  onSubmit={handleProfileSubmit}
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    backgroundColor: "#F3FAFF",
                    border: "1px solid rgba(213,236,248,0.92)"
                  }}
                >
                  <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 3 }}>
                    <ManageAccountsRoundedIcon sx={{ color: "#046B5E" }} />
                    <Typography
                      sx={{
                        fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                        fontSize: "1.55rem",
                        fontWeight: 800,
                        letterSpacing: -0.9,
                        color: "#00342B"
                      }}
                    >
                      Profile Details
                    </Typography>
                  </Stack>

                  <Stack spacing={2.2}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      disabled={isDemoAccount}
                      sx={fieldStyles}
                    />
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      disabled={isDemoAccount}
                      sx={fieldStyles}
                    />
                    <TextField
                      fullWidth
                      type="email"
                      label="Work Email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={isDemoAccount}
                      sx={fieldStyles}
                    />

                    {profileMessage ? <Alert severity="success">{profileMessage}</Alert> : null}
                    {profileError ? <Alert severity="error">{profileError}</Alert> : null}

                    <Button
                      type="submit"
                      disabled={loading || isDemoAccount}
                      sx={{
                        py: 1.35,
                        borderRadius: 2.5,
                        fontWeight: 800,
                        background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)"
                      }}
                    >
                      {loading ? "Saving..." : "Save Profile"}
                    </Button>
                  </Stack>
                </Box>

                <Box
                  component="form"
                  onSubmit={handlePasswordSubmit}
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    backgroundColor: "#F8FCFF",
                    border: "1px solid rgba(213,236,248,0.92)"
                  }}
                >
                  <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 3 }}>
                    <LockRoundedIcon sx={{ color: "#7A1E08" }} />
                    <Typography
                      sx={{
                        fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                        fontSize: "1.55rem",
                        fontWeight: 800,
                        letterSpacing: -0.9,
                        color: "#00342B"
                      }}
                    >
                      Security
                    </Typography>
                  </Stack>

                  <Stack spacing={2.2}>
                    <TextField
                      fullWidth
                      type="password"
                      label="Current Password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      disabled={isDemoAccount}
                      sx={fieldStyles}
                    />
                    <TextField
                      fullWidth
                      type="password"
                      label="New Password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      disabled={isDemoAccount}
                      sx={fieldStyles}
                    />
                    <TextField
                      fullWidth
                      type="password"
                      label="Confirm New Password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      disabled={isDemoAccount}
                      sx={fieldStyles}
                    />

                    {passwordMessage ? <Alert severity="success">{passwordMessage}</Alert> : null}
                    {passwordError ? <Alert severity="error">{passwordError}</Alert> : null}

                    <Button
                      type="submit"
                      disabled={loading || isDemoAccount}
                      sx={{
                        py: 1.35,
                        borderRadius: 2.5,
                        fontWeight: 800,
                        background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)"
                      }}
                    >
                      {loading ? "Updating..." : "Change Password"}
                    </Button>
                  </Stack>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
