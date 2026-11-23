const examService = require('../services/examService');

async function listForCourse(req, res) {
  res.json(await examService.listExams(req.user.id, req.params.id));
}

async function createForCourse(req, res) {
  res.status(201).json(await examService.createExam(req.user.id, req.params.id, req.body));
}

async function search(req, res) {
  res.json(await examService.searchExams(req.user.id, req.validQuery));
}

async function get(req, res) {
  res.json(await examService.getExam(req.user.id, req.params.id));
}

async function update(req, res) {
  res.json(await examService.updateExam(req.user.id, req.params.id, req.body));
}

async function remove(req, res) {
  await examService.deleteExam(req.user.id, req.params.id);
  res.status(204).end();
}

module.exports = { listForCourse, createForCourse, search, get, update, remove };
