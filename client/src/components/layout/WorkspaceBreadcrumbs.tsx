import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";

interface WorkspaceBreadcrumbItem {
  label: string;
  to?: string;
}

export function WorkspaceBreadcrumbs({ items }: { items: WorkspaceBreadcrumbItem[] }) {
  const navigate = useNavigate();

  return (
    <Stack
      direction="row"
      spacing={0.6}
      alignItems="center"
      useFlexGap
      flexWrap="wrap"
      sx={{ mb: 2.2, color: "#7A869F" }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <Stack key={`${item.label}-${index}`} direction="row" spacing={0.6} alignItems="center">
            {item.to && !isLast ? (
              <ButtonBase
                onClick={() => navigate(item.to!)}
                sx={{
                  borderRadius: 2,
                  color: "#5A6A84",
                  "&:hover": {
                    color: "#00342B"
                  }
                }}
              >
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700 }}>{item.label}</Typography>
              </ButtonBase>
            ) : (
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: isLast ? 800 : 700,
                  color: isLast ? "#00342B" : "#5A6A84"
                }}
              >
                {item.label}
              </Typography>
            )}

            {!isLast ? <ChevronRightRoundedIcon sx={{ fontSize: 16, color: "#9AACBF" }} /> : null}
          </Stack>
        );
      })}
      <Box sx={{ width: "100%" }} />
    </Stack>
  );
}
