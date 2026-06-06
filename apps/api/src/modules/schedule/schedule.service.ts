import { LessonType, Prisma, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.js";
import type { AuthUser } from "../../types/auth.js";
import { visibleGroupWhere } from "../rbac/group-scope.js";
import { scheduleLessonSchema, type ScheduleImportInput, type ScheduleLessonInput, type ScheduleQuery } from "./schedule.schemas.js";

const lessonSelect = {
  id: true,
  groupId: true,
  dayOfWeek: true,
  startsAt: true,
  endsAt: true,
  teacherName: true,
  room: true,
  lessonType: true,
  subject: true,
  topic: true,
  source: true,
  group: { select: { id: true, name: true, code: true } },
  tasks: { select: { id: true, title: true, status: true, priority: true } }
} satisfies Prisma.ScheduleLessonSelect;

function resolveDayOfWeek(date: Date) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function assertCanMutateSchedule(user: AuthUser) {
  const allowedRoles: Role[] = [Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_LEAD, Role.STAROSTA, Role.TEACHER];
  if (!allowedRoles.includes(user.role)) {
    throw new AppError(403, "Not enough permissions to manage schedule", "SCHEDULE_FORBIDDEN");
  }
}

async function assertGroupVisible(user: AuthUser, groupId: string) {
  const group = await prisma.group.findFirst({
    where: visibleGroupWhere(user, groupId),
    select: { id: true }
  });

  if (!group) {
    throw new AppError(403, "Group is not visible for this user", "GROUP_FORBIDDEN");
  }
}

export async function listSchedule(user: AuthUser, query: ScheduleQuery) {
  const dateFilter =
    query.dateFrom || query.dateTo
      ? {
          startsAt: {
            gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
            lte: query.dateTo ? new Date(query.dateTo) : undefined
          }
        }
      : {};

  return prisma.scheduleLesson.findMany({
    where: {
      AND: [
        { group: visibleGroupWhere(user, query.groupId) },
        dateFilter
      ]
    },
    select: lessonSelect,
    orderBy: [{ startsAt: "asc" }, { room: "asc" }]
  });
}

export async function createScheduleLesson(user: AuthUser, input: ScheduleLessonInput) {
  assertCanMutateSchedule(user);
  await assertGroupVisible(user, input.groupId);

  const startsAt = new Date(input.startsAt);

  return prisma.scheduleLesson.create({
    data: {
      groupId: input.groupId,
      dayOfWeek: input.dayOfWeek ?? resolveDayOfWeek(startsAt),
      startsAt,
      endsAt: new Date(input.endsAt),
      teacherName: input.teacherName,
      room: input.room,
      lessonType: input.lessonType,
      subject: input.subject,
      topic: input.topic ?? null,
      source: input.source ?? "manual"
    },
    select: lessonSelect
  });
}

function parseCsvRows(csv: string, fallbackGroupId?: string, source = "csv-import") {
  const rows = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length < 2) return [];

  const headers = rows[0].split(",").map((header) => header.trim());
  return rows.slice(1).map((row) => {
    const values = row.split(",").map((value) => value.trim());
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));

    return {
      groupId: record.groupId || fallbackGroupId,
      dayOfWeek: record.dayOfWeek ? Number(record.dayOfWeek) : undefined,
      startsAt: record.startsAt,
      endsAt: record.endsAt,
      teacherName: record.teacherName,
      room: record.room,
      lessonType: (record.lessonType || LessonType.PRACTICE) as LessonType,
      subject: record.subject,
      topic: record.topic || null,
      source
    };
  });
}

export async function importSchedule(user: AuthUser, input: ScheduleImportInput) {
  assertCanMutateSchedule(user);

  const rawLessons =
    input.format === "csv"
      ? parseCsvRows(input.csv ?? "", input.groupId, input.source)
      : (input.lessons ?? []).map((lesson) => ({ ...lesson, source: input.source }));

  const lessons = rawLessons.map((lesson) => scheduleLessonSchema.parse(lesson));

  for (const lesson of lessons) {
    await assertGroupVisible(user, lesson.groupId);
  }

  const created = await prisma.$transaction(
    lessons.map((lesson) => {
      const startsAt = new Date(lesson.startsAt);
      return prisma.scheduleLesson.create({
        data: {
          groupId: lesson.groupId,
          dayOfWeek: lesson.dayOfWeek ?? resolveDayOfWeek(startsAt),
          startsAt,
          endsAt: new Date(lesson.endsAt),
          teacherName: lesson.teacherName,
          room: lesson.room,
          lessonType: lesson.lessonType,
          subject: lesson.subject,
          topic: lesson.topic ?? null,
          source: lesson.source ?? input.source
        },
        select: lessonSelect
      });
    })
  );

  return {
    imported: created.length,
    lessons: created
  };
}

export async function deleteScheduleLesson(user: AuthUser, id: string) {
  assertCanMutateSchedule(user);
  const lesson = await prisma.scheduleLesson.findFirst({
    where: { id, group: visibleGroupWhere(user) },
    select: { id: true }
  });

  if (!lesson) {
    throw new AppError(404, "Schedule lesson not found", "SCHEDULE_NOT_FOUND");
  }

  await prisma.scheduleLesson.delete({ where: { id } });
}
