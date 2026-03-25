import Box from "@mui/material/Box";
import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import { Sidebar, sidebarWidth } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

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
          <Box key={`${location.pathname}${location.search}`} sx={{ maxWidth: 1360, mx: "auto" }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
