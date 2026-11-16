const { Router } = require('express');
const controller = require('../controllers/courseController');
const examController = require('../controllers/examController');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { courseSchema } = require('../schemas/course');
const { examSchema } = require('../schemas/exam');

const router = Router();

router.use(requireAuth);

router.get('/', controller.list);
router.post('/', validate(courseSchema), controller.create);
router.get('/:id', controller.get);
router.put('/:id', validate(courseSchema), controller.update);
router.delete('/:id', controller.remove);

// Exams belong to a course (FR3)
router.get('/:id/exams', examController.listForCourse);
router.post('/:id/exams', validate(examSchema), examController.createForCourse);

module.exports = router;
