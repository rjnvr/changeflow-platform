export function getUserInitials(firstName?: string, lastName?: string) {
  if (!firstName && !lastName) {
    return "CF";
  }

  return `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase() || "CF";
}
