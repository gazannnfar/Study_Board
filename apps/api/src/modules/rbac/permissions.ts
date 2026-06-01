import { Role, type Task } from "@prisma/client";
import type { AuthUser } from "../../types/auth.js";

export const managementRoles = [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_LEAD, Role.STAROSTA] as const;
export const progressViewerRoles = [...managementRoles, Role.TEACHER] as const;

export function canSeeAllGroups(role: Role) {
  return role === Role.ADMIN || role === Role.PROJECT_MANAGER;
}

export function canManageUsers(role: Role) {
  return role === Role.ADMIN;
}

export function canAssignTasks(role: Role) {
  return managementRoles.includes(role as (typeof managementRoles)[number]);
}

export function canReviewProgress(role: Role) {
  return progressViewerRoles.includes(role as (typeof progressViewerRoles)[number]);
}

export function canCreateGroup(role: Role) {
  return role === Role.ADMIN || role === Role.PROJECT_MANAGER || role === Role.TEACHER;
}

export function canEditTask(user: AuthUser, task: Pick<Task, "creatorId" | "assigneeId" | "groupId">) {
  if (canAssignTasks(user.role)) return true;
  if (user.role === Role.STUDENT) return task.creatorId === user.id || task.assigneeId === user.id;
  if (user.role === Role.TEACHER) return false;
  return task.groupId === user.groupId;
}

export function canDeleteTask(user: AuthUser, task: Pick<Task, "creatorId" | "status">) {
  if (canAssignTasks(user.role)) return true;
  return user.role === Role.STUDENT && task.creatorId === user.id && task.status === "BACKLOG";
}
