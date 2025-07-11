import { z } from 'zod';

const userSchema = z.object({
  user: z.string({
    required_error: 'User is required',
    invalid_type_error: 'User must be a string',
  })
    .min(3, { message: 'User must be at least 3 characters long' })
    .max(20, { message: 'User must be at most 20 characters long' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'User must only contain letters, numbers, and underscores' }),

  password: z.string({
    required_error: 'Password is required',
    invalid_type_error: 'Password must be a string',
  })
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(50, { message: 'Password must be at most 50 characters long' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=-]).+$/, {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),

  mail: z.string({
    required_error: 'Email is required',
    invalid_type_error: 'Email must be a string',
  }).email({ message: 'Invalid email address' }),
});

export function validateUser(input) {
    return userSchema.safeParse(input);
  }
  
export function validatePartialUser(input) {
return userSchema.partial().safeParse(input);
}

export default userSchema;