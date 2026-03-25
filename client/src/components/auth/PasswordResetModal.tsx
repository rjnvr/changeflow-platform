import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { requestPasswordReset, resetPassword } from "../../api/auth";
import { DEMO_CREDENTIALS } from "../../utils/constants";
import { Button } from "../common/Button";

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

interface PasswordResetModalProps {
  open: boolean;
  onClose: () => void;
  onCompleted?: (message: string) => void;
  initialEmail?: string;
  initialToken?: string;
}

export function PasswordResetModal({
  open,
  onClose,
  onCompleted,
  initialEmail,
  initialToken
}: PasswordResetModalProps) {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setEmail(initialEmail ?? "");
    setToken(initialToken ?? "");
    setPassword("");
    setConfirmPassword("");
    setInfo(initialToken ? "Reset link loaded. Set a new password below." : "");
    setError("");
    setResetRequested(Boolean(initialToken));
  }, [initialEmail, initialToken, open]);

  async function handleRequestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setError("Enter the email for the account you want to reset.");
      return;
    }

    if (email.trim().toLowerCase() === DEMO_CREDENTIALS.email) {
      setError("Password reset is disabled for the demo account. Sign in with the default demo credentials instead.");
      setInfo("");
      setResetRequested(false);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await requestPasswordReset(email.trim());
      setResetRequested(true);
      setInfo(response.message);

      if (response.previewToken) {
        setToken(response.previewToken);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to prepare the reset flow.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token.trim() || password.length < 8) {
      setError("Add the reset token and a new password with at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await resetPassword({
        token: token.trim(),
        password
      });
      onCompleted?.(response.message);
      onClose();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to reset the password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} sx={{ zIndex: 1400 }}>
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
          component="form"
          onSubmit={resetRequested ? handleResetPassword : handleRequestReset}
          sx={{
            width: "100%",
            maxWidth: 620,
            borderRadius: 6,
            backgroundColor: "#FFFFFF",
            boxShadow: "0 32px 64px rgba(7,30,39,0.18)",
            overflow: "hidden"
          }}
        >
          <Box
            sx={{
              px: { xs: 3, md: 4 },
              py: 3,
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              alignItems: "flex-start",
              borderBottom: "1px solid rgba(191,201,196,0.18)"
            }}
          >
            <Box>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <LockResetRoundedIcon sx={{ color: "#046B5E" }} />
                <Typography
                  sx={{
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: { xs: "2rem", md: "2.6rem" },
                    fontWeight: 900,
                    letterSpacing: -1.4,
                    color: "#00342B"
                  }}
                >
                  Reset Password
                </Typography>
              </Stack>
              <Typography sx={{ mt: 1, fontSize: "1rem", color: "#42536D" }}>
                {resetRequested
                  ? "Enter the reset token and set a new password."
                  : "Request a reset token for a local ChangeFlow account. Demo credentials stay fixed and cannot be reset."}
              </Typography>
            </Box>
            <IconButton onClick={onClose} sx={{ color: "#707975" }}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          <Stack spacing={2.8} sx={{ px: { xs: 3, md: 4 }, py: 4 }}>
            <TextField
              fullWidth
              type="email"
              label="Work Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={resetRequested}
              sx={fieldStyles}
            />

            {resetRequested ? (
              <>
                <TextField
                  fullWidth
                  label="Reset Token"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  sx={fieldStyles}
                />
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    fullWidth
                    type="password"
                    label="New Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    sx={fieldStyles}
                  />
                  <TextField
                    fullWidth
                    type="password"
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    sx={fieldStyles}
                  />
                </Stack>
              </>
            ) : null}

            {info ? <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, color: "#046B5E" }}>{info}</Typography> : null}
            {error ? <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, color: "#872000" }}>{error}</Typography> : null}
          </Stack>

          <Box
            sx={{
              px: { xs: 3, md: 4 },
              py: 3,
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              flexWrap: "wrap",
              backgroundColor: "#E6F6FF"
            }}
          >
            <Button
              type="button"
              variant="outlined"
              onClick={onClose}
              sx={{
                minWidth: 140,
                py: 1.4,
                borderRadius: 2.5,
                borderColor: "rgba(0,52,43,0.12)",
                color: "#00342B",
                backgroundColor: "#FFFFFF"
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              sx={{
                minWidth: 220,
                py: 1.4,
                borderRadius: 2.5,
                fontWeight: 800,
                background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)"
              }}
            >
              {submitting
                ? resetRequested
                  ? "Resetting..."
                  : "Preparing..."
                : resetRequested
                  ? "Set New Password"
                  : "Request Reset Token"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
