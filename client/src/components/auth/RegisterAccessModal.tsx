import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

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

interface RegisterAccessModalProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (input: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  }) => Promise<void>;
}

export function RegisterAccessModal({
  open,
  loading = false,
  onClose,
  onSubmit
}: RegisterAccessModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
  }, [open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || password.length < 8) {
      setError("Add your name, work email, and a password with at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");

    try {
      await onSubmit({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create your account.");
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
          onSubmit={handleSubmit}
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
                <PersonAddAltRoundedIcon sx={{ color: "#046B5E" }} />
                <Typography
                  sx={{
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: { xs: "2rem", md: "2.6rem" },
                    fontWeight: 900,
                    letterSpacing: -1.4,
                    color: "#00342B"
                  }}
                >
                  Request Platform Access
                </Typography>
              </Stack>
              <Typography sx={{ mt: 1, fontSize: "1rem", color: "#42536D" }}>
                Create a local ChangeFlow account and sign in immediately.
              </Typography>
            </Box>
            <IconButton onClick={onClose} sx={{ color: "#707975" }}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          <Stack spacing={2.8} sx={{ px: { xs: 3, md: 4 }, py: 4 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="First Name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                sx={fieldStyles}
              />
              <TextField
                fullWidth
                label="Last Name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                sx={fieldStyles}
              />
            </Stack>

            <TextField
              fullWidth
              type="email"
              label="Work Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              sx={fieldStyles}
            />

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                type="password"
                label="Password"
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
              disabled={loading}
              sx={{
                minWidth: 200,
                py: 1.4,
                borderRadius: 2.5,
                fontWeight: 800,
                background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)"
              }}
            >
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
