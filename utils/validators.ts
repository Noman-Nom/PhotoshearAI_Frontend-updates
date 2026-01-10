
import { z } from 'zod';

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').regex(EMAIL_REGEX, 'Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  url: z.string().min(1, 'Studio URL is required').regex(/^[a-z0-9-]+$/, 'URL must only contain lowercase letters, numbers, and hyphens'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().regex(/^\d{7,15}$/, 'Invalid phone number format'),
  email: z.string().min(1, 'Email is required').regex(EMAIL_REGEX, 'Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').regex(EMAIL_REGEX, 'Invalid email address'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
