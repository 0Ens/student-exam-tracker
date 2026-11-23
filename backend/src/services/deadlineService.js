const prisma = require('../db');
const { DAY_MS, startOfUtcDay, daysLeft, deadlineStatus } = require('../lib/deadlines');

// Upcoming and overdue exams/assignments of the user for the dashboard (FR4).
// `now` can be passed in by tests.
async function getDeadlines(userId, { days = 14, now = new Date() } = {}) {
  const today = new Date(startOfUtcDay(now));
  const end = new Date(today.getTime() + (days + 1) * DAY_MS);

  // Everything from today until the end of the window, plus older items
  // that still have no grade.
  const exams = await prisma.exam.findMany({
    where: {
      course: { userId },
      date: { lt: end },
      OR: [{ date: { gte: today } }, { grade: null }],
    },
    include: { course: { select: { id: true, code: true, name: true } } },
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
  });

  const result = { days, overdue: [], upcoming: [] };
  for (const exam of exams) {
    const status = deadlineStatus(exam, now, days);
    if (status) {
      result[status].push({ ...exam, daysLeft: daysLeft(exam.date, now) });
    }
  }
  return result;
}

module.exports = { getDeadlines };
