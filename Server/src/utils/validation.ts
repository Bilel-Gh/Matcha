import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    username: z.string().min(3, 'Username must be at least 3 characters long'),
    firstName: z.string().min(2, 'First name must be at least 2 characters long'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters long'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    birthDate: z.string().refine((date) => {
      const birthDate = new Date(date);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      const m = new Date().getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && new Date().getDate() < birthDate.getDate())) {
        return age - 1 >= 18;
      }
      return age >= 18;
    }, { message: 'You must be at least 18 years old' }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    username: z.string(),
    password: z.string(),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string(),
    new_password: z.string().min(8, 'Password must be at least 8 characters long'),
  }),
});
