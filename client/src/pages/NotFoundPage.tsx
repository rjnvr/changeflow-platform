import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";

import { Button } from "../components/common/Button";
import { useAuthContext } from "../context/AuthContext";

export function NotFoundPage() {
  const { isAuthenticated } = useAuthContext();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        background:
          "radial-gradient(circle at top left, rgba(15,118,110,0.18), transparent 28%), linear-gradient(180deg, #EEF4F0 0%, #F8FAFC 100%)"
      }}
    >
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 6, width: "min(100%, 580px)" }}>
        <Stack spacing={2} alignItems="flex-start">
          <Typography variant="overline" sx={{ color: "secondary.main", letterSpacing: 1.4 }}>
            404
          </Typography>
          <Typography variant="h3">Page not found</Typography>
          <Typography color="text.secondary">
            The route you opened is outside the current ChangeFlow experience. You can head back to the
            public site or jump into the demo workspace.
          </Typography>
          <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
            <Button component={RouterLink} to="/">
              Public site
            </Button>
            <Button variant="outlined" component={RouterLink} to={isAuthenticated ? "/app" : "/login"}>
              {isAuthenticated ? "Workspace" : "Sign in"}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}

