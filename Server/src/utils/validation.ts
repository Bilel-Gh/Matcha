import { z } from 'zod';

// Common validation rules
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one lowercase letter, one uppercase letter, and one number');

const emailSchema = z
  .string()
  .email('Please provide a valid email address')
  .min(1, 'Email is required');

const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters long')
  .max(20, 'Username must not exceed 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters long')
  .max(50, 'Name must not exceed 50 characters')
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Registration schema
export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  password: passwordSchema,
  birthDate: z
    .string({ required_error: 'Birth date is required' })
    .refine(
      (date) => {
      const birthDate = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1 >= 18;
      }
      return age >= 18;
      },
      'You must be at least 18 years old to register'
    ),
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Reset password schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  new_password: passwordSchema,
});

// Profile update schema
export const profileUpdateSchema = z.object({
  firstname: nameSchema.optional(),
  lastname: nameSchema.optional(),
  email: emailSchema.optional(),
  username: usernameSchema.optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  sexual_preferences: z.enum(['male', 'female', 'both']).optional(),
  biography: z.string().max(500, 'Biography must not exceed 500 characters').optional(),
  birth_date: z
    .string()
    .optional()
    .refine(
      (date) => {
        if (!date) return true; // Optional field
        const birthDate = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          return age - 1 >= 18;
        }
        return age >= 18;
      },
      'You must be at least 18 years old'
    ),
});

// Password change schema
export const passwordChangeSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: passwordSchema,
});

// Interest validation schemas
export const interestCreateSchema = z.object({
  name: z
    .string()
    .min(2, 'Interest name must be at least 2 characters long')
    .max(30, 'Interest name must not exceed 30 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Interest name can only contain letters and spaces'),
  tag: z
    .string()
    .max(50, 'Interest tag must not exceed 50 characters')
    .regex(/^[a-z0-9_]+$/, 'Interest tag can only contain lowercase letters, numbers, and underscores')
    .optional(),
});

export const interestAddByNameSchema = z.object({
  name: z
    .string()
    .min(2, 'Interest name must be at least 2 characters long')
    .max(30, 'Interest name must not exceed 30 characters')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s_-]+$/, 'Interest name can only contain letters, numbers, spaces, underscores, and hyphens'),
});

export const interestSearchSchema = z.object({
  q: z
    .string()
    .min(1, 'Search query must be at least 1 character long')
    .max(50, 'Search query must not exceed 50 characters'),
});

export const userInterestsUpdateSchema = z.object({
  interest_ids: z
    .array(z.number().int().positive('Interest ID must be a positive integer'))
    .max(10, 'Maximum 10 interests allowed per user')
    .refine((ids) => new Set(ids).size === ids.length, 'Duplicate interest IDs are not allowed'),
});

// Location validation schemas
export const locationUpdateSchema = z.object({
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  source: z.enum(['gps', 'ip', 'manual'], {
    errorMap: () => ({ message: 'Source must be gps, ip, or manual' })
  }),
  city: z
    .string()
    .max(100, 'City name must not exceed 100 characters')
    .optional(),
  country: z
    .string()
    .max(100, 'Country name must not exceed 100 characters')
    .optional(),
});

// Export types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type InterestCreateInput = z.infer<typeof interestCreateSchema>;
export type InterestAddByNameInput = z.infer<typeof interestAddByNameSchema>;
export type InterestSearchInput = z.infer<typeof interestSearchSchema>;
export type UserInterestsUpdateInput = z.infer<typeof userInterestsUpdateSchema>;
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
