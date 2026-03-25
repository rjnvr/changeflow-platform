import ButtonBase from "@mui/material/ButtonBase";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useLocation, useNavigate } from "react-router-dom";

export function WorkspaceFooter() {
  const location = useLocation();
  const navigate = useNavigate();
  const apiDocsPath = location.pathname === "/api-docs" ? "/api-docs" : "/app/api-docs";

  return (
    <Box
      sx={{
        mt: 2,
        pt: 4.5,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 3,
        flexWrap: "wrap",
        borderTop: "1px solid rgba(213,236,248,0.9)",
        color: "rgba(90,106,132,0.86)"
      }}
    >
      <Typography sx={{ fontSize: "0.78rem", letterSpacing: 2.2, textTransform: "uppercase" }}>
        © 2024 ChangeFlow Intelligence. Built for the modern jobsite.
      </Typography>
      <Stack direction="row" spacing={3.5} useFlexGap flexWrap="wrap">
        {["Terms", "Privacy", "Trust & Security"].map((item) => (
          <Typography key={item} sx={{ fontSize: "0.78rem", letterSpacing: 2.2, textTransform: "uppercase" }}>
            {item}
          </Typography>
        ))}
        <ButtonBase onClick={() => navigate(apiDocsPath)} sx={{ color: "inherit" }}>
          <Typography sx={{ fontSize: "0.78rem", letterSpacing: 2.2, textTransform: "uppercase", fontWeight: 700 }}>
            API Docs
          </Typography>
        </ButtonBase>
      </Stack>
    </Box>
  );
}
