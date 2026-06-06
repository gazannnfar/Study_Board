import { Prisma, Role, TaskStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.js";
import type { AuthUser } from "../../types/auth.js";
import { canAssignTasks, canDeleteTask, canEditTask, canSeeAllGroups } from "../rbac/permissions.js";
import type { CreateCommentInput, CreateTaskInput, TaskQuery, UpdateTaskInput } from "./tasks.schemas.js";

const userSummary = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarColor: true
} satisfies Prisma.UserSelect;

export function calculatePertExpected(
  optimistic?: number | null,
  mostLikely?: number | null,
  pessimistic?: number | null
) {
  if (optimistic === undefined || optimistic === null) return null;
  if (mostLikely === undefined || mostLikely === null) return null;
  if (pessimistic === undefined || pessimistic === null) return null;
  return Number(((optimistic + 4 * mostLikely + pessimistic) / 6).toFixed(2));
}

export const taskInclude = {
  assignee: { select: userSummary },
  creator: { select: userSummary },
  group: { select: { id: true, name: true, code: true } },
  project: { select: { id: true, name: true } },
  scheduleLesson: { select: { id: true, subject: true, startsAt: true, endsAt: true, room: true, lessonType: true } },
  comments: {
    include: { author: { select: userSummary } },
    orderBy: { createdAt: "desc" as const },
    take: 5
  }
} satisfies Prisma.TaskInclude;

export function visibleTaskWhere(user: AuthUser): Prisma.TaskWhereInput {
  if (canSeeAllGroups(user.role)) return {};

  if (user.role === Role.TEACHER) {
    return { group: { teacherId: user.id } };
  }

  if (user.role === Role.TEAM_LEAD) {
    return {
      OR: [{ project: { teamLeadId: user.id } }, { groupId: user.groupId ?? "__none" }]
    };
  }

  if (user.groupId) {
    return { groupId: user.groupId };
  }

  return { OR: [{ creatorId: user.id }, { assigneeId: user.id }] };
}

function deadlineFilter(filter: TaskQuery["deadline"]): Prisma.TaskWhereInput {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);

  if (filter === "overdue") {
    return { deadline: { lt: now }, status: { not: TaskStatus.DONE } };
  }

  if (filter === "today") {
    return { deadline: { gte: startOfToday, lte: endOfToday } };
  }

  if (filter === "week") {
    return { deadline: { gte: now, lte: nextWeek } };
  }

  if (filter === "none") {
    return { deadline: null };
  }

  return {};
}

function filteredWhere(user: AuthUser, query: TaskQuery): Prisma.TaskWhereInput {
  return {
    AND: [
      visibleTaskWhere(user),
      query.assigneeId ? { assigneeId: query.assigneeId } : {},
      query.mine ? { assigneeId: user.id } : {},
      query.status ? { status: query.status } : {},
      query.priority ? { priority: query.priority } : {},
      query.groupId ? { groupId: query.groupId } : {},
      query.projectId ? { projectId: query.projectId } : {},
      deadlineFilter(query.deadline)
    ]
  };
}

export async function listTasks(user: AuthUser, query: TaskQuery) {
  return prisma.task.findMany({
    where: filteredWhere(user, query),
    include: taskInclude,
    orderBy: [{ status: "asc" }, { deadline: "asc" }, { priority: "desc" }, { createdAt: "desc" }]
  });
}

export async function getTask(user: AuthUser, id: string) {
  const task = await prisma.task.findFirst({
    where: { AND: [{ id }, visibleTaskWhere(user)] },
    include: taskInclude
  });

  if (!task) {
    throw new AppError(404, "Task not found", "TASK_NOT_FOUND");
  }

  return task;
}

async function assertGroupIsVisible(user: AuthUser, groupId: string) {
  const group = await prisma.group.findFirst({
    where: {
      AND: [
        { id: groupId },
        canSeeAllGroups(user.role)
          ? {}
          : user.role === Role.TEACHER
            ? { teacherId: user.id }
            : { id: user.groupId ?? "__none" }
      ]
    },
    select: { id: true }
  });

  if (!group) {
    throw new AppError(403, "Cannot create or move tasks outside visible groups", "FORBIDDEN_GROUP");
  }
}

async function assertScheduleLessonForGroup(scheduleLessonId: string | null | undefined, groupId: string) {
  if (!scheduleLessonId) return;
  const lesson = await prisma.scheduleLesson.findFirst({
    where: { id: scheduleLessonId, groupId },
    select: { id: true }
  });

  if (!lesson) {
    throw new AppError(400, "Schedule lesson does not belong to task group", "SCHEDULE_GROUP_MISMATCH");
  }
}

export async function createTask(user: AuthUser, input: CreateTaskInput) {
  const groupId = input.groupId ?? user.groupId;
  if (!groupId) {
    throw new AppError(400, "Task group is required", "GROUP_REQUIRED");
  }

  if (!canAssignTasks(user.role) && input.assigneeId && input.assigneeId !== user.id) {
    throw new AppError(403, "Students can assign only themselves", "ASSIGNEE_FORBIDDEN");
  }

  await assertGroupIsVisible(user, groupId);
  await assertScheduleLessonForGroup(input.scheduleLessonId, groupId);
  const pertExpectedHours = calculatePertExpected(
    input.pertOptimisticHours,
    input.pertMostLikelyHours,
    input.pertPessimisticHours
  );

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      status: input.status ?? TaskStatus.BACKLOG,
      priority: input.priority,
      deadline: input.deadline ? new Date(input.deadline) : null,
      tags: input.tags,
      estimatedHours: input.estimatedHours ?? null,
      pertOptimisticHours: input.pertOptimisticHours ?? null,
      pertMostLikelyHours: input.pertMostLikelyHours ?? null,
      pertPessimisticHours: input.pertPessimisticHours ?? null,
      pertExpectedHours,
      scheduledStart: input.scheduledStart ? new Date(input.scheduledStart) : null,
      scheduledEnd: input.scheduledEnd ? new Date(input.scheduledEnd) : null,
      scheduleLessonId: input.scheduleLessonId ?? null,
      groupId,
      projectId: input.projectId ?? null,
      assigneeId: input.assigneeId ?? (user.role === Role.STUDENT ? user.id : null),
      creatorId: user.id
    },
    include: taskInclude
  });

  if (task.assigneeId && task.assigneeId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: task.assigneeId,
        taskId: task.id,
        type: "TASK_ASSIGNED",
        title: "Новая задача",
        body: `Вам назначена задача: ${task.title}`
      }
    });
  }

  return task;
}

export async function updateTask(user: AuthUser, id: string, input: UpdateTaskInput) {
  const existing = await prisma.task.findFirst({
    where: { AND: [{ id }, visibleTaskWhere(user)] }
  });

  if (!existing) {
    throw new AppError(404, "Task not found", "TASK_NOT_FOUND");
  }

  const manager = canAssignTasks(user.role);
  const requestedKeys = Object.keys(input);
  const teacherGradeOnly = user.role === Role.TEACHER && requestedKeys.every((key) => key === "grade");

  if (!teacherGradeOnly && !canEditTask(user, existing)) {
    throw new AppError(403, "Not enough permissions to update this task", "FORBIDDEN_TASK");
  }

  if (!manager && !teacherGradeOnly) {
    const forbiddenFields = ["assigneeId", "groupId", "projectId", "grade"] as const;
    const hasForbiddenFields = forbiddenFields.some((field) => field in input);
    if (hasForbiddenFields) {
      throw new AppError(403, "Only managers can reassign tasks or edit grading fields", "FORBIDDEN_FIELDS");
    }
  }

  if (input.groupId) {
    await assertGroupIsVisible(user, input.groupId);
  }

  await assertScheduleLessonForGroup(input.scheduleLessonId, input.groupId ?? existing.groupId);

  const pertExpectedHours = calculatePertExpected(
    input.pertOptimisticHours ?? existing.pertOptimisticHours,
    input.pertMostLikelyHours ?? existing.pertMostLikelyHours,
    input.pertPessimisticHours ?? existing.pertPessimisticHours
  );

  const nextStatus = input.status ?? existing.status;
  const completedAt =
    nextStatus === TaskStatus.DONE && existing.status !== TaskStatus.DONE
      ? new Date()
      : nextStatus !== TaskStatus.DONE
        ? null
        : existing.completedAt;

  const task = await prisma.task.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      deadline: input.deadline === undefined ? undefined : input.deadline ? new Date(input.deadline) : null,
      tags: input.tags,
      estimatedHours: input.estimatedHours === undefined ? undefined : input.estimatedHours,
      pertOptimisticHours: input.pertOptimisticHours === undefined ? undefined : input.pertOptimisticHours,
      pertMostLikelyHours: input.pertMostLikelyHours === undefined ? undefined : input.pertMostLikelyHours,
      pertPessimisticHours: input.pertPessimisticHours === undefined ? undefined : input.pertPessimisticHours,
      pertExpectedHours,
      scheduledStart:
        input.scheduledStart === undefined ? undefined : input.scheduledStart ? new Date(input.scheduledStart) : null,
      scheduledEnd: input.scheduledEnd === undefined ? undefined : input.scheduledEnd ? new Date(input.scheduledEnd) : null,
      scheduleLessonId: input.scheduleLessonId === undefined ? undefined : input.scheduleLessonId,
      groupId: input.groupId,
      projectId: input.projectId === undefined ? undefined : input.projectId,
      assigneeId: input.assigneeId === undefined ? undefined : input.assigneeId,
      grade: input.grade === undefined ? undefined : input.grade,
      completedAt
    },
    include: taskInclude
  });

  if (input.assigneeId && input.assigneeId !== existing.assigneeId) {
    await prisma.notification.create({
      data: {
        userId: input.assigneeId,
        taskId: task.id,
        type: "TASK_REASSIGNED",
        title: "Задача назначена на вас",
        body: `Проверьте задачу: ${task.title}`
      }
    });
  }

  return task;
}

export async function deleteTask(user: AuthUser, id: string) {
  const existing = await prisma.task.findFirst({
    where: { AND: [{ id }, visibleTaskWhere(user)] }
  });

  if (!existing) {
    throw new AppError(404, "Task not found", "TASK_NOT_FOUND");
  }

  if (!canDeleteTask(user, existing)) {
    throw new AppError(403, "Not enough permissions to delete this task", "FORBIDDEN_TASK_DELETE");
  }

  await prisma.task.delete({ where: { id } });
}

export async function addComment(user: AuthUser, taskId: string, input: CreateCommentInput) {
  const task = await getTask(user, taskId);
  const grade = user.role === Role.TEACHER ? input.grade : undefined;

  const comment = await prisma.comment.create({
    data: {
      taskId,
      authorId: user.id,
      body: input.body,
      grade
    },
    include: { author: { select: userSummary } }
  });

  if (grade !== undefined && grade !== null) {
    await prisma.task.update({ where: { id: task.id }, data: { grade } });
  }

  if (task.assigneeId && task.assigneeId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: task.assigneeId,
        taskId: task.id,
        type: "TASK_COMMENT",
        title: "Новый комментарий",
        body: `${user.name}: ${input.body.slice(0, 120)}`
      }
    });
  }

  return comment;
}
