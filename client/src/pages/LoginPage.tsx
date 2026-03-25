import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import ArchitectureRoundedIcon from "@mui/icons-material/ArchitectureRounded";
import GoogleIcon from "@mui/icons-material/Google";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { PasswordResetModal } from "../components/auth/PasswordResetModal";
import { RegisterAccessModal } from "../components/auth/RegisterAccessModal";
import { Button } from "../components/common/Button";
import { useAuthContext } from "../context/AuthContext";
import { DEMO_CREDENTIALS } from "../utils/constants";

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC1WjgmscZDubehCjeB-ybbBpkF0i7dYtQYklSwRrZdOyPESHHI1va_0KYHHbxJBIh9MvGhvlgxifO8DubkDHGtABXawwVbDIA4gQfww2mKSwXPkBM3QKDUOr7wyVV2aaNab_nqKaj-4JYSXVtAcD6yEoCtquRajKLHI6CiROy23F2wzuC9kmjyiveqNQrMfWKH6fXiOCVsL3DGBg7OOPvfOr1p25xvd4kBunFe-She_96Ro70YSNbjIcQ8q6Y0zdCKeU1MqClgtZb6";

const statItems = [
  {
    value: "$4.2B+",
    label: "Project Volume Managed"
  },
  {
    value: "99.8%",
    label: "On-Budget Delivery"
  },
  {
    value: "15k+",
    label: "Active Field Engineers"
  }
];

const footerLinks = ["Privacy Policy", "Terms of Service", "System Status"];

const loginFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    backgroundColor: "#F4FAFE",
    boxShadow: "inset 0 0 0 1px rgba(159, 188, 203, 0.12)",
    "& fieldset": {
      border: "none"
    },
    "&:hover": {
      backgroundColor: "#EFF7FB"
    },
    "&.Mui-focused": {
      backgroundColor: "#FFFFFF",
      boxShadow: "0 0 0 2px rgba(4, 107, 94, 0.24)"
    }
  },
  "& .MuiOutlinedInput-input": {
    py: 2,
    px: 2.2,
    color: "#071E27"
  }
} as const;

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, login, register, loading } = useAuthContext();
  const [email, setEmail] = useState(DEMO_CREDENTIALS.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const resetTokenFromUrl = searchParams.get("resetToken")?.trim() ?? "";
  const resetEmailFromUrl = searchParams.get("resetEmail")?.trim() ?? "";

  useEffect(() => {
    if (!resetTokenFromUrl) {
      return;
    }

    setResetModalOpen(true);
    setInfoMessage("Your password reset link is ready. Set a new password to continue.");
  }, [resetTokenFromUrl]);

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  function handleResetModalClose() {
    setResetModalOpen(false);

    if (!resetTokenFromUrl && !resetEmailFromUrl) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("resetToken");
    nextSearchParams.delete("resetEmail");
    setSearchParams(nextSearchParams, { replace: true });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInfoMessage("");

    try {
      await login(email, password);
      navigate("/app/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in.");
    }
  }

  async function handleRegister(input: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  }) {
    setError("");
    setInfoMessage("");

    await register(input);
    setRegisterModalOpen(false);
    navigate("/app/dashboard");
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#F3FAFF" }}>
      <Box sx={{ display: "flex", minHeight: "100vh", flexDirection: { xs: "column", md: "row" } }}>
        <Box
          component="section"
          sx={{
            position: "relative",
            width: { xs: "100%", md: "50%", lg: "60%" },
            minHeight: { xs: 560, md: "100vh" },
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            px: { xs: 3, md: 6, lg: 10 },
            py: { xs: 4, md: 6, lg: 8 },
            color: "common.white",
            backgroundColor: "#00342B"
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${HERO_IMAGE})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.36,
              mixBlendMode: "luminosity"
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(48deg, rgba(0,52,43,0.96) 0%, rgba(0,52,43,0.82) 44%, rgba(0,52,43,0.26) 100%)"
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(to right, rgba(207,230,242,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(207,230,242,0.12) 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }}
          />

          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: { xs: 8, md: 14 } }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: "#9DEFDE",
                  color: "#0F6F62"
                }}
              >
                <ArchitectureRoundedIcon />
              </Box>
              <Typography
                sx={{
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontSize: { xs: "1.9rem", md: "2.15rem" },
                  fontWeight: 900,
                  letterSpacing: -1.2
                }}
              >
                ChangeFlow
              </Typography>
            </Stack>

            <Box sx={{ maxWidth: 760 }}>
              <Typography
                variant="h1"
                sx={{
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontWeight: 800,
                  fontSize: { xs: "3rem", sm: "4rem", lg: "5.6rem" },
                  lineHeight: 1.05,
                  letterSpacing: -2.2
                }}
              >
                Built for the <br />
                <Box component="span" sx={{ color: "#A0F2E1" }}>
                  Modern Jobsite.
                </Box>
              </Typography>
              <Typography
                sx={{
                  mt: 3.5,
                  maxWidth: 560,
                  fontFamily: '"Inter", "Manrope", sans-serif',
                  fontSize: { xs: "1.05rem", md: "1.25rem" },
                  fontWeight: 500,
                  lineHeight: 1.7,
                  color: "#D5ECF8"
                }}
              >
                The architectural ledger for high-stakes construction projects. Streamline change
                orders, budgets, and schedules with surgical precision.
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
              gap: 4,
              pt: 6
            }}
          >
            {statItems.map((item, index) => (
              <Box key={item.label} sx={{ display: { xs: index === 2 ? "none" : "block", lg: "block" } }}>
                <Typography
                  sx={{
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: "common.white"
                  }}
                >
                  {item.value}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.5,
                    fontFamily: '"Inter", "Manrope", sans-serif',
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: 1.6,
                    textTransform: "uppercase",
                    color: "#CFE6F2"
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box
          component="section"
          sx={{
            position: "relative",
            width: { xs: "100%", md: "50%", lg: "40%" },
            minHeight: { xs: "auto", md: "100vh" },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: { xs: 3, md: 5, lg: 8 },
            py: { xs: 4, md: 6, lg: 8 },
            background:
              "radial-gradient(circle at top right, rgba(213,236,248,0.92) 0%, rgba(243,250,255,0.96) 42%, #FFFFFF 100%)"
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 280,
              height: 280,
              borderRadius: "50%",
              backgroundColor: "rgba(213,236,248,0.92)",
              filter: "blur(90px)",
              transform: "translate(30%, -35%)"
            }}
          />

          <Box sx={{ width: "100%", maxWidth: 470, position: "relative", zIndex: 1 }}>
            <Box sx={{ mb: 6 }}>
              <Typography
                sx={{
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontWeight: 700,
                  fontSize: { xs: "2rem", md: "2.4rem" },
                  color: "#00342B"
                }}
              >
                Welcome Back
              </Typography>
              <Typography
                sx={{
                  mt: 1,
                  fontFamily: '"Inter", "Manrope", sans-serif',
                  fontWeight: 500,
                  color: "#3F4945"
                }}
              >
                Access your project headquarters.
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {error ? (
                  <Alert
                    severity="error"
                    sx={{
                      borderRadius: 3,
                      alignItems: "center"
                    }}
                  >
                    {error}
                  </Alert>
                ) : null}
                {infoMessage ? (
                  <Alert
                    severity="info"
                    sx={{
                      borderRadius: 3,
                      alignItems: "center"
                    }}
                  >
                    {infoMessage}
                  </Alert>
                ) : null}

                <Box>
                  <Typography
                    component="label"
                    htmlFor="email"
                    sx={{
                      display: "block",
                      mb: 0.75,
                      fontFamily: '"Inter", "Manrope", sans-serif',
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      letterSpacing: 1.4,
                      textTransform: "uppercase",
                      color: "#00342B"
                    }}
                  >
                    Work Email
                  </Typography>
                  <TextField
                    id="email"
                    type="email"
                    fullWidth
                    placeholder="name@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    sx={loginFieldSx}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <MailOutlineRoundedIcon sx={{ color: "#7A8681" }} />
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>

                <Box>
                  <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="flex-end" sx={{ mb: 0.75 }}>
                    <Typography
                      component="label"
                      htmlFor="password"
                      sx={{
                        fontFamily: '"Inter", "Manrope", sans-serif',
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        letterSpacing: 1.4,
                        textTransform: "uppercase",
                        color: "#00342B"
                      }}
                    >
                      Password
                    </Typography>
                    <Typography
                      component="button"
                      type="button"
                      onClick={() => setResetModalOpen(true)}
                      sx={{
                        border: "none",
                        p: 0,
                        background: "transparent",
                        fontFamily: '"Inter", "Manrope", sans-serif',
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "#046B5E",
                        textDecoration: "none",
                        "&:hover": {
                          color: "#00342B"
                        }
                      }}
                    >
                      Forgot Password?
                    </Typography>
                  </Stack>
                  <TextField
                    id="password"
                    type="password"
                    fullWidth
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    sx={loginFieldSx}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <LockOutlinedIcon sx={{ color: "#7A8681" }} />
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.9,
                    borderRadius: 3,
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    color: "common.white",
                    background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)",
                    boxShadow: "0 18px 32px rgba(0, 52, 43, 0.16)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #002A23 0%, #003E34 100%)",
                      boxShadow: "0 24px 40px rgba(0, 52, 43, 0.22)",
                      transform: "translateY(-2px)"
                    },
                    "&:active": {
                      transform: "scale(0.985)"
                    }
                  }}
                >
                  {loading ? "Logging In..." : "Log In"}
                </Button>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    backgroundColor: "#F4FAFE",
                    border: "1px solid rgba(112,121,117,0.16)"
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: '"Inter", "Manrope", sans-serif',
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                      color: "#046B5E"
                    }}
                  >
                    Demo Access
                  </Typography>
                  <Typography sx={{ mt: 0.8, color: "#3F4945", fontSize: "0.95rem" }}>
                    {DEMO_CREDENTIALS.email}
                  </Typography>
                  <Typography sx={{ mt: 0.25, color: "#3F4945", fontSize: "0.95rem" }}>
                    {DEMO_CREDENTIALS.password}
                  </Typography>
                </Paper>
              </Stack>
            </Box>

            <Box sx={{ position: "relative", my: 5 }}>
              <Divider sx={{ borderColor: "rgba(112,121,117,0.2)" }} />
              <Box
                sx={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  px: 2
                }}
              >
                <Typography
                  sx={{
                    backgroundColor: "#FFFFFF",
                    px: 1.4,
                    fontFamily: '"Inter", "Manrope", sans-serif',
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    letterSpacing: 1.6,
                    textTransform: "uppercase",
                    color: "#707975"
                  }}
                >
                  Or continue with
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.5 }}>
              <Button
                type="button"
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={() => setInfoMessage("Google SSO is staged for a later auth pass. Use the demo credentials for this build.")}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  justifyContent: "center",
                  fontFamily: '"Inter", "Manrope", sans-serif',
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  backgroundColor: "#FFFFFF",
                  color: "#071E27",
                  borderColor: "rgba(191,201,196,0.45)",
                  "&:hover": {
                    backgroundColor: "#F4FAFE",
                    borderColor: "rgba(191,201,196,0.65)"
                  }
                }}
              >
                Google
              </Button>
              <Button
                type="button"
                variant="outlined"
                startIcon={<GridViewRoundedIcon sx={{ color: "#0078D4" }} />}
                onClick={() => setInfoMessage("Microsoft SSO is staged for a later auth pass. Use the demo credentials for this build.")}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  justifyContent: "center",
                  fontFamily: '"Inter", "Manrope", sans-serif',
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  backgroundColor: "#FFFFFF",
                  color: "#071E27",
                  borderColor: "rgba(191,201,196,0.45)",
                  "&:hover": {
                    backgroundColor: "#F4FAFE",
                    borderColor: "rgba(191,201,196,0.65)"
                  }
                }}
              >
                Microsoft
              </Button>
            </Box>

            <Typography
              sx={{
                mt: 5,
                textAlign: "center",
                fontFamily: '"Inter", "Manrope", sans-serif',
                fontSize: "0.92rem",
                color: "#3F4945"
              }}
            >
              New to ChangeFlow?
              <Typography
                component="button"
                type="button"
                onClick={() => setRegisterModalOpen(true)}
                sx={{
                  border: "none",
                  p: 0,
                  background: "transparent",
                  ml: 0.75,
                  fontWeight: 700,
                  color: "#046B5E",
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline"
                  }
                }}
              >
                Request Platform Access
              </Typography>
            </Typography>

            <Stack
              direction="row"
              spacing={2.5}
              useFlexGap
              flexWrap="wrap"
              justifyContent="center"
              sx={{ mt: { xs: 5, md: 8 } }}
            >
              {footerLinks.map((link) => (
                <Typography
                  key={link}
                  component="button"
                  type="button"
                  onClick={() => setInfoMessage(`${link} is staged as part of the public site/legal footer pass.`)}
                  sx={{
                    border: "none",
                    p: 0,
                    background: "transparent",
                    fontFamily: '"Inter", "Manrope", sans-serif',
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    letterSpacing: 1.6,
                    textTransform: "uppercase",
                    color: "#707975",
                    textDecoration: "none",
                    "&:hover": {
                      color: "#00342B"
                    }
                  }}
                >
                  {link}
                </Typography>
              ))}
            </Stack>

            <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
              <Button variant="text" color="inherit" onClick={() => navigate("/")}>
                Back to public site
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      <RegisterAccessModal
        open={registerModalOpen}
        loading={loading}
        onClose={() => setRegisterModalOpen(false)}
        onSubmit={handleRegister}
      />
      <PasswordResetModal
        open={resetModalOpen}
        onClose={handleResetModalClose}
        initialEmail={resetEmailFromUrl || undefined}
        initialToken={resetTokenFromUrl || undefined}
        onCompleted={(message) => {
          setInfoMessage(message);
        }}
      />
    </Box>
  );
}
