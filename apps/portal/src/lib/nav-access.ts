import type { UserRole } from "@martylab/shared";
import type { NavItem } from "@/lib/nav-items";

const roleLevel: Record<UserRole, number> = {
  guest: 1,
  user: 2,
  admin: 3,
};

export function canAccessNavItem(
  role: UserRole | undefined,
  item: NavItem,
): boolean {
  if (!item.minRole) {
    return true;
  }

  if (!role) {
    return false;
  }

  return roleLevel[role] >= roleLevel[item.minRole];
}
