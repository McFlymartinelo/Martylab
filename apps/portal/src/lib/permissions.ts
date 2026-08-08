import type { UserRole } from "@martylab/shared";

const roleLevel: Record<UserRole, number> = {
  guest: 1,
  user: 2,
  admin: 3,
};

export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return roleLevel[userRole] >= roleLevel[minRole];
}
