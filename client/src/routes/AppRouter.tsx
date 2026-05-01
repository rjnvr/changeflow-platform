import {
  Navigate,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements
} from "react-router-dom";

import { AppLayout } from "../components/layout/AppLayout";
import { ApiDocsPage } from "../pages/ApiDocsPage";
import { BudgetPage } from "../pages/BudgetPage";
import { ChangeOrderDetailsPage } from "../pages/ChangeOrderDetailsPage";
import { ChangeOrdersPage } from "../pages/ChangeOrdersPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DirectoryPage } from "../pages/DirectoryPage";
import { HomePage } from "../pages/HomePage";
import { IntegrationsPage } from "../pages/IntegrationsPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProjectDetailsPage } from "../pages/ProjectDetailsPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { ResourcesPage } from "../pages/ResourcesPage";
import { RiskFlagDetailsPage } from "../pages/RiskFlagDetailsPage";
import { SchedulePage } from "../pages/SchedulePage";
import { TeamPage } from "../pages/TeamPage";
import { TaskDetailsPage } from "../pages/TaskDetailsPage";
import { TasksPage } from "../pages/TasksPage";
import { ProtectedRoute } from "./ProtectedRoute";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<HomePage />} />
      <Route path="/api-docs" element={<ApiDocsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId" element={<ProjectDetailsPage />} />
          <Route path="change-orders" element={<ChangeOrdersPage />} />
          <Route path="change-orders/:changeOrderId" element={<ChangeOrderDetailsPage />} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/:taskId" element={<TaskDetailsPage />} />
          <Route path="risk-flags/:riskFlagId" element={<RiskFlagDetailsPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="directory" element={<DirectoryPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="api-docs" element={<ApiDocsPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </>
  )
);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
