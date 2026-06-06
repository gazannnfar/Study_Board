import { Priority, TaskStatus } from "@prisma/client";
import { z } from "zod";

const deadlineSchema = z.string().datetime().nullable().optional();

export const taskQuerySchema = z.object({
  assigneeId: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  groupId: z.string().optional(),
  projectId: z.string().optional(),
  deadline: z.enum(["overdue", "today", "week", "none"]).optional(),
  mine: z.coerce.boolean().optional()
});

const taskBaseSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(5).max(5000),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  deadline: deadlineSchema,
  tags: z.array(z.string().min(1).max(32)).max(8).default([]),
  estimatedHours: z.number().int().positive().max(200).nullable().optional(),
  pertOptimisticHours: z.number().positive().max(200).nullable().optional(),
  pertMostLikelyHours: z.number().positive().max(200).nullable().optional(),
  pertPessimisticHours: z.number().positive().max(400).nullable().optional(),
  scheduledStart: deadlineSchema,
  scheduledEnd: deadlineSchema,
  scheduleLessonId: z.string().nullable().optional(),
  groupId: z.string().optional(),
  projectId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional()
});

function pertOrderIsValid(value: {
  pertOptimisticHours?: number | null;
  pertMostLikelyHours?: number | null;
  pertPessimisticHours?: number | null;
}) {
  return (
    !value.pertOptimisticHours ||
    !value.pertMostLikelyHours ||
    !value.pertPessimisticHours ||
    (value.pertOptimisticHours <= value.pertMostLikelyHours &&
      value.pertMostLikelyHours <= value.pertPessimisticHours)
  );
}

function scheduleRangeIsValid(value: { scheduledStart?: string | null; scheduledEnd?: string | null }) {
  return (
    !value.scheduledStart ||
    !value.scheduledEnd ||
    new Date(value.scheduledEnd).getTime() > new Date(value.scheduledStart).getTime()
  );
}

export const createTaskSchema = taskBaseSchema.refine(
  pertOrderIsValid,
  {
    message: "PERT values must satisfy optimistic <= mostLikely <= pessimistic",
    path: ["pertMostLikelyHours"]
  }
).refine(
  scheduleRangeIsValid,
  {
    message: "scheduledEnd must be after scheduledStart",
    path: ["scheduledEnd"]
  }
);

export const updateTaskSchema = taskBaseSchema.partial().extend({
  grade: z.number().int().min(0).max(100).nullable().optional()
}).refine(
  (value) =>
    pertOrderIsValid(value),
  {
    message: "PERT values must satisfy optimistic <= mostLikely <= pessimistic",
    path: ["pertMostLikelyHours"]
  }
).refine(
  scheduleRangeIsValid,
  {
    message: "scheduledEnd must be after scheduledStart",
    path: ["scheduledEnd"]
  }
);

export const createCommentSchema = z.object({
  body: z.string().min(1).max(2000),
  grade: z.number().int().min(0).max(100).nullable().optional()
});

export type TaskQuery = z.infer<typeof taskQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
