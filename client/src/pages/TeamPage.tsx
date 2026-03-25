import AddRoundedIcon from "@mui/icons-material/AddRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AddTeamMemberModal } from "../components/projects/AddTeamMemberModal";
import { WorkspaceFooter } from "../components/layout/WorkspaceFooter";
import { useProjectTeamDirectory } from "../hooks/useProjectTeamDirectory";
import { useProjects } from "../hooks/useProjects";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function TeamPage() {
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { entries, error, refresh } = useProjectTeamDirectory();
  const [search, setSearch] = useState("");
  const [activeProjectId, setActiveProjectId] = useState<string>("all");
  const [modalProjectId, setModalProjectId] = useState<string | null>(null);

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
