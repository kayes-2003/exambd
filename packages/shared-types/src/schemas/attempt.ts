import { z } from "zod";

export const saveAnswerSchema = z.object({
  selectedOptionId: z.string().uuid().nullable(), // null clears the answer
  isMarkedForReview: z.boolean().optional(),
  timeSpentSeconds: z.number().int().min(0).default(0),
});
export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;

export const proctoringEventSchema = z.object({
  eventType: z.enum([
    "tab_switch", "fullscreen_exit", "blur", "devtools_open",
    "copy_attempt", "paste_attempt", "right_click",
    "multi_device", "network_disconnect", "network_reconnect",
  ]),
  metadata: z.record(z.unknown()).optional(),
});
export type ProctoringEventInput = z.infer<typeof proctoringEventSchema>;

export const attemptStateSchema = z.object({
  attemptId: z.string().uuid(),
  examTitle: z.string(),
  endAt: z.string().datetime(),
  remainingSeconds: z.number().int(),
  currentQuestions: z.array(z.object({
    questionId: z.string().uuid(),
    displayOrder: z.number().int(),
    isAnswered: z.boolean(),
    isMarkedForReview: z.boolean(),
    isVisited: z.boolean(),
  })),
});
export type AttemptState = z.infer<typeof attemptStateSchema>;
