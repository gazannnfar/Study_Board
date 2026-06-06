import { Prisma, Role } from "@prisma/client";
import type { AuthUser } from "../../types/auth.js";
import { canSeeAllGroups } from "./permissions.js";

export function visibleGroupWhere(user: AuthUser, groupId?: string): Prisma.GroupWhereInput {
  if (canSeeAllGroups(user.role)) {
    return groupId ? { id: groupId } : {};
  }

  if (user.role === Role.TEACHER) {
    return groupId ? { id: groupId, teacherId: user.id } : { teacherId: user.id };
  }

  return { id: groupId ?? user.groupId ?? "__none" };
}

export function scopedGroupFilter(user: AuthUser, groupId?: string): Prisma.TaskWhereInput {
  if (canSeeAllGroups(user.role)) {
    return groupId ? { groupId } : {};
  }

  if (user.role === Role.TEACHER) {
    return groupId ? { groupId, group: { teacherId: user.id } } : { group: { teacherId: user.id } };
  }

  return { groupId: groupId ?? user.groupId ?? "__none" };
}
