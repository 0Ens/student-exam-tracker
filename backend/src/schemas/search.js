const { z } = require('zod');
const { EXAM_TYPES } = require('./exam');

// Empty query values (?type=) mean "no filter".
const optional = (schema) =>
  z.preprocess((v) => (v === '' || v === undefined ? undefined : v), schema.optional());

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const dateParam = (label) =>
  z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), `${label} is not a valid date`);

// GET /api/exams?q=&courseId=&type=&from=&to= (FR6)
const searchQuery = z
  .object({
    q: optional(z.string().trim().max(100, 'Search text can be at most 100 characters')),
    courseId: optional(
      z.coerce
        .number({ error: 'Course must be a number' })
        .int('Course must be a whole number')
        .positive('Course must be a positive number'),
    ),
    type: optional(z.enum(EXAM_TYPES, { error: `Type must be one of: ${EXAM_TYPES.join(', ')}` })),
    from: optional(dateParam('From')),
    to: optional(dateParam('To')),
  })
  .transform(({ from, to, ...rest }) => ({
    ...rest,
    from: from && new Date(from),
    // A plain date in "to" includes the whole day.
    to: to && new Date(DATE_ONLY.test(to) ? `${to}T23:59:59.999Z` : to),
  }))
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: 'From must be before To',
    path: ['to'],
  });

module.exports = { searchQuery };
