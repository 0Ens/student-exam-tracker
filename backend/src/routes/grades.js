const { Router } = require('express');
const controller = require('../controllers/gradeController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);

// Course averages and estimated GPA (FR5)
router.get('/', controller.list);

module.exports = router;
