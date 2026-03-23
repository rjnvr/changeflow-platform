import type { AuthenticatedUser } from "../types/domain.js";

interface UserRecord extends AuthenticatedUser {
  password: string;
}

const users: UserRecord[] = [
  {
    id: "usr_demo_1",
    email: "demo@changeflow.dev",
    password: "password123",
    role: "admin"
  }
];

export const userRepository = {
  findByEmail(email: string) {
    return users.find((user) => user.email === email) ?? null;
  },
  findById(id: string) {
    return users.find((user) => user.id === id) ?? null;
  }
};
