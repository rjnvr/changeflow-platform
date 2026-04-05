import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { applyBriefQuotaToAll, getBriefQuotaDashboard, updateUserBriefQuota } from "../api/auth";
import {
  approveProjectAccessRequest,
  getProjectAccessRequests,
  rejectProjectAccessRequest
} from "../api/projects";
import { AddTeamMemberModal } from "../components/projects/AddTeamMemberModal";
import { WorkspaceFooter } from "../components/layout/WorkspaceFooter";
import { useAuthContext } from "../context/AuthContext";
import { useFeedbackContext } from "../context/FeedbackContext";
import { useProjectTeamDirectory } from "../hooks/useProjectTeamDirectory";
import { useProjects } from "../hooks/useProjects";
import type { ProjectAccessRequest } from "../types/project";
import type { BriefQuotaDashboard } from "../types/auth";
import { formatDate } from "../utils/formatDate";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function normalizeLookup(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/\s*\(.*\)\s*$/, "");
}

export function TeamPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { showToast } = useFeedbackContext();
  const { projects } = useProjects();
  const { entries, error, refresh } = useProjectTeamDirectory();
  const [search, setSearch] = useState("");
  const [activeProjectId, setActiveProjectId] = useState<string>("all");
  const [modalProjectId, setModalProjectId] = useState<string | null>(null);
  const [quotaDashboard, setQuotaDashboard] = useState<BriefQuotaDashboard | null>(null);
  const [quotaError, setQuotaError] = useState("");
  const [quotaSavingUserId, setQuotaSavingUserId] = useState<string | null>(null);
  const [quotaApplyAllLoading, setQuotaApplyAllLoading] = useState(false);
  const [quotaDrafts, setQuotaDrafts] = useState<Record<string, string>>({});
  const [teamQuotaDraft, setTeamQuotaDraft] = useState("3");
  const [expandedQuotaProjectIds, setExpandedQuotaProjectIds] = useState<string[]>([]);
  const [projectAccessRequests, setProjectAccessRequests] = useState<ProjectAccessRequest[]>([]);
  const [projectAccessRequestsLoading, setProjectAccessRequestsLoading] = useState(false);
  const [projectAccessRequestsError, setProjectAccessRequestsError] = useState("");
  const [handlingProjectAccessRequestId, setHandlingProjectAccessRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "admin") {
      return;
    }

    getBriefQuotaDashboard()
      .then((dashboard) => {
        setQuotaDashboard(dashboard);
        setQuotaDrafts(
          Object.fromEntries(dashboard.users.map((quotaUser) => [quotaUser.id, String(quotaUser.dailyProjectBriefLimit)]))
        );
        setTeamQuotaDraft(String(dashboard.users[0]?.dailyProjectBriefLimit ?? 3));
      })
      .catch((requestError) => {
        setQuotaError(requestError instanceof Error ? requestError.message : "Unable to load brief quotas.");
      });
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== "admin") {
      return;
    }

    setProjectAccessRequestsLoading(true);
    setProjectAccessRequestsError("");
    getProjectAccessRequests()
      .then((requests) => {
        setProjectAccessRequests(requests);
      })
      .catch((requestError) => {
        setProjectAccessRequestsError(
          requestError instanceof Error ? requestError.message : "Unable to load project access requests."
        );
      })
      .finally(() => {
        setProjectAccessRequestsLoading(false);
      });
  }, [user?.role]);

  const quotaGrouping = useMemo(() => {
    if (!quotaDashboard) {
      return {
        groupedUsers: [] as Array<{
          projectId: string;
          projectName: string;
          projectCode: string;
          projectLocation: string;
          users: BriefQuotaDashboard["users"];
        }>,
        unassignedUsers: [] as BriefQuotaDashboard["users"]
      };
    }

    const quotaUsersByName = new Map<string, BriefQuotaDashboard["users"]>();

    quotaDashboard.users.forEach((quotaUser) => {
      const key = normalizeLookup(`${quotaUser.firstName} ${quotaUser.lastName}`);
      const existing = quotaUsersByName.get(key) ?? [];
      quotaUsersByName.set(key, [...existing, quotaUser]);
    });

    const groups = new Map<
      string,
      {
        projectId: string;
        projectName: string;
        projectCode: string;
        projectLocation: string;
        users: BriefQuotaDashboard["users"];
      }
    >();
    const matchedUserIds = new Set<string>();

    entries.forEach((entry) => {
      const key = normalizeLookup(entry.name);
      const matchedUsers = quotaUsersByName.get(key) ?? [];

      if (!groups.has(entry.projectId)) {
        groups.set(entry.projectId, {
          projectId: entry.projectId,
          projectName: entry.projectName,
          projectCode: entry.projectCode,
          projectLocation: entry.projectLocation,
          users: []
        });
      }

      const group = groups.get(entry.projectId)!;

      matchedUsers.forEach((matchedUser) => {
        if (group.users.some((groupUser) => groupUser.id === matchedUser.id)) {
          return;
        }

        group.users.push(matchedUser);
        matchedUserIds.add(matchedUser.id);
      });
    });

    const groupedUsers = [...groups.values()].sort((left, right) => {
      if (right.users.length !== left.users.length) {
        return right.users.length - left.users.length;
      }

      return left.projectName.localeCompare(right.projectName);
    });
    const unassignedUsers = quotaDashboard.users.filter((quotaUser) => !matchedUserIds.has(quotaUser.id));

    return { groupedUsers, unassignedUsers };
  }, [entries, quotaDashboard]);

  useEffect(() => {
    if (!quotaDashboard) {
      return;
    }

    setExpandedQuotaProjectIds((currentExpandedProjectIds) => {
      if (currentExpandedProjectIds.length > 0) {
        return currentExpandedProjectIds;
      }

      const firstProjectId = quotaGrouping.groupedUsers[0]?.projectId;
      return firstProjectId ? [firstProjectId] : [];
    });
  }, [quotaDashboard, quotaGrouping.groupedUsers]);

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const matchesProject = activeProjectId === "all" || entry.projectId === activeProjectId;
        const normalizedSearch = search.trim().toLowerCase();
        const matchesSearch =
          normalizedSearch.length === 0 ||
          entry.name.toLowerCase().includes(normalizedSearch) ||
          entry.role.toLowerCase().includes(normalizedSearch) ||
          entry.projectName.toLowerCase().includes(normalizedSearch);

        return matchesProject && matchesSearch;
      }),
    [activeProjectId, entries, search]
  );

  const groupedEntries = useMemo(() => {
    const groups = new Map<
      string,
      {
        projectId: string;
        projectName: string;
        projectCode: string;
        projectLocation: string;
        members: typeof filteredEntries;
      }
    >();

    filteredEntries.forEach((entry) => {
      const current = groups.get(entry.projectId);

      if (current) {
        current.members.push(entry);
        return;
      }

      groups.set(entry.projectId, {
        projectId: entry.projectId,
        projectName: entry.projectName,
        projectCode: entry.projectCode,
        projectLocation: entry.projectLocation,
        members: [entry]
      });
    });

    return [...groups.values()].sort((left, right) => right.members.length - left.members.length);
  }, [filteredEntries]);

  const uncoveredProjects = projects.filter((project) => !entries.some((entry) => entry.projectId === project.id)).length;

  async function refreshQuotaDashboard() {
    const refreshedDashboard = await getBriefQuotaDashboard();
    setQuotaDashboard(refreshedDashboard);
    setQuotaDrafts(
      Object.fromEntries(refreshedDashboard.users.map((quotaUser) => [quotaUser.id, String(quotaUser.dailyProjectBriefLimit)]))
    );
  }

  async function refreshProjectAccessRequests() {
    const requests = await getProjectAccessRequests();
    setProjectAccessRequests(requests);
  }

  async function handleSaveQuota(quotaUserId: string) {
    const nextLimit = Number(quotaDrafts[quotaUserId] ?? quotaDashboard?.users.find((item) => item.id === quotaUserId)?.dailyProjectBriefLimit ?? 3);

    if (!Number.isFinite(nextLimit) || nextLimit < 1 || nextLimit > 150) {
      setQuotaError("Daily limits must be between 1 and 150.");
      return;
    }

    setQuotaSavingUserId(quotaUserId);
    setQuotaError("");

    try {
      await updateUserBriefQuota(quotaUserId, nextLimit);
      await refreshQuotaDashboard();
      const quotaUser = quotaDashboard?.users.find((item) => item.id === quotaUserId);
      showToast({
        message: quotaUser
          ? `Updated ${quotaUser.firstName} ${quotaUser.lastName}'s daily brief limit.`
          : "Daily brief limit updated.",
        severity: "success"
      });
    } catch (requestError) {
      setQuotaError(requestError instanceof Error ? requestError.message : "Unable to update brief quota.");
    } finally {
      setQuotaSavingUserId(null);
    }
  }

  function toggleQuotaProject(projectId: string) {
    setExpandedQuotaProjectIds((currentExpandedProjectIds) =>
      currentExpandedProjectIds.includes(projectId)
        ? currentExpandedProjectIds.filter((currentProjectId) => currentProjectId !== projectId)
        : [...currentExpandedProjectIds, projectId]
    );
  }

  return (
    <Stack spacing={4}>
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
        <Box sx={{ maxWidth: 760 }}>
          <Typography
            sx={{
              mb: 1,
              fontSize: "0.82rem",
              fontWeight: 800,
              letterSpacing: 2.2,
              textTransform: "uppercase",
              color: "#046B5E"
            }}
          >
            Project Personnel
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
              fontSize: { xs: "3rem", md: "4.4rem" },
              fontWeight: 900,
              letterSpacing: -2.4,
              lineHeight: 0.95,
              color: "#00342B"
            }}
          >
            Team Coverage
          </Typography>
          <Typography sx={{ mt: 2, fontSize: "1.08rem", lineHeight: 1.65, color: "#5A6A84" }}>
            Manage on-site staffing across the portfolio and patch team gaps before they slow field execution.
          </Typography>
        </Box>

        <ButtonBase
          onClick={() => setModalProjectId(activeProjectId === "all" ? projects[0]?.id ?? null : activeProjectId)}
          sx={{
            px: 2.8,
            py: 1.35,
            borderRadius: 2.5,
            background: "linear-gradient(135deg, #00342B 0%, #004D40 100%)",
            color: "#FFFFFF"
          }}
        >
          <Stack direction="row" spacing={1.2} alignItems="center">
            <AddRoundedIcon />
            <Typography sx={{ fontSize: "0.98rem", fontWeight: 800 }}>Add Team Member</Typography>
          </Stack>
        </ButtonBase>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          gap: 2.5
        }}
      >
        {[
          { label: "Rostered Members", value: String(entries.length), icon: <GroupsRoundedIcon /> },
          { label: "Covered Projects", value: String(new Set(entries.map((entry) => entry.projectId)).size), icon: <PersonSearchRoundedIcon /> },
          { label: "Uncovered Projects", value: String(uncoveredProjects), icon: <PlaceRoundedIcon /> }
        ].map((card) => (
          <Paper
            key={card.label}
            elevation={0}
            sx={{
              p: 3.2,
              borderRadius: 4,
              backgroundColor: "#FFFFFF",
              boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
            }}
          >
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Box>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: 900,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "#93A6C3"
                  }}
                >
                  {card.label}
                </Typography>
                <Typography
                  sx={{
                    mt: 1.4,
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: "2.5rem",
                    fontWeight: 900,
                    letterSpacing: -1.6,
                    color: "#00342B"
                  }}
                >
                  {card.value}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2.5,
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: "#D5ECF8",
                  color: "#00342B"
                }}
              >
                {card.icon}
              </Box>
            </Stack>
          </Paper>
        ))}
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          backgroundColor: "#FFFFFF",
          boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} useFlexGap flexWrap="wrap">
          <TextField
            placeholder="Search by person, role, or project..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                backgroundColor: "#E6F6FF"
              }
            }}
          />

          <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap">
            <ButtonBase
              onClick={() => setActiveProjectId("all")}
              sx={{
                px: 2,
                py: 1.15,
                borderRadius: 999,
                backgroundColor: activeProjectId === "all" ? "#00342B" : "#D5ECF8",
                color: activeProjectId === "all" ? "#FFFFFF" : "#00342B"
              }}
            >
              <Typography sx={{ fontSize: "0.9rem", fontWeight: 800 }}>All Projects</Typography>
            </ButtonBase>

            {projects.slice(0, 6).map((project) => {
              const active = activeProjectId === project.id;

              return (
                <ButtonBase
                  key={project.id}
                  onClick={() => setActiveProjectId(project.id)}
                  sx={{
                    px: 2,
                    py: 1.15,
                    borderRadius: 999,
                    backgroundColor: active ? "#00342B" : "#D5ECF8",
                    color: active ? "#FFFFFF" : "#00342B"
                  }}
                >
                  <Typography sx={{ fontSize: "0.9rem", fontWeight: 800 }}>{project.code}</Typography>
                </ButtonBase>
              );
            })}
          </Stack>
        </Stack>
      </Paper>

      {user?.role === "admin" ? (
        <Paper
          elevation={0}
          sx={{
            p: 3.2,
            borderRadius: 4,
            backgroundColor: "#FFFFFF",
            boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
          }}
        >
          <Stack spacing={2.4}>
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                  fontSize: "1.9rem",
                  fontWeight: 800,
                  letterSpacing: -1,
                  color: "#00342B"
                }}
              >
                Project Access Requests
              </Typography>
              <Typography sx={{ mt: 0.9, fontSize: "1rem", color: "#5A6A84", lineHeight: 1.65 }}>
                Review locked-project access requests from team members and unlock projects for the right people.
              </Typography>
            </Box>

            {projectAccessRequestsError ? <Alert severity="warning">{projectAccessRequestsError}</Alert> : null}

            {projectAccessRequestsLoading ? (
              <Typography sx={{ fontSize: "0.96rem", color: "#5A6A84" }}>
                Loading project access requests...
              </Typography>
            ) : projectAccessRequests.length > 0 ? (
              <Stack spacing={1.4}>
                {projectAccessRequests.map((request) => (
                  <Paper
                    key={request.id}
                    elevation={0}
                    sx={{
                      p: 2.4,
                      borderRadius: 3,
                      backgroundColor: "#F8FCFF",
                      border: "1px solid rgba(213,236,248,0.92)"
                    }}
                  >
                    <Stack spacing={1.8}>
                      <Stack
                        direction={{ xs: "column", lg: "row" }}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", lg: "center" }}
                        gap={2}
                      >
                        <Box>
                          <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>
                            {request.userName}
                          </Typography>
                          <Typography sx={{ mt: 0.35, fontSize: "0.88rem", color: "#5A6A84" }}>
                            {request.userEmail} • requested {formatDate(request.createdAt)}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap">
                          <ButtonBase
                            onClick={() => {
                              setHandlingProjectAccessRequestId(request.id);
                              void approveProjectAccessRequest(request.id)
                                .then(async () => {
                                  await refreshProjectAccessRequests();
                                  showToast({
                                    message: `Granted ${request.userName} access to ${request.projectName}.`,
                                    severity: "success"
                                  });
                                })
                                .catch((requestError) => {
                                  setProjectAccessRequestsError(
                                    requestError instanceof Error
                                      ? requestError.message
                                      : "Unable to approve access request."
                                  );
                                })
                                .finally(() => {
                                  setHandlingProjectAccessRequestId(null);
                                });
                            }}
                            sx={{
                              px: 2,
                              py: 1.1,
                              borderRadius: 2.1,
                              backgroundColor: "#00342B",
                              color: "#FFFFFF",
                              opacity: handlingProjectAccessRequestId === request.id ? 0.7 : 1
                            }}
                          >
                            <Typography sx={{ fontSize: "0.9rem", fontWeight: 800 }}>
                              {handlingProjectAccessRequestId === request.id ? "Saving..." : "Approve"}
                            </Typography>
                          </ButtonBase>
                          <ButtonBase
                            onClick={() => {
                              setHandlingProjectAccessRequestId(request.id);
                              void rejectProjectAccessRequest(request.id)
                                .then(async () => {
                                  await refreshProjectAccessRequests();
                                  showToast({
                                    message: `Rejected access request for ${request.projectName}.`,
                                    severity: "info"
                                  });
                                })
                                .catch((requestError) => {
                                  setProjectAccessRequestsError(
                                    requestError instanceof Error
                                      ? requestError.message
                                      : "Unable to reject access request."
                                  );
                                })
                                .finally(() => {
                                  setHandlingProjectAccessRequestId(null);
                                });
                            }}
                            sx={{
                              px: 2,
                              py: 1.1,
                              borderRadius: 2.1,
                              backgroundColor: "#E6F6FF",
                              color: "#00342B",
                              opacity: handlingProjectAccessRequestId === request.id ? 0.7 : 1
                            }}
                          >
                            <Typography sx={{ fontSize: "0.9rem", fontWeight: 800 }}>Reject</Typography>
                          </ButtonBase>
                        </Stack>
                      </Stack>

                      <Box>
                        <Typography sx={{ fontSize: "0.78rem", fontWeight: 900, letterSpacing: 1.6, textTransform: "uppercase", color: "#93A6C3" }}>
                          Requested Project
                        </Typography>
                        <Typography sx={{ mt: 0.55, fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>
                          {request.projectName}
                        </Typography>
                        <Typography sx={{ mt: 0.3, fontSize: "0.88rem", color: "#5A6A84" }}>
                          {request.projectLocation} • {request.projectCode}
                        </Typography>
                      </Box>

                      {request.message ? (
                        <Box>
                          <Typography sx={{ fontSize: "0.78rem", fontWeight: 900, letterSpacing: 1.6, textTransform: "uppercase", color: "#93A6C3" }}>
                            Request Note
                          </Typography>
                          <Typography sx={{ mt: 0.55, fontSize: "0.92rem", lineHeight: 1.65, color: "#42536D" }}>
                            {request.message}
                          </Typography>
                        </Box>
                      ) : null}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Typography sx={{ fontSize: "0.96rem", color: "#5A6A84" }}>
                No pending project access requests right now.
              </Typography>
            )}
          </Stack>
        </Paper>
      ) : null}

      {user?.role === "admin" ? (
        <Paper
          elevation={0}
          sx={{
            p: 3.2,
            borderRadius: 4,
            backgroundColor: "#FFFFFF",
            boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            gap={2}
            sx={{ mb: 3 }}
          >
            <Box sx={{ maxWidth: 760 }}>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <AutoAwesomeRoundedIcon sx={{ color: "#046B5E" }} />
                <Typography
                  sx={{
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: "1.9rem",
                    fontWeight: 800,
                    letterSpacing: -1,
                    color: "#00342B"
                  }}
                >
                  Project Brief Quotas
                </Typography>
              </Stack>
              <Typography sx={{ mt: 0.9, fontSize: "1rem", color: "#5A6A84", lineHeight: 1.65 }}>
                Manage how many Claude-powered project briefs each user can generate per day. The default is 3 per day for every user, while the workspace is still capped at 150 total generations per month.
              </Typography>
            </Box>

            {quotaDashboard ? (
              <Stack spacing={0.6} sx={{ alignItems: { xs: "flex-start", md: "flex-end" } }}>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: 900,
                    letterSpacing: 1.8,
                    textTransform: "uppercase",
                    color: "#93A6C3"
                  }}
                >
                  Monthly Pool
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: "2rem",
                    fontWeight: 800,
                    letterSpacing: -1,
                    color: "#00342B"
                  }}
                >
                  {quotaDashboard.globalUsed} / {quotaDashboard.globalLimit}
                </Typography>
                <Typography sx={{ fontSize: "0.86rem", color: "#5A6A84" }}>
                  {quotaDashboard.globalRemaining} remaining • resets after {formatDate(quotaDashboard.monthEnd)}
                </Typography>
              </Stack>
            ) : null}
          </Stack>

          <Paper
            elevation={0}
            sx={{
              mb: 3,
              p: 2.2,
              borderRadius: 3,
              backgroundColor: "#F3FAFF",
              border: "1px solid rgba(213,236,248,0.92)"
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between"
            >
              <Box sx={{ maxWidth: 700 }}>
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 900, color: "#00342B" }}>
                  Apply a daily brief limit to everyone
                </Typography>
                <Typography sx={{ mt: 0.4, fontSize: "0.9rem", color: "#5A6A84" }}>
                  Quickly set the same daily Claude brief limit across the whole team.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.2} alignItems="center">
                <TextField
                  type="number"
                  value={teamQuotaDraft}
                  onChange={(event) => setTeamQuotaDraft(event.target.value)}
                  inputProps={{ min: 1, max: 150 }}
                  sx={{
                    width: 120,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.8,
                      backgroundColor: "#E6F6FF"
                    }
                  }}
                />
                <ButtonBase
                  onClick={async () => {
                    const nextLimit = Number(teamQuotaDraft);

                    if (!Number.isFinite(nextLimit) || nextLimit < 1 || nextLimit > 150) {
                      setQuotaError("Daily limits must be between 1 and 150.");
                      return;
                    }

                    setQuotaApplyAllLoading(true);
                    setQuotaError("");

                    try {
                      await applyBriefQuotaToAll(nextLimit);
                      await refreshQuotaDashboard();
                      setTeamQuotaDraft(String(nextLimit));
                      showToast({
                        message: `Applied a ${nextLimit}/day brief limit across the team.`,
                        severity: "success"
                      });
                    } catch (requestError) {
                      setQuotaError(requestError instanceof Error ? requestError.message : "Unable to apply daily quota.");
                    } finally {
                      setQuotaApplyAllLoading(false);
                    }
                  }}
                  sx={{
                    px: 2,
                    py: 1.15,
                    borderRadius: 2.2,
                    backgroundColor: "#00342B",
                    color: "#FFFFFF",
                    opacity: quotaApplyAllLoading ? 0.7 : 1
                  }}
                >
                  <Typography sx={{ fontSize: "0.92rem", fontWeight: 800 }}>
                    {quotaApplyAllLoading ? "Applying..." : "Apply to Everyone"}
                  </Typography>
                </ButtonBase>
              </Stack>
            </Stack>
          </Paper>

          {quotaError ? <Alert severity="warning" sx={{ mb: 3 }}>{quotaError}</Alert> : null}

          {quotaDashboard ? (
            <Stack spacing={1.4}>
              {quotaGrouping.groupedUsers.map((quotaGroup) => {
                const expanded = expandedQuotaProjectIds.includes(quotaGroup.projectId);

                return (
                  <Accordion
                    key={quotaGroup.projectId}
                    expanded={expanded}
                    onChange={() => toggleQuotaProject(quotaGroup.projectId)}
                    disableGutters
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      overflow: "hidden",
                      border: "1px solid rgba(213,236,248,0.92)",
                      backgroundColor: "#F8FCFF",
                      "&:before": {
                        display: "none"
                      }
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreRoundedIcon sx={{ color: "#00342B" }} />}
                      sx={{
                        px: 2.2,
                        py: 0.6,
                        "& .MuiAccordionSummary-content": {
                          my: 1.1
                        }
                      }}
                    >
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={1.2}
                        alignItems={{ xs: "flex-start", md: "center" }}
                        justifyContent="space-between"
                        sx={{ width: "100%" }}
                      >
                        <Box>
                          <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>
                            {quotaGroup.projectName}
                          </Typography>
                          <Typography sx={{ mt: 0.35, fontSize: "0.86rem", color: "#5A6A84" }}>
                            {quotaGroup.projectLocation} • {quotaGroup.projectCode}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                          <Chip
                            label={`${quotaGroup.users.length} account${quotaGroup.users.length === 1 ? "" : "s"}`}
                            sx={{
                              backgroundColor: "#D5ECF8",
                              color: "#00342B",
                              fontWeight: 800
                            }}
                          />
                          <Chip
                            label={expanded ? "Hide members" : "Show members"}
                            sx={{
                              backgroundColor: expanded ? "#00342B" : "#E6F6FF",
                              color: expanded ? "#FFFFFF" : "#00342B",
                              fontWeight: 800
                            }}
                          />
                        </Stack>
                      </Stack>
                    </AccordionSummary>

                    <AccordionDetails sx={{ px: 2.2, pb: 2.2, pt: 0.2 }}>
                      {quotaGroup.users.length > 0 ? (
                        <Stack spacing={1.2}>
                          {quotaGroup.users.map((quotaUser) => (
                            <Box
                              key={`${quotaGroup.projectId}-${quotaUser.id}`}
                              sx={{
                                display: "grid",
                                gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.4fr) 180px 160px 140px" },
                                gap: 2,
                                alignItems: "center",
                                p: 2,
                                borderRadius: 2.6,
                                backgroundColor: "#FFFFFF",
                                border: "1px solid rgba(213,236,248,0.9)"
                              }}
                            >
                              <Box>
                                <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>
                                  {quotaUser.firstName} {quotaUser.lastName}
                                </Typography>
                                <Typography sx={{ mt: 0.35, fontSize: "0.88rem", color: "#5A6A84" }}>
                                  {quotaUser.email} • {quotaUser.role.replace("_", " ")}
                                </Typography>
                              </Box>

                              <Box>
                                <Typography
                                  sx={{
                                    mb: 0.7,
                                    fontSize: "0.72rem",
                                    fontWeight: 900,
                                    letterSpacing: 1.6,
                                    textTransform: "uppercase",
                                    color: "#93A6C3"
                                  }}
                                >
                                  Daily Limit
                                </Typography>
                                <TextField
                                  type="number"
                                  value={quotaDrafts[quotaUser.id] ?? String(quotaUser.dailyProjectBriefLimit)}
                                  onChange={(event) =>
                                    setQuotaDrafts((current) => ({
                                      ...current,
                                      [quotaUser.id]: event.target.value
                                    }))
                                  }
                                  inputProps={{ min: 1, max: 150 }}
                                  sx={{
                                    width: "100%",
                                    "& .MuiOutlinedInput-root": {
                                      borderRadius: 2.8,
                                      backgroundColor: "#E6F6FF"
                                    }
                                  }}
                                />
                              </Box>

                              <Box>
                                <Typography
                                  sx={{
                                    mb: 0.7,
                                    fontSize: "0.72rem",
                                    fontWeight: 900,
                                    letterSpacing: 1.6,
                                    textTransform: "uppercase",
                                    color: "#93A6C3"
                                  }}
                                >
                                  Today
                                </Typography>
                                <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>
                                  {quotaUser.usedToday} used
                                </Typography>
                                <Typography sx={{ mt: 0.35, fontSize: "0.84rem", color: "#5A6A84" }}>
                                  {quotaUser.remainingToday} remaining
                                </Typography>
                              </Box>

                              <ButtonBase
                                onClick={() => {
                                  void handleSaveQuota(quotaUser.id);
                                }}
                                sx={{
                                  justifySelf: { xs: "stretch", lg: "end" },
                                  px: 2,
                                  py: 1.15,
                                  borderRadius: 2.2,
                                  backgroundColor: "#00342B",
                                  color: "#FFFFFF",
                                  opacity: quotaSavingUserId === quotaUser.id ? 0.7 : 1
                                }}
                              >
                                <Typography sx={{ fontSize: "0.92rem", fontWeight: 800 }}>
                                  {quotaSavingUserId === quotaUser.id ? "Saving..." : "Save Limit"}
                                </Typography>
                              </ButtonBase>
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <Typography sx={{ fontSize: "0.92rem", color: "#5A6A84" }}>
                          No account-linked users from the current workspace roster were matched to this project yet.
                        </Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              })}

              {quotaGrouping.unassignedUsers.length > 0 ? (
                <Accordion
                  expanded={expandedQuotaProjectIds.includes("unassigned")}
                  onChange={() => toggleQuotaProject("unassigned")}
                  disableGutters
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    overflow: "hidden",
                    border: "1px solid rgba(213,236,248,0.92)",
                    backgroundColor: "#F8FCFF",
                    "&:before": {
                      display: "none"
                    }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreRoundedIcon sx={{ color: "#00342B" }} />}
                    sx={{
                      px: 2.2,
                      py: 0.6,
                      "& .MuiAccordionSummary-content": {
                        my: 1.1
                      }
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1.2}
                      alignItems={{ xs: "flex-start", md: "center" }}
                      justifyContent="space-between"
                      sx={{ width: "100%" }}
                    >
                      <Box>
                        <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>
                          Unassigned Workspace Accounts
                        </Typography>
                        <Typography sx={{ mt: 0.35, fontSize: "0.86rem", color: "#5A6A84" }}>
                          Users with app access who are not currently matched to a project team roster entry.
                        </Typography>
                      </Box>

                      <Chip
                        label={`${quotaGrouping.unassignedUsers.length} account${quotaGrouping.unassignedUsers.length === 1 ? "" : "s"}`}
                        sx={{
                          backgroundColor: "#D5ECF8",
                          color: "#00342B",
                          fontWeight: 800
                        }}
                      />
                    </Stack>
                  </AccordionSummary>

                  <AccordionDetails sx={{ px: 2.2, pb: 2.2, pt: 0.2 }}>
                    <Stack spacing={1.2}>
                      {quotaGrouping.unassignedUsers.map((quotaUser) => (
                        <Box
                          key={`unassigned-${quotaUser.id}`}
                          sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.4fr) 180px 160px 140px" },
                            gap: 2,
                            alignItems: "center",
                            p: 2,
                            borderRadius: 2.6,
                            backgroundColor: "#FFFFFF",
                            border: "1px solid rgba(213,236,248,0.9)"
                          }}
                        >
                          <Box>
                            <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>
                              {quotaUser.firstName} {quotaUser.lastName}
                            </Typography>
                            <Typography sx={{ mt: 0.35, fontSize: "0.88rem", color: "#5A6A84" }}>
                              {quotaUser.email} • {quotaUser.role.replace("_", " ")}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography
                              sx={{
                                mb: 0.7,
                                fontSize: "0.72rem",
                                fontWeight: 900,
                                letterSpacing: 1.6,
                                textTransform: "uppercase",
                                color: "#93A6C3"
                              }}
                            >
                              Daily Limit
                            </Typography>
                            <TextField
                              type="number"
                              value={quotaDrafts[quotaUser.id] ?? String(quotaUser.dailyProjectBriefLimit)}
                              onChange={(event) =>
                                setQuotaDrafts((current) => ({
                                  ...current,
                                  [quotaUser.id]: event.target.value
                                }))
                              }
                              inputProps={{ min: 1, max: 150 }}
                              sx={{
                                width: "100%",
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: 2.8,
                                  backgroundColor: "#E6F6FF"
                                }
                              }}
                            />
                          </Box>

                          <Box>
                            <Typography
                              sx={{
                                mb: 0.7,
                                fontSize: "0.72rem",
                                fontWeight: 900,
                                letterSpacing: 1.6,
                                textTransform: "uppercase",
                                color: "#93A6C3"
                              }}
                            >
                              Today
                            </Typography>
                            <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>
                              {quotaUser.usedToday} used
                            </Typography>
                            <Typography sx={{ mt: 0.35, fontSize: "0.84rem", color: "#5A6A84" }}>
                              {quotaUser.remainingToday} remaining
                            </Typography>
                          </Box>

                          <ButtonBase
                            onClick={() => {
                              void handleSaveQuota(quotaUser.id);
                            }}
                            sx={{
                              justifySelf: { xs: "stretch", lg: "end" },
                              px: 2,
                              py: 1.15,
                              borderRadius: 2.2,
                              backgroundColor: "#00342B",
                              color: "#FFFFFF",
                              opacity: quotaSavingUserId === quotaUser.id ? 0.7 : 1
                            }}
                          >
                            <Typography sx={{ fontSize: "0.92rem", fontWeight: 800 }}>
                              {quotaSavingUserId === quotaUser.id ? "Saving..." : "Save Limit"}
                            </Typography>
                          </ButtonBase>
                        </Box>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ) : null}
            </Stack>
          ) : quotaError ? (
            <Typography sx={{ fontSize: "0.96rem", color: "#5A6A84" }}>
              Daily brief quota controls are unavailable right now.
            </Typography>
          ) : (
            <Typography sx={{ fontSize: "0.96rem", color: "#5A6A84" }}>
              Loading daily brief quota settings...
            </Typography>
          )}
        </Paper>
      ) : null}

      <Stack spacing={2.5}>
        {groupedEntries.map((group) => (
          <Paper
            key={group.projectId}
            elevation={0}
            sx={{
              p: 3.2,
              borderRadius: 4,
              backgroundColor: "#FFFFFF",
              boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              gap={2}
              sx={{ mb: 2.5 }}
            >
              <Box>
                <Typography
                  sx={{
                    fontFamily: '"Epilogue", "Space Grotesk", sans-serif',
                    fontSize: "1.8rem",
                    fontWeight: 800,
                    letterSpacing: -1,
                    color: "#00342B"
                  }}
                >
                  {group.projectName}
                </Typography>
                <Typography sx={{ mt: 0.6, fontSize: "0.95rem", color: "#5A6A84" }}>
                  {group.projectLocation} • {group.projectCode}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap">
                <ButtonBase
                  onClick={() => setModalProjectId(group.projectId)}
                  sx={{
                    px: 2,
                    py: 1.1,
                    borderRadius: 2.2,
                    backgroundColor: "#D5ECF8",
                    color: "#00342B"
                  }}
                >
                  <Typography sx={{ fontSize: "0.9rem", fontWeight: 800 }}>Add Member</Typography>
                </ButtonBase>
                <ButtonBase
                  onClick={() => navigate(`/app/projects/${group.projectId}`)}
                  sx={{
                    px: 2,
                    py: 1.1,
                    borderRadius: 2.2,
                    backgroundColor: "#E6F6FF",
                    color: "#00342B"
                  }}
                >
                  <Typography sx={{ fontSize: "0.9rem", fontWeight: 800 }}>Open Project</Typography>
                </ButtonBase>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
              {group.members.map((member) => (
                <Box
                  key={member.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 1.5,
                    py: 1.2,
                    pr: 2.2,
                    borderRadius: 999,
                    backgroundColor: "#E6F6FF"
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      backgroundColor: "#00342B",
                      color: "#FFFFFF",
                      fontWeight: 800
                    }}
                  >
                    {initials(member.name)}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: "0.98rem", fontWeight: 800, color: "#00342B" }}>{member.name}</Typography>
                    <Typography
                      sx={{
                        mt: 0.2,
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        letterSpacing: 1.4,
                        textTransform: "uppercase",
                        color: "#93A6C3"
                      }}
                    >
                      {member.role}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Paper>
        ))}
      </Stack>

      {modalProjectId ? (
        <AddTeamMemberModal
          open={Boolean(modalProjectId)}
          projectId={modalProjectId}
          onClose={() => setModalProjectId(null)}
          onCreated={async () => {
            await refresh();
          }}
        />
      ) : null}

      <WorkspaceFooter />
    </Stack>
  );
}
