const { z } = require('zod');

const courseSchema = z.object({
  name: z.string({ error: 'Name is required' }).trim().min(1, 'Name is required').max(100),
  code: z.string({ error: 'Code is required' }).trim().min(1, 'Code is required').max(20),
  credits: z.coerce
    .number({ error: 'Credits must be a number' })
    .int('Credits must be a whole number')
    .min(0, 'Credits cannot be negative')
    .max(30, 'Credits cannot be more than 30'),
  term: z.string({ error: 'Term is required' }).trim().min(1, 'Term is required').max(30),
});

module.exports = { courseSchema };
