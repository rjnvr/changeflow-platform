import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { WorkspaceFooter } from "../components/layout/WorkspaceFooter";
import { useProjectTeamDirectory } from "../hooks/useProjectTeamDirectory";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function DirectoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { entries, error } = useProjectTeamDirectory();
  const [roleFilter, setRoleFilter] = useState("all");
  const search = searchParams.get("search") ?? "";

  const roleOptions = useMemo(
    () => ["all", ...new Set(entries.map((entry) => entry.role))].slice(0, 8),
    [entries]
  );

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const normalizedSearch = search.trim().toLowerCase();
        const matchesSearch =
          normalizedSearch.length === 0 ||
          entry.name.toLowerCase().includes(normalizedSearch) ||
          entry.role.toLowerCase().includes(normalizedSearch) ||
          entry.projectName.toLowerCase().includes(normalizedSearch) ||
          entry.projectLocation.toLowerCase().includes(normalizedSearch);
        const matchesRole = roleFilter === "all" || entry.role === roleFilter;

        return matchesSearch && matchesRole;
      }),
    [entries, roleFilter, search]
  );

  return (
    <Stack spacing={4}>
      {error ? <Alert severity="warning">{error}</Alert> : null}

      <Box>
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
          People & Roles
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
          Team Directory
        </Typography>
        <Typography sx={{ mt: 2, maxWidth: 760, fontSize: "1.08rem", lineHeight: 1.65, color: "#5A6A84" }}>
          Find project contacts, field roles, and delivery coverage across the ChangeFlow workspace.
        </Typography>
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
        <Stack spacing={2}>
          <TextField
            placeholder="Search by name, role, project, or location..."
            value={search}
            onChange={(event) => {
              const next = new URLSearchParams(searchParams);
              const nextValue = event.target.value;

              if (nextValue.trim()) {
                next.set("search", nextValue);
              } else {
                next.delete("search");
              }

              setSearchParams(next, { replace: true });
            }}
            InputProps={{
              startAdornment: <SearchRoundedIcon sx={{ mr: 1, color: "#7A869F" }} />
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                backgroundColor: "#E6F6FF"
              }
            }}
          />

          <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap">
            {roleOptions.map((role) => {
              const active = roleFilter === role;

              return (
                <ButtonBase
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  sx={{
                    px: 2,
                    py: 1.1,
                    borderRadius: 999,
                    backgroundColor: active ? "#00342B" : "#D5ECF8",
                    color: active ? "#FFFFFF" : "#00342B"
                  }}
                >
                  <Typography sx={{ fontSize: "0.88rem", fontWeight: 800 }}>{role === "all" ? "All Roles" : role}</Typography>
                </ButtonBase>
              );
            })}
          </Stack>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" },
          gap: 2.5
        }}
      >
        {filteredEntries.map((entry) => (
          <Paper
            key={entry.id}
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              backgroundColor: "#FFFFFF",
              boxShadow: "0 12px 32px rgba(7,30,39,0.04)"
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: "#00342B",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: "1rem"
                }}
              >
                {initials(entry.name)}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#00342B" }}>{entry.name}</Typography>
                <Typography
                  sx={{
                    mt: 0.4,
                    fontSize: "0.74rem",
                    fontWeight: 800,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    color: "#93A6C3"
                  }}
                >
                  {entry.role}
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={1.1} sx={{ mt: 2.4 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <BadgeRoundedIcon sx={{ fontSize: 18, color: "#5A6A84" }} />
                <Typography sx={{ fontSize: "0.94rem", color: "#42536D" }}>{entry.projectName}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PlaceRoundedIcon sx={{ fontSize: 18, color: "#5A6A84" }} />
                <Typography sx={{ fontSize: "0.94rem", color: "#42536D" }}>{entry.projectLocation}</Typography>
              </Stack>
            </Stack>

            <ButtonBase
              onClick={() => navigate(`/app/projects/${entry.projectId}`)}
              sx={{
                mt: 2.6,
                px: 2,
                py: 1.1,
                borderRadius: 2.2,
                backgroundColor: "#D5ECF8",
                color: "#00342B"
              }}
            >
              <Typography sx={{ fontSize: "0.88rem", fontWeight: 800 }}>Open Project</Typography>
            </ButtonBase>
          </Paper>
        ))}
      </Box>

      <WorkspaceFooter />
    </Stack>
  );
}
