import Box from "@mui/material/Box";
import { Outlet } from "react-router-dom";
import { useState } from "react";

import { Sidebar, sidebarWidth } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#F3FAFF" }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          ml: { md: `${sidebarWidth}px` },
          backgroundColor: "#F3FAFF"
        }}
      >
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <Box sx={{ px: { xs: 2, md: 4 }, pt: 3, pb: 5 }}>
          <Box sx={{ maxWidth: 1360, mx: "auto" }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

