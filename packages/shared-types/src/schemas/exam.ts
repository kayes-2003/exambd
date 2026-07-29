import { z } from "zod";

export const createExamSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  totalQuestions: z.number().int().positive(),
  isRandomized: z.boolean().default(true),
  difficultyFilter: z.enum(["easy", "medium", "hard", "mixed"]).default("mixed"),
  negativeMarking: z.number().min(0).default(0),
  passingMarks: z.number().min(0).optional(),
  maxAttempts: z.number().int().positive().default(1),
  password: z.string().optional(),
  instructions: z.string().optional(),
  autoSubmit: z.boolean().default(true),
  subjects: z.array(z.object({
    subjectId: z.string().uuid(),
    questionCount: z.number().int().positive(),
  })).min(1),
});
export type CreateExamInput = z.infer<typeof createExamSchema>;
