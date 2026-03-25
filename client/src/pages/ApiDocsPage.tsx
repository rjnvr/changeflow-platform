import ApiRoundedIcon from "@mui/icons-material/ApiRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import WebhookRoundedIcon from "@mui/icons-material/WebhookRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { WorkspaceFooter } from "../components/layout/WorkspaceFooter";
import { API_BASE_URL } from "../utils/constants";

interface EndpointGroup {
  title: string;
  description: string;
  icon: ReactNode;
  endpoints: Array<{
    method: "GET" | "POST" | "PATCH" | "DELETE";
    path: string;
    summary: string;
  }>;
}

const endpointGroups: EndpointGroup[] = [
  {
    title: "Auth",
    description: "JWT login, profile, password reset, and logged-in account management.",
    icon: <KeyRoundedIcon sx={{ color: "#046B5E" }} />,
    endpoints: [
      { method: "POST", path: "/auth/login", summary: "Authenticate and return JWT + user payload." },
      { method: "POST", path: "/auth/register", summary: "Create a new local account." },
      { method: "POST", path: "/auth/request-password-reset", summary: "Email a reset link to a non-demo user." },
      { method: "POST", path: "/auth/reset-password", summary: "Reset a password using token + email." },
      { method: "GET", path: "/auth/me", summary: "Load the current authenticated user." },
      { method: "PATCH", path: "/auth/me", summary: "Update profile details." },
      { method: "POST", path: "/auth/change-password", summary: "Change password while logged in." }
    ]
  },
  {
    title: "Projects",
    description: "Portfolio CRUD, team management, document vault access, and archive workflows.",
    icon: <ApiRoundedIcon sx={{ color: "#046B5E" }} />,
    endpoints: [
      { method: "GET", path: "/projects", summary: "List active projects, optionally including archived records." },
      { method: "POST", path: "/projects", summary: "Create a new project." },
      { method: "PATCH", path: "/projects/:projectId", summary: "Update project details." },
      { method: "POST", path: "/projects/:projectId/archive", summary: "Archive a project and lock it read-only." },
      { method: "GET", path: "/projects/:projectId/team", summary: "Load the project team roster." },
      { method: "POST", path: "/projects/:projectId/team", summary: "Add an on-site team member." },
      { method: "DELETE", path: "/projects/:projectId/team/:teamMemberId", summary: "Remove a team member." },
      { method: "GET", path: "/projects/:projectId/documents", summary: "List project vault documents." },
      { method: "POST", path: "/projects/:projectId/documents/upload-intent", summary: "Generate presigned S3 upload URL." },
      { method: "GET", path: "/projects/:projectId/documents/:documentId/download-url", summary: "Generate signed download URL." }
    ]
  },
  {
    title: "Change Orders",
    description: "Commercial workflow, comments, attachments, approvals, and archive controls.",
    icon: <BoltRoundedIcon sx={{ color: "#046B5E" }} />,
    endpoints: [
      { method: "GET", path: "/change-orders", summary: "List change orders, filtered by project or archive state." },
      { method: "POST", path: "/change-orders", summary: "Create a new change order with optional attachments." },
      { method: "PATCH", path: "/change-orders/:changeOrderId", summary: "Edit an existing change order." },
      { method: "PATCH", path: "/change-orders/:changeOrderId/status", summary: "Approve, reject, review, or mark synced." },
      { method: "POST", path: "/change-orders/:changeOrderId/archive", summary: "Archive a change order and lock edits." },
      { method: "GET", path: "/change-orders/:changeOrderId/comments", summary: "Load review-thread comments." },
      { method: "POST", path: "/change-orders/:changeOrderId/comments", summary: "Add a workflow comment." },
      { method: "POST", path: "/change-orders/upload-intent", summary: "Generate presigned attachment upload URL." },
      { method: "POST", path: "/change-orders/:changeOrderId/attachments", summary: "Attach uploaded files to a record." },
      { method: "DELETE", path: "/change-orders/:changeOrderId/attachments/:attachmentId", summary: "Remove an attachment." }
    ]
  },
  {
    title: "Integrations & Webhooks",
    description: "System health, manual sync actions, and external webhook intake.",
    icon: <HubRoundedIcon sx={{ color: "#046B5E" }} />,
    endpoints: [
      { method: "GET", path: "/integrations", summary: "List current provider connections and sync state." },
      { method: "POST", path: "/integrations/sync", summary: "Trigger a manual sync workflow." },
      { method: "POST", path: "/webhooks/external-system", summary: "Accept external sync/webhook payloads." }
    ]
  }
];

const loginExample = `POST ${API_BASE_URL}/auth/login
Content-Type: application/json

{
  "email": "demo@changeflow.dev",
  "password": "password123"
}`;

const createChangeOrderExample = `POST ${API_BASE_URL}/change-orders
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "projectId": "prj_sky_001",
  "title": "HVAC Spec Adjustment",
  "description": "Re-route duct runs in corridor B after field conflict.",
  "amount": 12500,
  "requestedBy": "Sarah Mitchell",
  "assignedTo": "Marcus Chen"
}`;

const successEnvelopeExample = `{
  "success": true,
  "data": {
    "id": "co_1234",
    "status": "pending_review"
  }
}`;

const errorEnvelopeExample = `{
  "success": false,
  "message": "Only the project owner can edit this change order."
}`;

const uploadFlowExample = [
  "1. POST /change-orders/upload-intent or /projects/:projectId/documents/upload-intent",
  "2. Browser uploads directly to S3 using the presigned PUT URL",
  "3. App persists metadata in Postgres",
  "4. Downloads use signed GET URLs so the bucket stays private"
];

const webhookNotes = [
  "Webhook intake currently lives at /webhooks/external-system",
  "Use WEBHOOK_SIGNING_SECRET when you wire provider-side signatures",
  "Manual sync controls are surfaced in the Integrations Center UI"
];

function MethodChip({ method }: { method: string }) {
  const tone =
    method === "GET"
      ? { backgroundColor: "#D5ECF8", color: "#00342B" }
      : method === "POST"
        ? { backgroundColor: "#9DEFDE", color: "#0F6F62" }
        : method === "PATCH"
          ? { backgroundColor: "#FFF0D9", color: "#8A5600" }
          : { backgroundColor: "#FFDBD1", color: "#872000" };

  return (
    <Box
      sx={{
        px: 1.2,
        py: 0.5,
        borderRadius: 999,
        backgroundColor: tone.backgroundColor,
        color: tone.color
      }}
    >
      <Typography sx={{ fontSize: "0.72rem", fontWeight: 900, letterSpacing: 1.3, textTransform: "uppercase" }}>
        {method}
      </Typography>
    </Box>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 2.2,
        overflowX: "auto",
        borderRadius: 3,
        backgroundColor: "#071E27",
        color: "#DFF4FF",
        fontSize: "0.84rem",
        lineHeight: 1.7,
        fontFamily: '"SFMono-Regular", "Menlo", "Monaco", monospace'
      }}
    >
      {code}
    </Box>
  );
}

export function ApiDocsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const standalone = location.pathname === "/api-docs";

  return (
    <Stack spacing={4.5} sx={{ px: standalone ? { xs: 2.5, md: 5 } : 0, py: standalone ? { xs: 3, md: 5 } : 0 }}>
      {standalone ? (
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2}>
          <Box>
            <Typography
              sx={{
                fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                fontSize: { xs: "2rem", md: "2.6rem" },
                fontWeight: 900,
                letterSpacing: -1.4,
                color: "#00342B"
              }}
            >
              ChangeFlow API Docs
            </Typography>
            <Typography sx={{ mt: 1, fontSize: "1rem", color: "#5A6A84" }}>
              Local development reference for auth, project, change-order, integration, and webhook endpoints.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap">
            <ButtonBase
              onClick={() => navigate("/")}
              sx={{ px: 2.2, py: 1.2, borderRadius: 2.5, backgroundColor: "#D5ECF8", color: "#00342B" }}
            >
              <Typography sx={{ fontSize: "0.92rem", fontWeight: 800 }}>Home</Typography>
            </ButtonBase>
            <ButtonBase
              onClick={() => navigate("/login")}
              sx={{ px: 2.2, py: 1.2, borderRadius: 2.5, backgroundColor: "#00342B", color: "#FFFFFF" }}
            >
              <Typography sx={{ fontSize: "0.92rem", fontWeight: 800 }}>Log In</Typography>
            </ButtonBase>
          </Stack>
        </Stack>
      ) : null}

      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 5,
          background: "linear-gradient(135deg, rgba(230,246,255,0.95) 0%, rgba(213,236,248,0.9) 100%)",
          boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
        }}
      >
        <Stack spacing={2.2}>
          <Stack direction="row" spacing={1.1} alignItems="center">
            <CodeRoundedIcon sx={{ color: "#046B5E" }} />
            <Typography sx={{ fontSize: "0.84rem", fontWeight: 900, letterSpacing: 2.1, textTransform: "uppercase", color: "#046B5E" }}>
              API Reference
            </Typography>
          </Stack>
          <Typography
            sx={{
              fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
              fontSize: { xs: "2.6rem", md: "4rem" },
              fontWeight: 900,
              letterSpacing: -2.2,
              lineHeight: 0.95,
              color: "#00342B"
            }}
          >
            Integration-Ready
            <br />
            Workflow API
          </Typography>
          <Typography sx={{ maxWidth: 880, fontSize: "1.08rem", lineHeight: 1.7, color: "#42536D" }}>
            ChangeFlow exposes a pragmatic JSON API for construction workflow operations: authentication,
            project portfolio management, change-order review, file uploads, sync orchestration, and webhook intake.
          </Typography>
          <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap">
            {[
              { label: `Base URL: ${API_BASE_URL}`, tone: "#00342B", backgroundColor: "#FFFFFF" },
              { label: "Auth: Bearer JWT", tone: "#0F6F62", backgroundColor: "#9DEFDE" },
              { label: "Uploads: Signed S3 URLs", tone: "#00342B", backgroundColor: "#D5ECF8" }
            ].map((pill) => (
              <Box key={pill.label} sx={{ px: 1.6, py: 0.9, borderRadius: 999, backgroundColor: pill.backgroundColor, color: pill.tone }}>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>{pill.label}</Typography>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.35fr 0.95fr" }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          {endpointGroups.map((group) => (
            <Paper
              key={group.title}
              elevation={0}
              sx={{
                p: { xs: 3, md: 3.4 },
                borderRadius: 4,
                backgroundColor: "#FFFFFF",
                boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
              }}
            >
              <Stack direction="row" spacing={1.2} alignItems="center">
                {group.icon}
                <Typography
                  sx={{
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: "1.7rem",
                    fontWeight: 800,
                    letterSpacing: -1,
                    color: "#00342B"
                  }}
                >
                  {group.title}
                </Typography>
              </Stack>
              <Typography sx={{ mt: 1.2, fontSize: "1rem", lineHeight: 1.65, color: "#5A6A84" }}>
                {group.description}
              </Typography>
              <Stack spacing={1.2} sx={{ mt: 2.2 }}>
                {group.endpoints.map((endpoint) => (
                  <Box
                    key={`${group.title}-${endpoint.method}-${endpoint.path}`}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      backgroundColor: "#F8FBFF",
                      border: "1px solid rgba(213,236,248,0.9)"
                    }}
                  >
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ xs: "flex-start", md: "center" }}>
                      <MethodChip method={endpoint.method} />
                      <Typography
                        sx={{
                          fontSize: "0.92rem",
                          fontWeight: 800,
                          color: "#00342B",
                          fontFamily: '"SFMono-Regular", "Menlo", "Monaco", monospace',
                          wordBreak: "break-all"
                        }}
                      >
                        {endpoint.path}
                      </Typography>
                    </Stack>
                    <Typography sx={{ mt: 1, fontSize: "0.95rem", lineHeight: 1.65, color: "#5A6A84" }}>
                      {endpoint.summary}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Stack spacing={2.5}>
          <Paper elevation={0} sx={{ p: 3.2, borderRadius: 4, backgroundColor: "#FFFFFF", boxShadow: "0 12px 32px rgba(7,30,39,0.04)" }}>
            <Typography sx={{ fontSize: "1.35rem", fontWeight: 800, color: "#00342B" }}>Response Contract</Typography>
            <Typography sx={{ mt: 1.1, fontSize: "0.98rem", lineHeight: 1.65, color: "#5A6A84" }}>
              The API returns a consistent envelope for success and failure responses.
            </Typography>
            <Stack spacing={1.4} sx={{ mt: 2 }}>
              <CodeBlock code={successEnvelopeExample} />
              <CodeBlock code={errorEnvelopeExample} />
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 3.2, borderRadius: 4, backgroundColor: "#FFFFFF", boxShadow: "0 12px 32px rgba(7,30,39,0.04)" }}>
            <Stack direction="row" spacing={1.1} alignItems="center">
              <CloudUploadRoundedIcon sx={{ color: "#046B5E" }} />
              <Typography sx={{ fontSize: "1.35rem", fontWeight: 800, color: "#00342B" }}>Upload Flow</Typography>
            </Stack>
            <Stack spacing={1.1} sx={{ mt: 1.8 }}>
              {uploadFlowExample.map((step) => (
                <Typography key={step} sx={{ fontSize: "0.96rem", lineHeight: 1.65, color: "#42536D" }}>
                  {step}
                </Typography>
              ))}
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 3.2, borderRadius: 4, backgroundColor: "#FFFFFF", boxShadow: "0 12px 32px rgba(7,30,39,0.04)" }}>
            <Stack direction="row" spacing={1.1} alignItems="center">
              <WebhookRoundedIcon sx={{ color: "#046B5E" }} />
              <Typography sx={{ fontSize: "1.35rem", fontWeight: 800, color: "#00342B" }}>Webhook Notes</Typography>
            </Stack>
            <Stack spacing={1.1} sx={{ mt: 1.8 }}>
              {webhookNotes.map((note) => (
                <Typography key={note} sx={{ fontSize: "0.96rem", lineHeight: 1.65, color: "#42536D" }}>
                  {note}
                </Typography>
              ))}
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 3.2, borderRadius: 4, backgroundColor: "#FFFFFF", boxShadow: "0 12px 32px rgba(7,30,39,0.04)" }}>
            <Typography sx={{ fontSize: "1.35rem", fontWeight: 800, color: "#00342B" }}>Sample Requests</Typography>
            <Stack spacing={1.4} sx={{ mt: 2 }}>
              <CodeBlock code={loginExample} />
              <CodeBlock code={createChangeOrderExample} />
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 3.2, borderRadius: 4, background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)", color: "#FFFFFF" }}>
            <Stack direction="row" spacing={1.1} alignItems="center">
              <OpenInNewRoundedIcon sx={{ color: "#9DEFDE" }} />
              <Typography sx={{ fontSize: "1.35rem", fontWeight: 800 }}>Companion Docs</Typography>
            </Stack>
            <Typography sx={{ mt: 1.2, fontSize: "0.98rem", lineHeight: 1.7, color: "rgba(255,255,255,0.78)" }}>
              Pair this page with the repo docs for setup, architecture, and optional provider configuration.
            </Typography>
            <Stack spacing={0.8} sx={{ mt: 2 }}>
              {["docs/architecture.md", "docs/setup.md", "docs/api-setup.md"].map((item) => (
                <Typography key={item} sx={{ fontSize: "0.92rem", fontWeight: 700, color: "#FFFFFF" }}>
                  {item}
                </Typography>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Box>

      <WorkspaceFooter />
    </Stack>
  );
}
