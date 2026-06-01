import { describe, expect, it } from "vitest";
import { Role, TaskStatus } from "@prisma/client";
import { canAssignTasks, canDeleteTask, canManageUsers, canReviewProgress } from "./permissions.js";

describe("RBAC permissions", () => {
  it("allows only admin to manage users", () => {
    expect(canManageUsers(Role.ADMIN)).toBe(true);
    expect(canManageUsers(Role.TEACHER)).toBe(false);
    expect(canManageUsers(Role.STUDENT)).toBe(false);
  });

  it("allows educational coordinators to assign tasks", () => {
    expect(canAssignTasks(Role.STAROSTA)).toBe(true);
    expect(canAssignTasks(Role.TEAM_LEAD)).toBe(true);
    expect(canAssignTasks(Role.PROJECT_MANAGER)).toBe(true);
    expect(canAssignTasks(Role.STUDENT)).toBe(false);
  });

  it("allows teacher and managers to review progress", () => {
    expect(canReviewProgress(Role.TEACHER)).toBe(true);
    expect(canReviewProgress(Role.PROJECT_MANAGER)).toBe(true);
    expect(canReviewProgress(Role.STUDENT)).toBe(false);
  });

  it("allows student to delete only own backlog task", () => {
    const user = {
      id: "student-1",
      email: "student@example.com",
      name: "Student",
      role: Role.STUDENT,
      groupId: "group-1"
    };

    expect(canDeleteTask(user, { creatorId: "student-1", status: TaskStatus.BACKLOG })).toBe(true);
    expect(canDeleteTask(user, { creatorId: "student-1", status: TaskStatus.IN_PROGRESS })).toBe(false);
    expect(canDeleteTask(user, { creatorId: "student-2", status: TaskStatus.BACKLOG })).toBe(false);
  });
});
