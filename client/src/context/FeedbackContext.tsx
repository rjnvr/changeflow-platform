import type { AlertColor } from "@mui/material/Alert";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

interface ToastInput {
  message: string;
  severity?: AlertColor;
}

interface FeedbackContextValue {
  showToast: (input: ToastInput) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Required<ToastInput> & { open: boolean }>({
    open: false,
    message: "",
    severity: "info"
  });

  const value = useMemo<FeedbackContextValue>(
    () => ({
      showToast(input) {
        setToast({
          open: true,
          message: input.message,
          severity: input.severity ?? "info"
        });
      }
    }),
    []
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={4200}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        onClose={(_event, reason) => {
          if (reason === "clickaway") {
            return;
          }

          setToast((currentToast) => ({ ...currentToast, open: false }));
        }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast((currentToast) => ({ ...currentToast, open: false }))}
          sx={{
            alignItems: "center",
            minWidth: 280,
            boxShadow: "0 18px 34px rgba(7,30,39,0.18)"
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </FeedbackContext.Provider>
  );
}

export function useFeedbackContext() {
  const value = useContext(FeedbackContext);

  if (!value) {
    throw new Error("useFeedbackContext must be used inside FeedbackProvider.");
  }

  return value;
}
