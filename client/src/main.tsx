import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline, ThemeProvider, alpha, createTheme } from "@mui/material";

import App from "./App";
import "./index.css";

const theme = createTheme({
  palette: {
    primary: {
      main: "#0F766E",
      dark: "#0A4F4A"
    },
    secondary: {
      main: "#D97706"
    },
    background: {
      default: "#F4F7F3",
      paper: "#FFFFFF"
    },
    text: {
      primary: "#0F172A",
      secondary: "#475569"
    }
  },
  typography: {
    fontFamily: '"Manrope", "Segoe UI", sans-serif',
    h1: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700, letterSpacing: -1.8 },
    h2: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700, letterSpacing: -1.4 },
    h3: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700, letterSpacing: -1.2 },
    h4: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700, letterSpacing: -0.9 },
    h5: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700, letterSpacing: -0.6 },
    h6: { fontFamily: '"Space Grotesk", "Segoe UI", sans-serif', fontWeight: 700, letterSpacing: -0.4 }
  },
  shape: {
    borderRadius: 4
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 12,
          paddingInline: 18,
          paddingBlock: 10,
          fontWeight: 700,
          whiteSpace: "normal",
          lineHeight: 1.25,
          textAlign: "center"
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(15, 23, 42, 0.08)",
          boxShadow: "0 20px 40px rgba(15, 23, 42, 0.05)"
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          maxWidth: "100%",
          height: "auto"
        },
        label: {
          display: "block",
          whiteSpace: "normal",
          overflowWrap: "anywhere",
          lineHeight: 1.25,
          paddingTop: 6,
          paddingBottom: 6
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: alpha("#FFFFFF", 0.8)
        }
      }
    }
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
);
