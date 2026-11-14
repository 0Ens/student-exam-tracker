const { z } = require('zod');

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: 'Invalid e-mail address' }));

const registerSchema = z.object({
  name: z.string({ error: 'Name is required' }).trim().min(1, 'Name is required').max(80),
  email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };
