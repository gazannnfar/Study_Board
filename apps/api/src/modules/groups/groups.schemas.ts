import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(24),
  description: z.string().min(5),
  teacherId: z.string().nullable().optional()
});

export const updateGroupSchema = createGroupSchema.partial();
