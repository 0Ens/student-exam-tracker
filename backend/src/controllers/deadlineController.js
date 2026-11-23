const deadlineService = require('../services/deadlineService');

async function list(req, res) {
  res.json(await deadlineService.getDeadlines(req.user.id, { days: req.validQuery.days }));
}

module.exports = { list };
