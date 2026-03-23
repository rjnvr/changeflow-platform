import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import RequestQuoteRoundedIcon from "@mui/icons-material/RequestQuoteRounded";
import SyncAltRoundedIcon from "@mui/icons-material/SyncAltRounded";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { getIntegrations, syncChangeOrder } from "../api/integrations";
import { Button } from "../components/common/Button";
import type { IntegrationConnection } from "../types/integration";
import { formatDate } from "../utils/formatDate";

type HealthTone = "success" | "warning";
type LogStatus = "success" | "failed";

interface ProviderCard {
  id: string;
  provider: string;
  label: string;
  score: number;
  tone: HealthTone;
  icon: ReactNode;
}

interface SyncLogRow {
  id: string;
  resource: string;
  direction: string;
  status: LogStatus;
  successRate: string;
  timeLabel: string;
  icon: ReactNode;
}

const defaultIntegrations: IntegrationConnection[] = [
  {
    id: "int_1",
    provider: "Slack",
    status: "connected",
    lastSyncedAt: new Date().toISOString()
  },
  {
    id: "int_2",
    provider: "Procore",
    status: "connected",
    lastSyncedAt: new Date().toISOString()
  },
  {
    id: "int_3",
    provider: "QuickBooks",
    status: "disconnected"
  }
];

function FooterLinks() {
  return (
    <Box
      sx={{
        pt: 1,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 3,
        flexWrap: "wrap",
        color: "rgba(90,106,132,0.86)"
      }}
    >
      <Typography sx={{ fontSize: "0.82rem", letterSpacing: 2.2, textTransform: "uppercase" }}>
        © 2024 ChangeFlow Intelligence. Built for the modern jobsite.
      </Typography>
      <Stack direction="row" spacing={3.5} useFlexGap flexWrap="wrap">
        {["Terms", "Privacy", "Trust & Security", "API Docs"].map((item) => (
          <Typography key={item} sx={{ fontSize: "0.82rem", letterSpacing: 2.2, textTransform: "uppercase" }}>
            {item}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}

function OperationalPill({ label, accent }: { label: string; accent: string }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        px: 1.8,
        py: 1,
        borderRadius: 999,
        backgroundColor: accent === "#046B5E" ? "#9DEFDE" : "#D5ECF8",
        color: accent === "#046B5E" ? "#0F6F62" : "#00342B"
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: accent
        }}
      />
      <Typography
        sx={{
          fontSize: "0.82rem",
          fontWeight: 900,
          letterSpacing: 1.7,
          textTransform: "uppercase"
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function LogStatusChip({ status }: { status: LogStatus }) {
  const styles =
    status === "success"
      ? { backgroundColor: "#9DEFDE", color: "#0F6F62", label: "Success" }
      : { backgroundColor: "#FFDBD1", color: "#872000", label: "Failed" };

  return (
    <Box
      sx={{
        display: "inline-flex",
        px: 1.25,
        py: 0.45,
        borderRadius: 1.4,
        backgroundColor: styles.backgroundColor,
        color: styles.color
      }}
    >
      <Typography
        sx={{
          fontSize: "0.76rem",
          fontWeight: 800,
          letterSpacing: 0.5,
          textTransform: "uppercase"
        }}
      >
        {styles.label}
      </Typography>
    </Box>
  );
}

export function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationConnection[]>([]);
  const [message, setMessage] = useState("");
  const [syncFrequency, setSyncFrequency] = useState<"real-time" | "hourly">("real-time");

  useEffect(() => {
    getIntegrations()
      .then(setIntegrations)
      .catch((requestError: Error) => setMessage(requestError.message));
  }, []);

  async function runSampleSync() {
    try {
      const result = await syncChangeOrder("co_1001", "Procore");
      setMessage(`Manual sync completed successfully at ${formatDate(result.syncedAt)}.`);
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : "Sync failed.");
    }
  }

  const displayIntegrations = integrations.length > 0 ? integrations : defaultIntegrations;
  const connectedCount = displayIntegrations.filter((item) => item.status === "connected").length;
  const errorCount = displayIntegrations.filter((item) => item.status === "error" || item.status === "disconnected").length;

  const providerCards: ProviderCard[] = displayIntegrations.map((integration) => {
    if (integration.provider === "Procore") {
      return {
        id: integration.id,
        provider: "Procore V2",
        label: integration.status === "connected" ? "Operational" : "Attention Required",
        score: integration.status === "connected" ? 100 : 78.5,
        tone: integration.status === "connected" ? "success" : "warning",
        icon: <ConstructionRoundedIcon sx={{ fontSize: 28 }} />
      };
    }

    if (integration.provider === "QuickBooks") {
      return {
        id: integration.id,
        provider: "QuickBooks",
        label: integration.status === "connected" ? "Active Sync" : "API Delay",
        score: integration.status === "connected" ? 96.1 : 82.4,
        tone: integration.status === "connected" ? "success" : "warning",
        icon: <AccountBalanceRoundedIcon sx={{ fontSize: 28 }} />
      };
    }

    return {
      id: integration.id,
      provider: integration.provider,
      label: integration.status === "connected" ? "Active Alerts" : "Attention Required",
      score: integration.status === "connected" ? 99.8 : 76.2,
      tone: integration.status === "connected" ? "success" : "warning",
      icon: <HubRoundedIcon sx={{ fontSize: 28 }} />
    };
  });

  const syncLogRows: SyncLogRow[] = [
    {
      id: "log_1",
      resource: "Change Order #402",
      direction: "ChangeFlow -> Procore",
      status: "success",
      successRate: "100%",
      timeLabel: "10:45:12 EST",
      icon: <DescriptionRoundedIcon sx={{ fontSize: 20 }} />
    },
    {
      id: "log_2",
      resource: "Budget Line Items",
      direction: "QuickBooks -> ChangeFlow",
      status: connectedCount >= 3 ? "success" : "failed",
      successRate: connectedCount >= 3 ? "100%" : "64%",
      timeLabel: "10:02:38 EST",
      icon: <PaymentsRoundedIcon sx={{ fontSize: 20 }} />
    },
    {
      id: "log_3",
      resource: "Invoice #9921-A",
      direction: "QuickBooks -> ChangeFlow",
      status: "failed",
      successRate: "0%",
      timeLabel: "09:12:44 EST",
      icon: <RequestQuoteRoundedIcon sx={{ fontSize: 20 }} />
    },
    {
      id: "log_4",
      resource: "Subcontractor Roster",
      direction: "Procore -> ChangeFlow",
      status: "success",
      successRate: "100%",
      timeLabel: "08:59:30 EST",
      icon: <GroupRoundedIcon sx={{ fontSize: 20 }} />
    }
  ];

  return (
    <Stack spacing={4.5}>
      {message ? <Alert severity="info">{message}</Alert> : null}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 3,
          flexWrap: "wrap"
        }}
      >
        <Box sx={{ maxWidth: 640 }}>
          <Typography
            sx={{
              fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
              fontSize: { xs: "3rem", md: "4rem" },
              fontWeight: 900,
              letterSpacing: -2.6,
              lineHeight: 0.95,
              color: "#00342B"
            }}
          >
            System Health
          </Typography>
          <Typography
            sx={{
              mt: 2,
              fontSize: "1.2rem",
              lineHeight: 1.55,
              color: "#5A6A84"
            }}
          >
            Monitoring live synchronization between ChangeFlow and your construction accounting ecosystem.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
          <OperationalPill label={errorCount > 0 ? "Monitoring" : "Operational"} accent="#046B5E" />
          <OperationalPill label="Last Check: 2m ago" accent="#93A6C3" />
        </Stack>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" },
          gap: 2.5
        }}
      >
        {providerCards.map((provider) => (
          <Paper
            key={provider.id}
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 4,
              backgroundColor: "#FFFFFF",
              boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start" }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2.5,
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: "#D5ECF8",
                  color: "#00342B"
                }}
              >
                {provider.icon}
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography
                  sx={{
                    fontSize: "0.82rem",
                    fontWeight: 900,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "#93A6C3"
                  }}
                >
                  {provider.provider}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.8,
                    fontSize: "1rem",
                    fontWeight: 900,
                    color: provider.tone === "success" ? "#046B5E" : "#7A1E08",
                    textTransform: "uppercase"
                  }}
                >
                  {provider.label}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-end", mb: 1.5 }}>
                <Typography
                  sx={{
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: "3rem",
                    fontWeight: 900,
                    letterSpacing: -1.5,
                    color: "#00342B"
                  }}
                >
                  {provider.score}%
                </Typography>
                <Typography sx={{ fontSize: "1rem", color: "#93A6C3" }}>Health Score</Typography>
              </Box>
              <Box sx={{ width: "100%", height: 6, borderRadius: 999, backgroundColor: "#D5ECF8", overflow: "hidden" }}>
                <Box
                  sx={{
                    width: `${provider.score}%`,
                    height: "100%",
                    borderRadius: 999,
                    backgroundColor: provider.tone === "success" ? "#046B5E" : "#7A1E08"
                  }}
                />
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.8fr) 320px" },
          gap: 3
        }}
      >
        <Stack spacing={3}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap"
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                fontSize: "2.4rem",
                fontWeight: 800,
                letterSpacing: -1.4,
                color: "#00342B"
              }}
            >
              Sync Log
            </Typography>
            <ButtonBase sx={{ color: "#046B5E" }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <DownloadRoundedIcon sx={{ fontSize: 18 }} />
                <Typography sx={{ fontSize: "1rem", fontWeight: 800 }}>Export History</Typography>
              </Stack>
            </ButtonBase>
          </Box>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              overflow: "hidden",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
            }}
          >
            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 900 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1.7fr 1.1fr 0.9fr 0.8fr 0.8fr",
                    px: 4,
                    py: 3,
                    backgroundColor: "#D5ECF8"
                  }}
                >
                  {["Resource", "Direction", "Status", "Success Rate", "Timestamp"].map((item) => (
                    <Typography
                      key={item}
                      sx={{
                        fontSize: "0.76rem",
                        fontWeight: 900,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                        color: "#5A6A84"
                      }}
                    >
                      {item}
                    </Typography>
                  ))}
                </Box>

                {syncLogRows.map((row, index) => (
                  <Box
                    key={row.id}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1.7fr 1.1fr 0.9fr 0.8fr 0.8fr",
                      alignItems: "center",
                      px: 4,
                      py: 3.5,
                      backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F9FCFF"
                    }}
                  >
                    <Stack direction="row" spacing={1.6} alignItems="center">
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1.5,
                          display: "grid",
                          placeItems: "center",
                          backgroundColor: row.status === "success" ? "#D5ECF8" : "#FFDBD1",
                          color: row.status === "success" ? "#00342B" : "#7A1E08"
                        }}
                      >
                        {row.icon}
                      </Box>
                      <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#071E27" }}>{row.resource}</Typography>
                    </Stack>

                    <Typography sx={{ fontSize: "1rem", color: "#42536D" }}>{row.direction}</Typography>
                    <LogStatusChip status={row.status} />
                    <Typography
                      sx={{
                        fontSize: "1rem",
                        fontWeight: 800,
                        color: row.status === "success" ? "#00342B" : "#7A1E08"
                      }}
                    >
                      {row.successRate}
                    </Typography>
                    <Typography sx={{ fontSize: "0.96rem", color: "#93A6C3" }}>{row.timeLabel}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Stack>

        <Stack spacing={3}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              minHeight: 46
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                fontSize: "2rem",
                fontWeight: 800,
                letterSpacing: -1.2,
                color: "#00342B"
              }}
            >
              Integration Settings
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: 3.4,
              borderRadius: 4,
              backgroundColor: "#D5ECF8",
              boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
            }}
          >
            <Typography
              sx={{
                fontSize: "0.84rem",
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "#046B5E"
              }}
            >
              Sync Frequency
            </Typography>

            <Stack direction="row" spacing={1.2} sx={{ mt: 2.4 }}>
              {[
                { value: "real-time", label: "Real-time" },
                { value: "hourly", label: "Hourly" }
              ].map((option) => {
                const active = syncFrequency === option.value;

                return (
                  <ButtonBase
                    key={option.value}
                    onClick={() => setSyncFrequency(option.value as "real-time" | "hourly")}
                    sx={{
                      flex: 1,
                      px: 1.8,
                      py: 1.9,
                      borderRadius: 2,
                      backgroundColor: active ? "#FFFFFF" : "#CFE6F2",
                      color: active ? "#071E27" : "#7A869F"
                    }}
                  >
                    <Typography sx={{ fontSize: "1rem", fontWeight: 800 }}>{option.label}</Typography>
                  </ButtonBase>
                );
              })}
            </Stack>

            <Typography
              sx={{
                mt: 3.5,
                fontSize: "0.84rem",
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "#046B5E"
              }}
            >
              API Connectivity
            </Typography>

            <Stack spacing={1.6} sx={{ mt: 2.4 }}>
              {displayIntegrations.map((integration) => (
                <Paper
                  key={integration.id}
                  elevation={0}
                  sx={{
                    px: 2,
                    py: 2.1,
                    borderRadius: 2.5,
                    backgroundColor: "#FFFFFF"
                  }}
                >
                  <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      {integration.status === "connected" ? (
                        <CheckCircleRoundedIcon sx={{ color: "#046B5E" }} />
                      ) : (
                        <WarningAmberRoundedIcon sx={{ color: "#7A1E08" }} />
                      )}
                      <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#071E27" }}>
                        {integration.provider}
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: "#93A6C3" }}>
                      {integration.status === "connected"
                        ? integration.provider === "Slack"
                          ? "24ms latency"
                          : "Active"
                        : "Retrying"}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>

            <Button
              onClick={runSampleSync}
              startIcon={<SyncAltRoundedIcon />}
              sx={{
                mt: 3,
                width: "100%",
                py: 1.8,
                borderRadius: 2.5,
                fontSize: "1rem",
                fontWeight: 800,
                background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)"
              }}
            >
              Run Manual Global Sync
            </Button>

            <ButtonBase
              onClick={() => setMessage("API key rotation workflow prepared for demo review.")}
              sx={{
                mt: 2.2,
                width: "100%",
                py: 1.8,
                borderRadius: 2.5,
                backgroundColor: "#CFE6F2",
                color: "#00342B"
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <VpnKeyRoundedIcon sx={{ fontSize: 20 }} />
                <Typography sx={{ fontSize: "1rem", fontWeight: 800 }}>Rotate API Keys</Typography>
              </Stack>
            </ButtonBase>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 4,
              color: "#FFFFFF",
              background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)",
              boxShadow: "0 20px 40px rgba(7,30,39,0.12)"
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                fontSize: "2rem",
                fontWeight: 700,
                letterSpacing: -1.1
              }}
            >
              Need help with Webhooks?
            </Typography>
            <Typography sx={{ mt: 1.8, fontSize: "1rem", lineHeight: 1.6, color: "rgba(255,255,255,0.86)" }}>
              Read our detailed architectural documentation for custom field mapping and sync audit flows.
            </Typography>

            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mt: 4 }}>
              <Typography
                sx={{
                  fontSize: "0.92rem",
                  fontWeight: 900,
                  letterSpacing: 1.8,
                  textTransform: "uppercase"
                }}
              >
                View API Docs
              </Typography>
              <ArrowRightGlyph />
            </Stack>
          </Paper>
        </Stack>
      </Box>

      <FooterLinks />
    </Stack>
  );
}

function ArrowRightGlyph() {
  return (
    <Box
      sx={{
        width: 42,
        height: 42,
        display: "grid",
        placeItems: "center",
        borderRadius: 2,
        backgroundColor: "rgba(255,255,255,0.08)"
      }}
    >
      <Box
        sx={{
          width: 18,
          height: 18,
          borderTop: "3px solid #FFFFFF",
          borderRight: "3px solid #FFFFFF",
          transform: "rotate(45deg)"
        }}
      />
    </Box>
  );
}
