import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface MetricCardProps {
  label: string;
  value: string | number;
  helper?: string;
  icon?: ReactNode;
  accent?: string;
}

export function MetricCard({
  label,
  value,
  helper,
  icon,
  accent = "#0F766E"
}: MetricCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 5,
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(16px)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${accent}18 0%, transparent 52%)`,
          pointerEvents: "none"
        }}
      />

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h4" sx={{ mt: 1 }}>
            {value}
          </Typography>
          {helper ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 240 }}>
              {helper}
            </Typography>
          ) : null}
        </Box>

        {icon ? (
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 44,
              height: 44,
              borderRadius: 3.5,
              color: accent,
              backgroundColor: `${accent}16`
            }}
          >
            {icon}
          </Box>
        ) : null}
      </Stack>
    </Paper>
  );
}

