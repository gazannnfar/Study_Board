import { Priority } from "@prisma/client";
import { z } from "zod";

export const taskSuggestionSchema = z.object({
  topic: z.string().min(2).max(300),
  description: z.string().max(3000).optional(),
  deadline: z.string().datetime().nullable().optional(),
  role: z.string().optional(),
  mode: z.enum(["AI_STRICT", "AI_LIGHT"]).default("AI_LIGHT"),
  pert: z
    .object({
      optimistic: z.number().positive().max(200).optional(),
      mostLikely: z.number().positive().max(200).optional(),
      pessimistic: z.number().positive().max(400).optional()
    })
    .optional(),
  freeSlotMinutes: z.number().int().positive().optional()
});

export const deadlineReminderSchema = z.object({
  title: z.string().min(2),
  deadline: z.string().datetime().nullable().optional(),
  priority: z.nativeEnum(Priority).optional(),
  mode: z.enum(["AI_STRICT", "AI_LIGHT"]).default("AI_LIGHT")
});

export const pertSchema = z
  .object({
    optimistic: z.number().positive().max(200),
    mostLikely: z.number().positive().max(200),
    pessimistic: z.number().positive().max(400)
  })
  .refine((value) => value.optimistic <= value.mostLikely && value.mostLikely <= value.pessimistic, {
    message: "PERT values must satisfy optimistic <= mostLikely <= pessimistic",
    path: ["mostLikely"]
  });

export const scheduleReviewSchema = z.object({
  title: z.string().min(2),
  mode: z.enum(["AI_STRICT", "AI_LIGHT"]).default("AI_LIGHT"),
  expectedHours: z.number().positive().max(400).nullable().optional(),
  freeSlotMinutes: z.number().int().min(0).optional(),
  deadline: z.string().datetime().nullable().optional()
});
