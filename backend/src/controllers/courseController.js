const courseService = require('../services/courseService');

async function list(req, res) {
  res.json(await courseService.listCourses(req.user.id));
}

async function get(req, res) {
  res.json(await courseService.getCourse(req.user.id, req.params.id));
}

async function create(req, res) {
  res.status(201).json(await courseService.createCourse(req.user.id, req.body));
}

async function update(req, res) {
  res.json(await courseService.updateCourse(req.user.id, req.params.id, req.body));
}

async function remove(req, res) {
  await courseService.deleteCourse(req.user.id, req.params.id);
  res.status(204).end();
}

module.exports = { list, get, create, update, remove };
