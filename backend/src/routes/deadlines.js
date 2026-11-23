const { Router } = require('express');
const controller = require('../controllers/deadlineController');
const { requireAuth } = require('../middleware/auth');
const { validateQuery } = require('../middleware/validate');
const { deadlinesQuery } = require('../schemas/deadlines');

const router = Router();

router.use(requireAuth);

// Upcoming and overdue items for the dashboard (FR4)
router.get('/', validateQuery(deadlinesQuery), controller.list);

module.exports = router;
