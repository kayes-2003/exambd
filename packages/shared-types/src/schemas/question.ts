import { z } from "zod";

export const difficultySchema = z.enum(["easy", "medium", "hard"]);
export const questionTypeSchema = z.enum(["single_choice", "multi_select", "true_false"]);
export const questionStatusSchema = z.enum([
  "draft", "pending_review", "published", "unpublished", "archived",
]);

// Used by admins when authoring/editing — includes is_correct.
export const questionOptionInputSchema = z.object({
  id: z.string().uuid().optional(), // absent when creating a new option
  optionText: z.string().min(1),
  isCorrect: z.boolean(),
});

export const createQuestionSchema = z.object({
  questionText: z.string().min(3),
  questionType: questionTypeSchema.default("single_choice"),
  subjectId: z.string().uuid(),
  chapterId: z.string().uuid().optional(),
  topicId: z.string().uuid().optional(),
  difficulty: difficultySchema,
  marks: z.number().positive().default(1),
  negativeMarks: z.number().min(0).default(0),
  language: z.enum(["bn", "en"]).default("bn"),
  explanation: z.string().optional(),
  reference: z.string().optional(),
  videoUrl: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  options: z.array(questionOptionInputSchema).min(2).max(6)
    .refine((opts) => opts.filter((o) => o.isCorrect).length >= 1, {
      message: "At least one option must be marked correct",
    }),
});
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

// What a STUDENT sees during an exam — no isCorrect, ever.
export const studentFacingOptionSchema = z.object({
  optionId: z.string().uuid(),
  displayLabel: z.enum(["A", "B", "C", "D", "E", "F"]),
  optionText: z.string(),
});

export const studentFacingQuestionSchema = z.object({
  questionId: z.string().uuid(),
  questionText: z.string(),
  mediaUrl: z.string().url().nullable(),
  marks: z.number(),
  negativeMarks: z.number(),
  options: z.array(studentFacingOptionSchema),
});
export type StudentFacingQuestion = z.infer<typeof studentFacingQuestionSchema>;
