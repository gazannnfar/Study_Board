import { z } from "zod";

const isoDateTime = z.string().datetime();

export const freeSlotsQuerySchema = z.object({
  groupId: z.string().optional(),
  dateFrom: isoDateTime.optional(),
  dateTo: isoDateTime.optional(),
  minSlotMinutes: z.coerce.number().int().min(30).max(360).default(60),
  dayStartHour: z.coerce.number().int().min(6).max(12).default(8),
  dayEndHour: z.coerce.number().int().min(14).max(23).default(20)
});

export const taskRecommendationsQuerySchema = freeSlotsQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(30).default(10)
});

export const assignSlotSchema = z
  .object({
    taskId: z.string(),
    scheduledStart: isoDateTime,
    scheduledEnd: isoDateTime,
    scheduleLessonId: z.string().nullable().optional()
  })
  .refine((value) => new Date(value.scheduledEnd).getTime() > new Date(value.scheduledStart).getTime(), {
    message: "scheduledEnd must be after scheduledStart",
    path: ["scheduledEnd"]
  });

export type FreeSlotsQuery = z.infer<typeof freeSlotsQuerySchema>;
export type TaskRecommendationsQuery = z.infer<typeof taskRecommendationsQuerySchema>;
export type AssignSlotInput = z.infer<typeof assignSlotSchema>;
