import { Priority } from "@prisma/client";
import { z } from "zod";

export const taskSuggestionSchema = z.object({
  topic: z.string().min(2).max(300),
  description: z.string().max(3000).optional(),
  deadline: z.string().datetime().nullable().optional(),
  role: z.string().optional()
});

export const deadlineReminderSchema = z.object({
  title: z.string().min(2),
  deadline: z.string().datetime().nullable().optional(),
  priority: z.nativeEnum(Priority).optional()
});
