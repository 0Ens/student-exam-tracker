const gradeService = require('../services/gradeService');

async function list(req, res) {
  res.json(await gradeService.getGrades(req.user.id));
}

async function forCourse(req, res) {
  res.json(await gradeService.getCourseGrade(req.user.id, req.params.id));
}

module.exports = { list, forCourse };
