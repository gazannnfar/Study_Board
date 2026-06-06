import { LessonType } from "@prisma/client";
import { z } from "zod";

const isoDateTime = z.string().datetime();

export const scheduleQuerySchema = z.object({
  groupId: z.string().optional(),
  dateFrom: isoDateTime.optional(),
  dateTo: isoDateTime.optional()
});

export const scheduleLessonSchema = z
  .object({
    groupId: z.string(),
    dayOfWeek: z.number().int().min(1).max(7).optional(),
    startsAt: isoDateTime,
    endsAt: isoDateTime,
    teacherName: z.string().min(2).max(120),
    room: z.string().min(1).max(40),
    lessonType: z.nativeEnum(LessonType).default(LessonType.PRACTICE),
    subject: z.string().min(2).max(160),
    topic: z.string().max(240).nullable().optional(),
    source: z.string().max(80).optional()
  })
  .refine((value) => new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(), {
    message: "endsAt must be after startsAt",
    path: ["endsAt"]
  });

export const scheduleImportSchema = z.object({
  format: z.enum(["json", "csv"]).default("json"),
  source: z.string().max(80).default("manual-import"),
  groupId: z.string().optional(),
  lessons: z.array(scheduleLessonSchema).optional(),
  csv: z.string().optional()
});

export type ScheduleQuery = z.infer<typeof scheduleQuerySchema>;
export type ScheduleLessonInput = z.infer<typeof scheduleLessonSchema>;
export type ScheduleImportInput = z.infer<typeof scheduleImportSchema>;
