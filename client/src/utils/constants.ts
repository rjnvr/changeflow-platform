export const API_BASE_URL = "http://localhost:4000/api";
export const AUTH_TOKEN_KEY = "changeflow.auth.token";
export const AUTH_USER_KEY = "changeflow.auth.user";
export const WORKSPACE_PREFERENCES_KEY = "changeflow.workspace.preferences";
export const PROJECT_ANALYTICS_BRIEF_KEY = "changeflow.project.analytics-brief";
export const DASHBOARD_DEMO_GUIDE_KEY = "changeflow.dashboard.demo-guide.dismissed";

export const DEMO_ACCOUNTS = [
  {
    label: "Admin Demo",
    email: "demo@changeflow.dev",
    password: "password123",
    role: "Admin workspace owner"
  },
  {
    label: "Team Member Demo",
    email: "elena.park@changeflow.dev",
    password: "password123",
    role: "Project manager on Harbor 26 Tower"
  }
] as const;

export const DEMO_CREDENTIALS = {
  email: DEMO_ACCOUNTS[0].email,
  password: DEMO_ACCOUNTS[0].password
};

export const PROTECTED_DEMO_EMAILS = DEMO_ACCOUNTS.map((account) => account.email.toLowerCase());
