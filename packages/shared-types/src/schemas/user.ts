import { z } from "zod";

export const roleSchema = z.enum(["super_admin", "admin", "student"]);
export type Role = z.infer<typeof roleSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().regex(/^\+8801[3-9]\d{8}$/, "Enter a valid Bangladeshi phone number"),
  password: z.string().min(8),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email(),
  role: roleSchema,
  avatarUrl: z.string().url().nullable(),
  phoneVerified: z.boolean(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;
