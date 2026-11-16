const { z } = require('zod');

const EXAM_TYPES = ['exam', 'quiz', 'assignment', 'project'];

// Empty values from HTML forms ('' or null) are treated as "not given".
const emptyTo = (value) => (v) => (v === '' || v === null || v === undefined ? value : v);

const percent = (label) =>
  z.coerce
    .number({ error: `${label} must be a number` })
    .min(0, `${label} cannot be negative`)
    .max(100, `${label} cannot be more than 100`);

const examSchema = z.object({
  title: z.string({ error: 'Title is required' }).trim().min(1, 'Title is required').max(100),
  type: z.enum(EXAM_TYPES, { error: `Type must be one of: ${EXAM_TYPES.join(', ')}` }),
  date: z
    .string({ error: 'Date is required' })
    .trim()
    .min(1, 'Date is required')
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Date is not valid')
    .transform((value) => new Date(value)),
  weight: z.preprocess(
    emptyTo(undefined),
    z
      .union([z.undefined(), percent('Weight')])
      .refine((v) => v !== undefined, 'Weight is required'),
  ),
  // A missing grade means "not graded yet".
  grade: z.preprocess(emptyTo(null), percent('Grade').nullable()),
});

module.exports = { examSchema, EXAM_TYPES };
