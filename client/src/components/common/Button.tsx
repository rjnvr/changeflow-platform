import type { ElementType } from "react";
import MuiButton from "@mui/material/Button";
import type { ButtonProps as MuiButtonProps } from "@mui/material/Button";

type AppButtonProps = MuiButtonProps & {
  component?: ElementType;
  to?: string;
  href?: string;
};

export function Button(props: AppButtonProps) {
  return <MuiButton variant="contained" disableElevation {...props} />;
}
