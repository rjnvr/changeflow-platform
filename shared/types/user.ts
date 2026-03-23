export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "project_manager" | "accounting";
}

