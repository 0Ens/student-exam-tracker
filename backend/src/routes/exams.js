const { Router } = require('express');
const controller = require('../controllers/examController');
const { validate, validateQuery } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { examSchema } = require('../schemas/exam');
const { searchQuery } = require('../schemas/search');

const router = Router();

router.use(requireAuth);

// Search and filter (FR6). Must come before /:id.
router.get('/', validateQuery(searchQuery), controller.search);
router.get('/:id', controller.get);
router.put('/:id', validate(examSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
