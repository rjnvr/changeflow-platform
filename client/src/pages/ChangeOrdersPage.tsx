import { useState } from "react";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import ImportContactsRoundedIcon from "@mui/icons-material/ImportContactsRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useSearchParams } from "react-router-dom";

import { CreateChangeOrderModal } from "../components/change-orders/CreateChangeOrderModal";
import { useChangeOrders } from "../hooks/useChangeOrders";
import { useProjects } from "../hooks/useProjects";
import type { ChangeOrder } from "../types/changeOrder";
import { formatCurrency } from "../utils/formatCurrency";

type PipelineStatus = "pending" | "approved" | "disputed";

interface PipelineRow {
  id: string;
  reference: string;
  revision: string;
  project: string;
  vendor: string;
  submittedAt: string;
  value: number;
  status: PipelineStatus;
}

const summaryCards = [
  { label: "Pending Review", value: "12", accent: "#00342B", color: "#00342B" },
  { label: "Approved Today", value: "08", accent: "#046B5E", color: "#046B5E" },
  { label: "Disputed", value: "03", accent: "#7A1E08", color: "#7A1E08" }
] as const;

const supplementalRows: PipelineRow[] = [
  {
    id: "co_8842",
    reference: "CO-8842",
    revision: "REV-1.2",
    project: "River Crossing",
    vendor: "Modern HVAC",
    submittedAt: "2026-03-22T09:15:00-04:00",
    value: 12850,
    status: "approved"
  },
  {
    id: "co_9945",
    reference: "CO-9945",
    revision: "REV-0.1",
    project: "Hudson Yards II",
    vendor: "Elite Concrete",
    submittedAt: "2026-03-21T16:45:00-04:00",
    value: 124000,
    status: "disputed"
  },
  {
    id: "co_1002",
    reference: "CO-1002",
    revision: "REV-2.3",
    project: "Skyline Tower",
    vendor: "Apex Steel Co.",
    submittedAt: "2026-03-20T11:00:00-04:00",
    value: 8210,
    status: "pending"
  }
];

function mapChangeOrderStatus(status: ChangeOrder["status"]): PipelineStatus {
  if (status === "approved" || status === "synced") {
    return "approved";
  }

  if (status === "rejected") {
    return "disputed";
  }

  return "pending";
}

function formatReference(changeOrderId: string) {
  return `CO-${changeOrderId.replace(/^co_/, "").replace(/_/g, "-").toUpperCase()}`;
}

function formatSubmittedAt(value: string) {
  const date = new Date(value);

  return {
    day: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date),
    time: new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZoneName: "short"
    }).format(date)
  };
}

function StatusChip({ status }: { status: PipelineStatus }) {
  const styles = {
    pending: {
      backgroundColor: "#FFDBD1",
      color: "#872000",
      dotColor: "#7A1E08",
      label: "Pending"
    },
    approved: {
      backgroundColor: "#9DEFDE",
      color: "#0F6F62",
      dotColor: "#046B5E",
      label: "Approved"
    },
    disputed: {
      backgroundColor: "#CFE6F2",
      color: "#3F4945",
      dotColor: "#707975",
      label: "Disputed"
    }
  }[status];

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        px: 1.8,
        py: 0.75,
        borderRadius: 999,
        backgroundColor: styles.backgroundColor,
        color: styles.color
      }}
    >
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: styles.dotColor
        }}
      />
      <Typography
        sx={{
          fontSize: "0.82rem",
          fontWeight: 800,
          letterSpacing: 1.1,
          textTransform: "uppercase"
        }}
      >
        {styles.label}
      </Typography>
    </Box>
  );
}

function SummaryCard({
  label,
  value,
  accent,
  color
}: {
  label: string;
  value: string;
  accent: string;
  color: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        minWidth: { xs: "100%", sm: 180 },
        px: 3.6,
        py: 3.2,
        borderRadius: 4,
        backgroundColor: "#FFFFFF",
        boxShadow: "0 12px 32px rgba(7,30,39,0.04)",
        borderLeft: `4px solid ${accent}`
      }}
    >
      <Typography
        sx={{
          fontSize: "0.78rem",
          fontWeight: 900,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "#707975"
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 1.2,
          fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
          fontSize: "3rem",
          fontWeight: 900,
          letterSpacing: -1.8,
          color
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

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

function EmptyState({
  onCreate,
  onImport
}: {
  onCreate: () => void;
  onImport: () => void;
}) {
  return (
    <Stack spacing={4.5}>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          px: { xs: 1, md: 4 }
        }}
      >
        <Stack spacing={4.5} alignItems="center" textAlign="center" sx={{ maxWidth: 760, width: "100%" }}>
          <Box sx={{ position: "relative", display: "inline-block" }}>
            <Box
              sx={{
                position: "absolute",
                top: -36,
                left: -36,
                width: 180,
                height: 180,
                borderRadius: "50%",
                backgroundColor: "rgba(157,239,222,0.24)",
                filter: "blur(48px)"
              }}
            />
            <Box
              sx={{
                position: "absolute",
                right: -42,
                bottom: -30,
                width: 180,
                height: 180,
                borderRadius: "50%",
                backgroundColor: "rgba(0,77,64,0.12)",
                filter: "blur(56px)"
              }}
            />
            <Paper
              elevation={0}
              sx={{
                position: "relative",
                p: 6,
                borderRadius: 8,
                backgroundColor: "#FFFFFF",
                boxShadow: "0 32px 64px rgba(7,30,39,0.08)"
              }}
            >
              <Box
                sx={{
                  width: 128,
                  height: 128,
                  borderRadius: 6,
                  display: "grid",
                  placeItems: "center",
                  border: "4px dashed #D5ECF8",
                  position: "relative"
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: "5rem",
                    fontWeight: 900,
                    color: "rgba(191,201,196,0.5)"
                  }}
                >
                  A
                </Typography>
                <Box
                  sx={{
                    position: "absolute",
                    right: -18,
                    bottom: -18,
                    width: 76,
                    height: 76,
                    borderRadius: 4,
                    display: "grid",
                    placeItems: "center",
                    backgroundColor: "#00342B",
                    color: "#FFFFFF",
                    boxShadow: "0 20px 36px rgba(7,30,39,0.18)"
                  }}
                >
                  <AddCircleRoundedIcon sx={{ fontSize: 38 }} />
                </Box>
              </Box>
            </Paper>
          </Box>

          <Box>
            <Typography
              sx={{
                fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                fontSize: { xs: "3rem", md: "4.5rem" },
                fontWeight: 900,
                letterSpacing: -3,
                lineHeight: 0.92,
                color: "#00342B"
              }}
            >
              No Change Orders Yet
            </Typography>
            <Typography
              sx={{
                mt: 2.5,
                maxWidth: 560,
                mx: "auto",
                fontSize: "1.18rem",
                lineHeight: 1.65,
                color: "#42536D"
              }}
            >
              Start tracking your project variances by creating your first change order. Maintain
              operational elegance in your construction lifecycle.
            </Typography>
          </Box>

          <Stack direction="row" spacing={3} useFlexGap flexWrap="wrap" justifyContent="center" sx={{ pt: 1 }}>
            <ButtonBase
              onClick={onCreate}
              sx={{
                px: 4,
                py: 2.2,
                borderRadius: 3,
                background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)",
                color: "#FFFFFF",
                boxShadow: "0 18px 30px rgba(7,30,39,0.14)"
              }}
            >
              <Stack direction="row" spacing={1.4} alignItems="center">
                <AddCircleRoundedIcon />
                <Typography sx={{ fontSize: "1.1rem", fontWeight: 800 }}>New Change Order</Typography>
              </Stack>
            </ButtonBase>

            <ButtonBase onClick={onImport} sx={{ px: 2.5, py: 2.2, color: "#00342B" }}>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <ImportContactsRoundedIcon />
                <Typography sx={{ fontSize: "1.1rem", fontWeight: 800 }}>Import CSV</Typography>
              </Stack>
            </ButtonBase>
          </Stack>

          <Box
            sx={{
              pt: 5,
              width: "100%",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: 4,
              borderTop: "1px solid rgba(213,236,248,0.9)"
            }}
          >
            {[
              { label: "Total Impact", value: "$0.00" },
              { label: "Active Claims", value: "0" },
              { label: "Approval Time", value: "-- d" }
            ].map((item) => (
              <Box key={item.label} sx={{ textAlign: "left" }}>
                <Typography
                  sx={{
                    fontSize: "0.82rem",
                    fontWeight: 900,
                    letterSpacing: 2.2,
                    textTransform: "uppercase",
                    color: "#707975"
                  }}
                >
                  {item.label}
                </Typography>
                <Typography
                  sx={{
                    mt: 1,
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: "#00342B"
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Stack>
      </Box>

      <FooterLinks />
    </Stack>
  );
}

export function ChangeOrdersPage() {
  const { changeOrders, error, refresh } = useChangeOrders();
  const { projects } = useProjects();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projectFilter, setProjectFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | PipelineStatus>("all");
  const [message, setMessage] = useState("");

  const projectLookup = Object.fromEntries(projects.map((project) => [project.id, project.name]));

  const liveRows: PipelineRow[] = changeOrders.map((changeOrder, index) => ({
    id: changeOrder.id,
    reference: formatReference(changeOrder.id),
    revision: `REV-${index + 1}.0`,
    project: projectLookup[changeOrder.projectId] ?? "Harbor 26 Tower",
    vendor: changeOrder.requestedBy === "Demo User" ? "Owner Request" : changeOrder.requestedBy,
    submittedAt: changeOrder.updatedAt,
    value: changeOrder.amount,
    status: mapChangeOrderStatus(changeOrder.status)
  }));

  const openCreateModal = searchParams.get("new") === "1";
  const showEmptyState = searchParams.get("empty") === "1" || liveRows.length === 0;

  const pipelineRows = [...liveRows, ...supplementalRows].slice(0, 4);
  const projectOptions = ["all", ...new Set(pipelineRows.map((row) => row.project))];
  const vendorOptions = ["all", ...new Set(pipelineRows.map((row) => row.vendor))];

  const filteredRows = pipelineRows.filter((row) => {
    const projectMatches = projectFilter === "all" || row.project === projectFilter;
    const vendorMatches = vendorFilter === "all" || row.vendor === vendorFilter;
    const statusMatches = statusFilter === "all" || row.status === statusFilter;

    return projectMatches && vendorMatches && statusMatches;
  });

  const exposureAlertCount = pipelineRows.filter((row) => row.value >= 50000).length;

  function setModalState(open: boolean) {
    const next = new URLSearchParams(searchParams);

    if (open) {
      next.set("new", "1");
    } else {
      next.delete("new");
    }

    setSearchParams(next);
  }

  async function handleCreated() {
    await refresh();

    const next = new URLSearchParams(searchParams);
    next.delete("new");
    next.delete("empty");
    setSearchParams(next);
    setMessage("Change order created and submitted into the review pipeline.");
  }

  if (showEmptyState) {
    return (
      <>
        {message ? <Alert severity="success">{message}</Alert> : null}
        {error ? <Alert severity="warning">{error}</Alert> : null}

        <EmptyState
          onCreate={() => setModalState(true)}
          onImport={() => setMessage("CSV import is staged for the next backend pass.")}
        />

        <CreateChangeOrderModal
          open={openCreateModal}
          onClose={() => setModalState(false)}
          onCreated={handleCreated}
          projects={projects}
        />
      </>
    );
  }

  return (
    <>
      <Stack spacing={4.5}>
        {message ? <Alert severity="success">{message}</Alert> : null}
        {error ? <Alert severity="warning">{error}</Alert> : null}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 3,
            flexWrap: "wrap"
          }}
        >
          <Box sx={{ maxWidth: 560 }}>
            <Typography
              sx={{
                fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                fontSize: { xs: "3.3rem", md: "4.6rem" },
                fontWeight: 900,
                letterSpacing: -3,
                lineHeight: 0.92,
                color: "#00342B"
              }}
            >
              Change Orders
              <br />
              Pipeline
            </Typography>
            <Typography
              sx={{
                mt: 2.2,
                fontSize: "1.18rem",
                lineHeight: 1.55,
                color: "#42536D"
              }}
            >
              Review and resolve commercial variances for Q4 Operations.
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
            {summaryCards.map((card) => (
              <SummaryCard
                key={card.label}
                label={card.label}
                value={card.value}
                accent={card.accent}
                color={card.color}
              />
            ))}
          </Stack>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", xl: "280px minmax(0, 1fr)" },
            gap: 3
          }}
        >
          <Stack spacing={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3.6,
                borderRadius: 4,
                backgroundColor: "#D5ECF8",
                boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
              }}
            >
              <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 4 }}>
                <FilterAltRoundedIcon sx={{ color: "#071E27" }} />
                <Typography
                  sx={{
                    fontSize: "1.05rem",
                    fontWeight: 900,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "#071E27"
                  }}
                >
                  Filters
                </Typography>
              </Stack>

              <Stack spacing={3.2}>
                <Box>
                  <Typography
                    sx={{
                      mb: 1.2,
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      color: "#707975"
                    }}
                  >
                    Project
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={projectFilter}
                      onChange={(event) => setProjectFilter(event.target.value)}
                      IconComponent={KeyboardArrowDownRoundedIcon}
                      sx={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: 2.5,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(191,201,196,0.35)"
                        }
                      }}
                    >
                      {projectOptions.map((project) => (
                        <MenuItem key={project} value={project}>
                          {project === "all" ? "All Projects" : project}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <Typography
                    sx={{
                      mb: 1.2,
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      color: "#707975"
                    }}
                  >
                    Vendor
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={vendorFilter}
                      onChange={(event) => setVendorFilter(event.target.value)}
                      IconComponent={KeyboardArrowDownRoundedIcon}
                      sx={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: 2.5,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(191,201,196,0.35)"
                        }
                      }}
                    >
                      {vendorOptions.map((vendor) => (
                        <MenuItem key={vendor} value={vendor}>
                          {vendor === "all" ? "All Vendors" : vendor}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <Typography
                    sx={{
                      mb: 1.2,
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      color: "#707975"
                    }}
                  >
                    Status
                  </Typography>
                  <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap">
                    {[
                      { value: "all", label: "All" },
                      { value: "pending", label: "Pending" },
                      { value: "disputed", label: "Disputed" }
                    ].map((option) => {
                      const active = statusFilter === option.value;

                      return (
                        <ButtonBase
                          key={option.value}
                          onClick={() => setStatusFilter(option.value as "all" | PipelineStatus)}
                          sx={{
                            px: 2,
                            py: 1.1,
                            borderRadius: 999,
                            backgroundColor: active ? "#00342B" : "#FFFFFF",
                            color: active ? "#FFFFFF" : "#071E27",
                            boxShadow: active ? "0 10px 18px rgba(7,30,39,0.08)" : "none"
                          }}
                        >
                          <Typography sx={{ fontSize: "0.88rem", fontWeight: 700 }}>{option.label}</Typography>
                        </ButtonBase>
                      );
                    })}
                  </Stack>
                </Box>

                <ButtonBase
                  onClick={() => {
                    setProjectFilter("all");
                    setVendorFilter("all");
                    setStatusFilter("all");
                  }}
                  sx={{
                    width: "100%",
                    py: 2,
                    borderRadius: 2.5,
                    backgroundColor: "#CFE6F2",
                    color: "#00342B"
                  }}
                >
                  <Typography sx={{ fontSize: "1rem", fontWeight: 800 }}>Clear All</Typography>
                </ButtonBase>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 3.6,
                borderRadius: 4,
                color: "#FFFFFF",
                background: "linear-gradient(135deg, #7A1E08 0%, #821F00 100%)",
                boxShadow: "0 20px 40px rgba(122,30,8,0.2)"
              }}
            >
              <WarningAmberRoundedIcon sx={{ fontSize: 28 }} />
              <Typography
                sx={{
                  mt: 2,
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontSize: "2rem",
                  fontWeight: 700,
                  letterSpacing: -1
                }}
              >
                Exposure Alert
              </Typography>
              <Typography sx={{ mt: 1.5, fontSize: "1.02rem", lineHeight: 1.55, color: "rgba(255,255,255,0.86)" }}>
                You have {exposureAlertCount} high-value change orders exceeding $50k that require executive sign-off.
              </Typography>
              <Typography
                sx={{
                  mt: 4,
                  fontSize: "0.92rem",
                  fontWeight: 900,
                  letterSpacing: 1.6,
                  textTransform: "uppercase",
                  textDecoration: "underline"
                }}
              >
                Review Now
              </Typography>
            </Paper>
          </Stack>

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
              <Box sx={{ minWidth: 940 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1.1fr 1.3fr 1fr 1fr 0.9fr 0.3fr",
                    px: 4.5,
                    py: 3,
                    backgroundColor: "#D5ECF8"
                  }}
                >
                  {["ID / Reference", "Project & Vendor", "Date Submitted", "Value", "Status", ""].map((item) => (
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

                {filteredRows.map((row, index) => {
                  const submitted = formatSubmittedAt(row.submittedAt);

                  return (
                    <Box
                      key={row.id}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1.1fr 1.3fr 1fr 1fr 0.9fr 0.3fr",
                        alignItems: "center",
                        px: 4.5,
                        py: 3.5,
                        backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F9FCFF"
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                            fontSize: "1.15rem",
                            fontWeight: 800,
                            color: "#00342B"
                          }}
                        >
                          {row.reference}
                        </Typography>
                        <Typography sx={{ mt: 0.7, fontSize: "0.88rem", color: "#707975" }}>{row.revision}</Typography>
                      </Box>

                      <Box>
                        <Typography sx={{ fontSize: "1.02rem", fontWeight: 800, color: "#071E27" }}>{row.project}</Typography>
                        <Typography sx={{ mt: 0.5, fontSize: "0.96rem", color: "#42536D" }}>{row.vendor}</Typography>
                      </Box>

                      <Box>
                        <Typography sx={{ fontSize: "1rem", color: "#071E27" }}>{submitted.day}</Typography>
                        <Typography sx={{ mt: 0.5, fontSize: "0.88rem", color: "#707975" }}>{submitted.time}</Typography>
                      </Box>

                      <Typography
                        sx={{
                          fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                          fontSize: "1.2rem",
                          fontWeight: 800,
                          color: row.status === "approved" ? "#00342B" : "#7A1E08"
                        }}
                      >
                        {formatCurrency(row.value)}
                      </Typography>

                      <StatusChip status={row.status} />

                      <ArrowForwardRoundedIcon sx={{ color: "#7A869F" }} />
                    </Box>
                  );
                })}

                <Box
                  sx={{
                    px: 4.5,
                    py: 2.8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                    backgroundColor: "#D5ECF8"
                  }}
                >
                  <Typography sx={{ fontSize: "1rem", color: "#42536D" }}>
                    Showing {filteredRows.length} of {pipelineRows.length} change orders
                  </Typography>
                  <Stack direction="row" spacing={1.4} alignItems="center">
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 2.5,
                        backgroundColor: "#F3FAFF",
                        color: "#7A869F"
                      }}
                    >
                      ‹
                    </Box>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 2.5,
                        backgroundColor: "#FFFFFF",
                        color: "#00342B"
                      }}
                    >
                      ›
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>

        <FooterLinks />
      </Stack>

      <CreateChangeOrderModal
        open={openCreateModal}
        onClose={() => setModalState(false)}
        onCreated={handleCreated}
        projects={projects}
      />
    </>
  );
}
