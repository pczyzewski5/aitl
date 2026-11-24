import { z } from 'zod';

export const LOGIN_PASSWORD_MAX_LENGTH = 1024;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(LOGIN_PASSWORD_MAX_LENGTH),
});

export type LoginInput = z.infer<typeof loginSchema>;
