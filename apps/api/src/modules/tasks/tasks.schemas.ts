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

export const createTaskSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(5).max(5000),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  deadline: deadlineSchema,
  tags: z.array(z.string().min(1).max(32)).max(8).default([]),
  estimatedHours: z.number().int().positive().max(200).nullable().optional(),
  groupId: z.string().optional(),
  projectId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional()
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  grade: z.number().int().min(0).max(100).nullable().optional()
});

export const createCommentSchema = z.object({
  body: z.string().min(1).max(2000),
  grade: z.number().int().min(0).max(100).nullable().optional()
});

export type TaskQuery = z.infer<typeof taskQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
