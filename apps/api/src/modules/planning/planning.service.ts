import { Priority, TaskStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.js";
import type { AuthUser } from "../../types/auth.js";
import { canAssignTasks, canEditTask } from "../rbac/permissions.js";
import { scopedGroupFilter, visibleGroupWhere } from "../rbac/group-scope.js";
import { visibleTaskWhere } from "../tasks/tasks.service.js";
import type { AssignSlotInput, FreeSlotsQuery, TaskRecommendationsQuery } from "./planning.schemas.js";

export type FreeSlot = {
  groupId: string;
  groupCode: string;
  start: string;
  end: string;
  durationMinutes: number;
  label: string;
};

type BusyInterval = {
  start: Date;
  end: Date;
};

const priorityWeight: Record<Priority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
};

function defaultDateRange() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 14);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

function dateRange(query: Pick<FreeSlotsQuery, "dateFrom" | "dateTo">) {
  const fallback = defaultDateRange();
  return {
    from: query.dateFrom ? new Date(query.dateFrom) : fallback.from,
    to: query.dateTo ? new Date(query.dateTo) : fallback.to
  };
}

function eachDay(from: Date, to: Date) {
  const days: Date[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  while (cursor.getTime() <= to.getTime()) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function clampBusyToDay(interval: BusyInterval, dayStart: Date, dayEnd: Date) {
  const start = new Date(Math.max(interval.start.getTime(), dayStart.getTime()));
  const end = new Date(Math.min(interval.end.getTime(), dayEnd.getTime()));
  return end.getTime() > start.getTime() ? { start, end } : null;
}

function mergeIntervals(intervals: BusyInterval[]) {
  const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: BusyInterval[] = [];

  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (!last || interval.start.getTime() > last.end.getTime()) {
      merged.push({ ...interval });
      continue;
    }
    if (interval.end.getTime() > last.end.getTime()) {
      last.end = interval.end;
    }
  }

  return merged;
}

function minutesBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 60_000);
}

function buildSlot(groupId: string, groupCode: string, start: Date, end: Date): FreeSlot {
  const durationMinutes = minutesBetween(start, end);
  return {
    groupId,
    groupCode,
    start: start.toISOString(),
    end: end.toISOString(),
    durationMinutes,
    label: `${groupCode}: ${start.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}-${end.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`
  };
}

export async function getFreeSlots(user: AuthUser, query: FreeSlotsQuery) {
  const { from, to } = dateRange(query);
  const groups = await prisma.group.findMany({
    where: visibleGroupWhere(user, query.groupId),
    select: { id: true, code: true }
  });

  const slots: FreeSlot[] = [];

  for (const group of groups) {
    const [lessons, scheduledTasks] = await Promise.all([
      prisma.scheduleLesson.findMany({
        where: {
          groupId: group.id,
          startsAt: { lte: to },
          endsAt: { gte: from }
        },
        select: { startsAt: true, endsAt: true }
      }),
      prisma.task.findMany({
        where: {
          groupId: group.id,
          scheduledStart: { not: null, lte: to },
          scheduledEnd: { not: null, gte: from }
        },
        select: { scheduledStart: true, scheduledEnd: true }
      })
    ]);

    const busy: BusyInterval[] = [
      ...lessons.map((lesson) => ({ start: lesson.startsAt, end: lesson.endsAt })),
      ...scheduledTasks
        .filter((task) => task.scheduledStart && task.scheduledEnd)
        .map((task) => ({ start: task.scheduledStart!, end: task.scheduledEnd! }))
    ];

    for (const day of eachDay(from, to)) {
      const dayStart = new Date(day);
      dayStart.setHours(query.dayStartHour, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(query.dayEndHour, 0, 0, 0);

      const dayBusy = mergeIntervals(
        busy
          .map((interval) => clampBusyToDay(interval, dayStart, dayEnd))
          .filter((interval): interval is BusyInterval => Boolean(interval))
      );

      let cursor = dayStart;
      for (const interval of dayBusy) {
        if (minutesBetween(cursor, interval.start) >= query.minSlotMinutes) {
          slots.push(buildSlot(group.id, group.code, cursor, interval.start));
        }
        cursor = interval.end > cursor ? interval.end : cursor;
      }

      if (minutesBetween(cursor, dayEnd) >= query.minSlotMinutes) {
        slots.push(buildSlot(group.id, group.code, cursor, dayEnd));
      }
    }
  }

  return slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

function taskHours(task: { pertExpectedHours: number | null; estimatedHours: number | null }) {
  return Math.max(0.5, task.pertExpectedHours ?? task.estimatedHours ?? 1);
}

function deadlineUrgency(deadline?: Date | null) {
  if (!deadline) return 0;
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);
  if (daysLeft <= 1) return 5;
  if (daysLeft <= 3) return 3;
  if (daysLeft <= 7) return 2;
  return 1;
}

export async function getTaskRecommendations(user: AuthUser, query: TaskRecommendationsQuery) {
  const slots = await getFreeSlots(user, query);
  const tasks = await prisma.task.findMany({
    where: {
      AND: [
        visibleTaskWhere(user),
        scopedGroupFilter(user, query.groupId),
        { status: { not: TaskStatus.DONE } },
        { scheduledStart: null }
      ]
    },
    include: {
      assignee: { select: { id: true, name: true, avatarColor: true } },
      group: { select: { id: true, code: true, name: true } },
      project: { select: { id: true, name: true } }
    },
    orderBy: [{ deadline: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
    take: query.limit * 3
  });

  return tasks
    .map((task) => {
      const requiredMinutes = Math.ceil(taskHours(task) * 60);
      const slot = slots.find((candidate) => candidate.groupId === task.groupId && candidate.durationMinutes >= requiredMinutes);
      const score = priorityWeight[task.priority] * 10 + deadlineUrgency(task.deadline) * 8 + (slot ? 10 : -10);
      return {
        task,
        requiredMinutes,
        recommendedSlot: slot ?? null,
        fitScore: score,
        reason: slot
          ? `Fits ${Math.round(requiredMinutes / 60 * 10) / 10}h into free slot ${slot.label}.`
          : "No free slot is long enough in the selected period; split task or widen planning range."
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, query.limit);
}

export async function assignTaskSlot(user: AuthUser, input: AssignSlotInput) {
  const task = await prisma.task.findFirst({
    where: { AND: [{ id: input.taskId }, visibleTaskWhere(user)] }
  });

  if (!task) {
    throw new AppError(404, "Task not found", "TASK_NOT_FOUND");
  }

  if (!canAssignTasks(user.role) && !canEditTask(user, task)) {
    throw new AppError(403, "Not enough permissions to assign task slot", "PLANNING_FORBIDDEN");
  }

  if (input.scheduleLessonId) {
    const lesson = await prisma.scheduleLesson.findFirst({
      where: { id: input.scheduleLessonId, group: visibleGroupWhere(user, task.groupId) },
      select: { id: true }
    });
    if (!lesson) {
      throw new AppError(404, "Schedule lesson not found", "SCHEDULE_NOT_FOUND");
    }
  }

  return prisma.task.update({
    where: { id: task.id },
    data: {
      scheduledStart: new Date(input.scheduledStart),
      scheduledEnd: new Date(input.scheduledEnd),
      scheduleLessonId: input.scheduleLessonId ?? null
    },
    include: {
      assignee: { select: { id: true, name: true, email: true, role: true, avatarColor: true } },
      creator: { select: { id: true, name: true, email: true, role: true, avatarColor: true } },
      group: { select: { id: true, name: true, code: true } },
      project: { select: { id: true, name: true } },
      scheduleLesson: { select: { id: true, subject: true, startsAt: true, endsAt: true, room: true } }
    }
  });
}
