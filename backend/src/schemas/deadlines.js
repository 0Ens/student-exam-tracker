const { z } = require('zod');

// GET /api/deadlines?days=14
const deadlinesQuery = z.object({
  days: z.coerce
    .number({ error: 'Days must be a number' })
    .int('Days must be a whole number')
    .min(1, 'Days must be at least 1')
    .max(365, 'Days can be at most 365')
    .default(14),
});

module.exports = { deadlinesQuery };
