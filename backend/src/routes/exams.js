const { Router } = require('express');
const controller = require('../controllers/examController');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { examSchema } = require('../schemas/exam');

const router = Router();

router.use(requireAuth);

router.get('/:id', controller.get);
router.put('/:id', validate(examSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
