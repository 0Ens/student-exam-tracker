const { Router } = require('express');
const controller = require('../controllers/courseController');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { courseSchema } = require('../schemas/course');

const router = Router();

router.use(requireAuth);

router.get('/', controller.list);
router.post('/', validate(courseSchema), controller.create);
router.get('/:id', controller.get);
router.put('/:id', validate(courseSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
