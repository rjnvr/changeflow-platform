import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuthContext } from "../context/AuthContext";

export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

