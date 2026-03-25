import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ArchitectureRoundedIcon from "@mui/icons-material/ArchitectureRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import InputRoundedIcon from "@mui/icons-material/InputRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import SmartphoneRoundedIcon from "@mui/icons-material/SmartphoneRounded";
import SyncAltRoundedIcon from "@mui/icons-material/SyncAltRounded";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";

import { Button } from "../components/common/Button";
import { useAuthContext } from "../context/AuthContext";

const headlineFont = '"Epilogue", "Space Grotesk", sans-serif';
const bodyFont = '"Inter", "Manrope", sans-serif';

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAn7E0av1NPgNHbGGS-17z5d5LQ1mhOktAYSTrKaqfTmBa8FMU3L6fNjLUFYYnOZRg6ASyWRMpXDSBEFHvjCF6oLMjNW-AtYn4epQPJV2ZUy0SEh25742heFwMJ0hpsQcCil1AHeZqQ2iroT1YHwA6qwqe4sfKh3G-M9TgbvTd7MjuYcDANc1K3m-V7Gcd8bXgjNJGTe2QLPclxJ-3wGGPvyEyI-z7o_HV8Qgtu7aj4TMBy5m4SH-aIv0d-JuZlbxnPU2vmv3NCpjl3";

const DASHBOARD_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAGYGccPvRGu-67igfW6weKF94TEmaW0dy4Lm1_ctjRNiircYEXnj5ttKB_PqQg462cfG2sOvQMxEYJE183bfu7PM8M05tgxhULXPVkgBXDp8YVCousbMHhudVIpg5YmfoaPfSVuzRwIzO0V6--lMSeavCs_yoE7aahL0-5JdLuXrfVNkqpaz2S76RSNFY-tLoR6UQJGM0a834FN9Zb-pyGrFQlw5Fhngc3VZvkysqo8K4ylb0-YmrfSYCDNgapfOmT0gzYsXlw2p_U";

const API_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCqP_bNyFUV4iubm7S8v6_owV1nAz2uo9tLuztU9fpNktj06Tnn_PcO7FNa2rCzoFPVrAOx0A28MvUAPLrSzv4xzWUb4YY6jAMyBufCNNpugmHrW8OSP5byxFAB8S4n_F7q4LqqwQdmd7oabnChqRgNS7xzMoQCiyp8JzuZLe-k82n3wsBMIwN_jup7QT1gE6u2uXglCd5Jqoij3gOj4WfNNJU7bJhFK0QPJ-4MGlM5qrmsei9Tc_VGtje_adtHXu_FeZMzufcsOCzx";

const navigationItems = [
  { label: "Features", href: "#features" },
  { label: "Solutions", href: "#workflow" },
  { label: "API", href: "#api-architecture" },
  { label: "Pricing", href: "#cta" }
];

const workflowSteps = [
  {
    title: "Unified Intake",
    description:
      "Centralize all Field Directives and change requests through a single technical portal. No more missing PDFs or lost email chains.",
    icon: <InputRoundedIcon sx={{ fontSize: 30 }} />,
    background: "#00342B"
  },
  {
    title: "Automated Validation",
    description:
      "Our engine cross-references budget codes, contract limits, and labor rates in real-time to prevent overruns before they happen.",
    icon: <AnalyticsRoundedIcon sx={{ fontSize: 30 }} />,
    background: "#046B5E"
  },
  {
    title: "Bi-Directional Sync",
    description:
      "Native integrations with Procore, Autodesk, and SAP mean your financial truth is updated instantly across the entire stack.",
    icon: <SyncAltRoundedIcon sx={{ fontSize: 30 }} />,
    background: "#5B1300"
  }
];

const footerColumns = [
  {
    title: "Product",
    items: ["Features", "Integrations", "Enterprise", "Pricing"]
  },
  {
    title: "Company",
    items: ["About Us", "Customers", "Careers", "Press"]
  },
  {
    title: "Resources",
    items: ["Documentation", "API Reference", "Blog", "Support"]
  },
  {
    title: "Social",
    items: ["LinkedIn", "Twitter"]
  }
];

function footerLinkTarget(item: string) {
  const targets: Record<string, string> = {
    Features: "#features",
    Integrations: "#workflow",
    Enterprise: "/login",
    Pricing: "#cta",
    "About Us": "/login",
    Customers: "/login",
    Careers: "/login",
    Press: "/login",
    Documentation: "/login",
    "API Reference": "/login",
    Blog: "/login",
    Support: "/login",
    LinkedIn: "https://www.linkedin.com",
    Twitter: "https://x.com"
  };

  return targets[item] ?? "/login";
}

function BlueprintBackground() {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        backgroundImage: "radial-gradient(rgba(148, 211, 193, 0.1) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none"
      }}
    />
  );
}

export function HomePage() {
  const { isAuthenticated } = useAuthContext();
  const primaryCtaRoute = isAuthenticated ? "/app/dashboard" : "/login";

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#00342B", color: "white" }}>
      <Box
        component="nav"
        sx={{
          position: "fixed",
          insetInline: 0,
          top: 0,
          zIndex: 50,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 3,
          px: { xs: 2.5, md: 4, lg: 6 },
          py: 2.25,
          background: "rgba(0, 52, 43, 0.6)",
          backdropFilter: "blur(24px)"
        }}
      >
        <Stack direction="row" spacing={5} alignItems="center" sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: headlineFont,
              fontSize: "1.75rem",
              fontWeight: 900,
              letterSpacing: -1.2,
              color: "common.white"
            }}
          >
            ChangeFlow
          </Typography>
          <Stack direction="row" spacing={4} sx={{ display: { xs: "none", md: "flex" } }}>
            {navigationItems.map((item) => (
              <Typography
                key={item.label}
                component="a"
                href={item.href}
                sx={{
                  fontFamily: bodyFont,
                  fontSize: "0.92rem",
                  fontWeight: 500,
                  color: "rgba(243,250,255,0.8)",
                  textDecoration: "none",
                  transition: "color 180ms ease",
                  "&:hover": {
                    color: "common.white"
                  }
                }}
              >
                {item.label}
              </Typography>
            ))}
          </Stack>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center" useFlexGap flexWrap="wrap" justifyContent="flex-end">
          <Typography
            component={RouterLink}
            to="/login"
            sx={{
              display: { xs: "none", md: "block" },
              fontFamily: bodyFont,
              fontSize: "0.92rem",
              fontWeight: 500,
              color: "rgba(243,250,255,0.8)",
              textDecoration: "none",
              "&:hover": {
                color: "common.white"
              }
            }}
          >
            Log In
          </Typography>
          <Button
            component={RouterLink}
            to={primaryCtaRoute}
            sx={{
              px: 3.2,
              py: 1.1,
              borderRadius: 2.5,
              fontFamily: bodyFont,
              fontWeight: 700,
              fontSize: "0.88rem",
              color: "common.white",
              background: "linear-gradient(135deg, #046B5E 0%, #004D40 100%)",
              boxShadow: "0 18px 28px rgba(0,0,0,0.2)",
              "&:hover": {
                background: "linear-gradient(135deg, #055A4F 0%, #003E34 100%)",
                transform: "translateY(-2px)"
              }
            }}
          >
            Get Started
          </Button>
        </Stack>
      </Box>

      <Box component="main">
        <Box
          component="section"
          sx={{
            position: "relative",
            overflow: "hidden",
            px: { xs: 2.5, md: 4, lg: 6 },
            pt: { xs: 16, md: 26 },
            pb: { xs: 10, md: 16 }
          }}
        >
          <BlueprintBackground />
          <Box sx={{ position: "relative", zIndex: 1, maxWidth: 1440, mx: "auto" }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" },
                gap: { xs: 6, md: 8 },
                alignItems: "center"
              }}
            >
              <Box sx={{ gridColumn: { md: "span 7 / span 7" } }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    px: 1.8,
                    py: 0.7,
                    borderRadius: 999,
                    mb: 3,
                    backgroundColor: "rgba(4, 107, 94, 0.22)",
                    color: "#A0F2E1"
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: bodyFont,
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      letterSpacing: 1.7,
                      textTransform: "uppercase"
                    }}
                  >
                    Next-Generation Infrastructure
                  </Typography>
                </Box>

                <Typography
                  variant="h1"
                  sx={{
                    fontFamily: headlineFont,
                    fontWeight: 900,
                    fontSize: { xs: "3.25rem", md: "5rem", lg: "6.3rem" },
                    lineHeight: 0.92,
                    letterSpacing: -3.2,
                    color: "common.white"
                  }}
                >
                  The Operational <br />
                  Command Center <Box component="span" sx={{ color: "#A0F2E1" }}>for Modern</Box> <br />
                  Construction.
                </Typography>

                <Typography
                  sx={{
                    mt: 4,
                    maxWidth: 760,
                    fontFamily: bodyFont,
                    fontSize: { xs: "1.08rem", md: "1.45rem" },
                    lineHeight: 1.7,
                    color: "#CFE6F2"
                  }}
                >
                  Eliminate the ambiguity of change orders. ChangeFlow centralizes intake, tracking,
                  and ERP syncing into a single, high-fidelity source of truth.
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} useFlexGap sx={{ mt: 5 }}>
                  <Button
                    component={RouterLink}
                    to={primaryCtaRoute}
                    size="large"
                    sx={{
                      px: 4.2,
                      py: 1.8,
                      borderRadius: 3,
                      fontFamily: bodyFont,
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: "#00342B",
                      backgroundColor: "common.white",
                      boxShadow: "0 18px 30px rgba(0,0,0,0.16)",
                      "&:hover": {
                        backgroundColor: "#F3FAFF",
                        boxShadow: "0 24px 36px rgba(0,0,0,0.22)"
                      }
                    }}
                  >
                    Request Access
                  </Button>
                  <Button
                    component="a"
                    href="#workflow"
                    size="large"
                    startIcon={<PlayCircleRoundedIcon />}
                    sx={{
                      px: 4.2,
                      py: 1.8,
                      borderRadius: 3,
                      fontFamily: bodyFont,
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: "common.white",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      boxShadow: "none",
                      backdropFilter: "blur(12px)",
                      "&:hover": {
                        backgroundColor: "rgba(255,255,255,0.1)"
                      }
                    }}
                  >
                    View Demo
                  </Button>
                </Stack>
              </Box>

              <Box sx={{ gridColumn: { md: "span 5 / span 5" }, position: "relative" }}>
                <Box
                  sx={{
                    position: "absolute",
                    top: -72,
                    right: -72,
                    width: 260,
                    height: 260,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(4,107,94,0.34), rgba(0,0,0,0))",
                    filter: "blur(80px)"
                  }}
                />

                <Paper
                  elevation={0}
                  sx={{
                    p: 1.8,
                    borderRadius: 4,
                    border: "none",
                    backgroundColor: "rgba(207,230,242,0.1)",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 32px 60px rgba(0,0,0,0.22)"
                  }}
                >
                  <Box
                    component="img"
                    src={HERO_IMAGE}
                    alt="Construction blueprints and analytics dashboard"
                    sx={{
                      display: "block",
                      width: "100%",
                      height: "auto",
                      borderRadius: 3,
                      filter: "grayscale(100%)",
                      transition: "filter 500ms ease",
                      ".MuiPaper-root:hover &": {
                        filter: "grayscale(0%)"
                      }
                    }}
                  />

                  <Paper
                    elevation={0}
                    sx={{
                      display: { xs: "none", lg: "block" },
                      position: "absolute",
                      left: -24,
                      bottom: -24,
                      p: 3,
                      borderRadius: 3,
                      border: "none",
                      backgroundColor: "#FFFFFF",
                      color: "#00342B",
                      boxShadow: "0 28px 40px rgba(7,30,39,0.14)"
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                      <CheckCircleRoundedIcon sx={{ color: "#046B5E" }} />
                      <Typography
                        sx={{
                          fontFamily: bodyFont,
                          fontSize: "0.74rem",
                          fontWeight: 800,
                          letterSpacing: 1.5,
                          textTransform: "uppercase"
                        }}
                      >
                        Order Validated
                      </Typography>
                    </Stack>
                    <Typography
                      sx={{
                        fontFamily: headlineFont,
                        fontSize: "2rem",
                        fontWeight: 900,
                        letterSpacing: -1.2
                      }}
                    >
                      $842,500.00
                    </Typography>
                    <Typography sx={{ mt: 0.4, fontFamily: bodyFont, fontSize: "0.78rem", color: "#707975" }}>
                      Synced to Procore 2m ago
                    </Typography>
                  </Paper>
                </Paper>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box
          id="workflow"
          component="section"
          sx={{
            scrollMarginTop: 120,
            backgroundColor: "#F3FAFF",
            px: { xs: 2.5, md: 4, lg: 6 },
            py: { xs: 10, md: 16 }
          }}
        >
          <Box sx={{ maxWidth: 1440, mx: "auto" }}>
            <Box sx={{ textAlign: "center", mb: { xs: 8, md: 12 } }}>
              <Typography
                variant="h2"
                sx={{
                  fontFamily: headlineFont,
                  fontSize: { xs: "2.3rem", md: "3.4rem" },
                  fontWeight: 800,
                  letterSpacing: -1.8,
                  color: "#00342B"
                }}
              >
                The Lifecycle of Certainty.
              </Typography>
              <Typography
                sx={{
                  mt: 2.5,
                  maxWidth: 780,
                  mx: "auto",
                  fontFamily: bodyFont,
                  fontSize: "1.08rem",
                  lineHeight: 1.75,
                  color: "#3F4945"
                }}
              >
                From the first field report to the final budget sync, ChangeFlow ensures every dollar is
                accounted for with architectural precision.
              </Typography>
            </Box>

            <Box sx={{ position: "relative" }}>
              <Box
                sx={{
                  display: { xs: "none", md: "block" },
                  position: "absolute",
                  left: "25%",
                  right: "25%",
                  top: 32,
                  height: 2,
                  backgroundColor: "#D5ECF8",
                  zIndex: 0
                }}
              />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                  gap: { xs: 5, md: 8 },
                  position: "relative",
                  zIndex: 1
                }}
              >
                {workflowSteps.map((step) => (
                  <Box key={step.title}>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        mb: 4,
                        borderRadius: 3,
                        display: "grid",
                        placeItems: "center",
                        backgroundColor: step.background,
                        color: "common.white",
                        boxShadow: "0 22px 36px rgba(7,30,39,0.12)"
                      }}
                    >
                      {step.icon}
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: headlineFont,
                        fontSize: "1.75rem",
                        fontWeight: 700,
                        letterSpacing: -0.9,
                        color: "#00342B"
                      }}
                    >
                      {step.title}
                    </Typography>
                    <Typography
                      sx={{
                        mt: 2,
                        fontFamily: bodyFont,
                        fontSize: "1rem",
                        lineHeight: 1.8,
                        color: "#3F4945"
                      }}
                    >
                      {step.description}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>

        <Box
          id="features"
          component="section"
          sx={{
            scrollMarginTop: 120,
            backgroundColor: "#FFFFFF",
            px: { xs: 2.5, md: 4, lg: 6 },
            py: { xs: 10, md: 16 }
          }}
        >
          <Box sx={{ maxWidth: 1440, mx: "auto" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: 4,
                flexWrap: "wrap",
                mb: 8
              }}
            >
              <Box sx={{ maxWidth: 620 }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontFamily: headlineFont,
                    fontSize: { xs: "2.5rem", md: "4.2rem" },
                    fontWeight: 900,
                    letterSpacing: -2.4,
                    color: "#00342B"
                  }}
                >
                  Engineered for Complexity.
                </Typography>
              </Box>
              <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
                <Typography
                  sx={{
                    fontFamily: bodyFont,
                    fontSize: "0.74rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: 3.2,
                    color: "#046B5E",
                    textDecoration: "underline",
                    textDecorationThickness: "2px",
                    textUnderlineOffset: "6px"
                  }}
                >
                  Technical Specs
                </Typography>
                <Typography sx={{ mt: 1, fontFamily: bodyFont, fontSize: "0.84rem", color: "#707975" }}>
                  Version 4.2.0 Deploy
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(12, minmax(0, 1fr))" },
                gap: 2.5
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  gridColumn: { md: "span 8 / span 8" },
                  p: { xs: 3, md: 5 },
                  borderRadius: 4,
                  border: "none",
                  backgroundColor: "#E6F6FF",
                  minHeight: 380,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative"
                }}
              >
                <Box sx={{ position: "relative", zIndex: 1 }}>
                  <Typography
                    sx={{
                      fontFamily: headlineFont,
                      fontSize: { xs: "2rem", md: "2.4rem" },
                      fontWeight: 700,
                      letterSpacing: -1.2,
                      color: "#00342B"
                    }}
                  >
                    Executive Oversight Dashboard
                  </Typography>
                  <Typography
                    sx={{
                      mt: 2,
                      maxWidth: 500,
                      fontFamily: bodyFont,
                      fontSize: "1rem",
                      lineHeight: 1.75,
                      color: "#3F4945"
                    }}
                  >
                    Aggregate data across 500+ projects to identify systemic cost leakage and regional
                    efficiency trends.
                  </Typography>
                  <Button
                    variant="text"
                    color="inherit"
                    sx={{
                      mt: 4,
                      px: 0,
                      justifyContent: "flex-start",
                      fontFamily: bodyFont,
                      fontWeight: 700,
                      color: "#00342B"
                    }}
                    endIcon={<ArrowForwardRoundedIcon />}
                  >
                    Explore Analytics
                  </Button>
                </Box>

                <Box
                  component="img"
                  src={DASHBOARD_IMAGE}
                  alt="Construction analytics dashboard"
                  sx={{
                    mt: { xs: 4, md: 0 },
                    width: { xs: "100%", md: "50%" },
                    position: { xs: "relative", md: "absolute" },
                    right: { md: "-10%" },
                    bottom: { md: "-20%" },
                    borderRadius: 3,
                    boxShadow: "0 30px 44px rgba(7,30,39,0.14)"
                  }}
                />
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  gridColumn: { md: "span 4 / span 4" },
                  p: { xs: 3, md: 5 },
                  borderRadius: 4,
                  border: "none",
                  backgroundColor: "#00342B",
                  color: "common.white",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <Box>
                  <SecurityRoundedIcon sx={{ fontSize: 42, color: "#A0F2E1", mb: 3 }} />
                  <Typography sx={{ fontFamily: headlineFont, fontSize: "1.9rem", fontWeight: 700, letterSpacing: -0.9 }}>
                    Contractor Compliance
                  </Typography>
                  <Typography sx={{ mt: 2, fontFamily: bodyFont, fontSize: "0.95rem", lineHeight: 1.75, color: "#CFE6F2" }}>
                    Automatic verification of insurance certificates, licensing, and safety records for
                    every sub-tier submitter.
                  </Typography>
                </Box>

                <Box sx={{ mt: 8, pt: 6 }}>
                  <Stack direction="row" spacing={-0.7} sx={{ mb: 1.5 }}>
                    {["#CBD5E1", "#94A3B8", "#64748B"].map((color) => (
                      <Box
                        key={color}
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          backgroundColor: color,
                          outline: "2px solid #00342B"
                        }}
                      />
                    ))}
                  </Stack>
                  <Typography sx={{ fontFamily: bodyFont, fontSize: "0.78rem", color: "rgba(243,250,255,0.6)" }}>
                    Trusted by 12k+ teams
                  </Typography>
                </Box>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  gridColumn: { md: "span 4 / span 4" },
                  p: { xs: 3, md: 5 },
                  borderRadius: 4,
                  border: "none",
                  backgroundColor: "#046B5E",
                  color: "common.white"
                }}
              >
                <Typography sx={{ fontFamily: headlineFont, fontSize: "1.9rem", fontWeight: 700, letterSpacing: -0.9 }}>
                  Mobile-First Intake
                </Typography>
                <Typography sx={{ mt: 2, mb: 6, fontFamily: bodyFont, fontSize: "0.95rem", lineHeight: 1.75, color: "#D5ECF8" }}>
                  Empower field supers to capture photos and audio notes that automatically transcribe
                  into formal change requests.
                </Typography>
                <Box
                  sx={{
                    aspectRatio: "16 / 9",
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    backgroundColor: "rgba(255,255,255,0.08)"
                  }}
                >
                  <SmartphoneRoundedIcon sx={{ fontSize: 54 }} />
                </Box>
              </Paper>

              <Paper
                id="api-architecture"
                elevation={0}
                sx={{
                  gridColumn: { md: "span 8 / span 8" },
                  p: { xs: 3, md: 5 },
                  borderRadius: 4,
                  border: "none",
                  backgroundColor: "#DBF1FE",
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                  gap: 4,
                  alignItems: "center",
                  scrollMarginTop: 120
                }}
              >
                <Box>
                  <Typography sx={{ fontFamily: headlineFont, fontSize: { xs: "2rem", md: "2.4rem" }, fontWeight: 700, letterSpacing: -1.2, color: "#00342B" }}>
                    API First Architecture
                  </Typography>
                  <Typography sx={{ mt: 2, fontFamily: bodyFont, fontSize: "1rem", lineHeight: 1.75, color: "#3F4945" }}>
                    Build your own workflows or extend ours. ChangeFlow provides a robust GraphQL API
                    designed for massive scale.
                  </Typography>
                  <Box
                    sx={{
                      mt: 3.5,
                      p: 2.2,
                      borderRadius: 2.5,
                      fontFamily: '"SFMono-Regular", "Menlo", monospace',
                      fontSize: "0.78rem",
                      color: "#A0F2E1",
                      backgroundColor: "#004D40"
                    }}
                  >
                    GET /v1/projects/{"{id}"}/change_orders
                  </Box>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Box
                    component="img"
                    src={API_IMAGE}
                    alt="Server infrastructure visual"
                    sx={{
                      width: 190,
                      maxWidth: "100%",
                      opacity: 0.52,
                      filter: "grayscale(100%)"
                    }}
                  />
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>

        <Box
          id="cta"
          component="section"
          sx={{
            position: "relative",
            overflow: "hidden",
            backgroundColor: "#00342B",
            px: { xs: 2.5, md: 4, lg: 6 },
            py: { xs: 10, md: 14 },
            scrollMarginTop: 120
          }}
        >
          <BlueprintBackground />
          <Box sx={{ position: "relative", zIndex: 1, maxWidth: 980, mx: "auto", textAlign: "center" }}>
            <Typography
              variant="h2"
              sx={{
                fontFamily: headlineFont,
                fontSize: { xs: "2.5rem", md: "4.3rem" },
                fontWeight: 900,
                lineHeight: 1.04,
                letterSpacing: -2.3,
                color: "common.white"
              }}
            >
              Ready to Build with <br />
              <Box component="span" sx={{ color: "#A0F2E1" }}>
                Unshakeable Precision?
              </Box>
            </Typography>
            <Typography sx={{ mt: 3, fontFamily: bodyFont, fontSize: { xs: "1.05rem", md: "1.3rem" }, color: "#CFE6F2" }}>
              Join the world&apos;s most sophisticated ENR 400 firms using ChangeFlow to protect their
              margins.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} justifyContent="center" useFlexGap sx={{ mt: 5 }}>
              <Button
                component={RouterLink}
                to={primaryCtaRoute}
                size="large"
                sx={{
                  px: 4.5,
                  py: 2,
                  borderRadius: 3,
                  fontFamily: bodyFont,
                  fontWeight: 700,
                  fontSize: "1.08rem",
                  color: "#00342B",
                  backgroundColor: "#A0F2E1",
                  "&:hover": {
                    backgroundColor: "#FFFFFF"
                  }
                }}
              >
                Schedule an Audit
              </Button>
              <Button
                variant="outlined"
                component={RouterLink}
                to="/login"
                size="large"
                sx={{
                  px: 4.5,
                  py: 2,
                  borderRadius: 3,
                  fontFamily: bodyFont,
                  fontWeight: 700,
                  fontSize: "1.08rem",
                  color: "common.white",
                  borderColor: "rgba(255,255,255,0.18)",
                  backgroundColor: "transparent",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderColor: "rgba(255,255,255,0.24)"
                  }
                }}
              >
                Talk to Sales
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>

      <Box
        component="footer"
        sx={{
          backgroundColor: "#002A23",
          px: { xs: 2.5, md: 4, lg: 6 },
          pt: { xs: 10, md: 14 },
          pb: { xs: 6, md: 7 }
        }}
      >
        <Box sx={{ maxWidth: 1440, mx: "auto" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(6, minmax(0, 1fr))" },
              gap: { xs: 5, md: 7 },
              mb: 10
            }}
          >
            <Box sx={{ gridColumn: { xs: "span 2 / span 2" } }}>
              <Typography
                sx={{
                  fontFamily: headlineFont,
                  fontSize: "1.9rem",
                  fontWeight: 900,
                  letterSpacing: -1.2,
                  color: "common.white"
                }}
              >
                ChangeFlow
              </Typography>
              <Typography
                sx={{
                  mt: 2.5,
                  maxWidth: 320,
                  fontFamily: bodyFont,
                  fontSize: "0.92rem",
                  lineHeight: 1.75,
                  color: "#CFE6F2"
                }}
              >
                The architectural ledger for modern construction teams. Secure, integrated, and precise.
              </Typography>
            </Box>

            {footerColumns.map((column) => (
              <Box key={column.title}>
                <Typography
                  sx={{
                    mb: 3,
                    fontFamily: bodyFont,
                    fontSize: "0.76rem",
                    fontWeight: 800,
                    letterSpacing: 1.8,
                    textTransform: "uppercase",
                    color: "common.white"
                  }}
                >
                  {column.title}
                </Typography>
                <Stack spacing={2}>
                  {column.items.map((item) => {
                    const target = footerLinkTarget(item);
                    const external = target.startsWith("http");

                    return (
                      <Typography
                        key={item}
                        component={external ? "a" : RouterLink}
                        href={external ? target : undefined}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noreferrer" : undefined}
                        to={external ? undefined : target}
                        sx={{
                          fontFamily: bodyFont,
                          fontSize: "0.92rem",
                          color: "#CFE6F2",
                          textDecoration: "none",
                          "&:hover": {
                            color: "common.white"
                          }
                        }}
                      >
                        {item}
                      </Typography>
                    );
                  })}
                </Stack>
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 3,
              flexWrap: "wrap",
              pt: 4
            }}
          >
            <Typography
              sx={{
                fontFamily: bodyFont,
                fontSize: "0.68rem",
                letterSpacing: 1.8,
                textTransform: "uppercase",
                color: "rgba(207,230,242,0.45)"
              }}
            >
              © 2024 ChangeFlow Intelligence. Built for the modern jobsite.
            </Typography>
            <Stack direction="row" spacing={4} useFlexGap flexWrap="wrap">
              {["Terms", "Privacy", "Trust & Security"].map((item) => (
                <Typography
                  key={item}
                  component={RouterLink}
                  to="/login"
                  sx={{
                    fontFamily: bodyFont,
                    fontSize: "0.68rem",
                    letterSpacing: 1.8,
                    textTransform: "uppercase",
                    color: "rgba(207,230,242,0.45)",
                    textDecoration: "none",
                    "&:hover": {
                      color: "common.white"
                    }
                  }}
                >
                  {item}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
