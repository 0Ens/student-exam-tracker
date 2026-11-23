// Rules for the dashboard (FR4): which exams are upcoming and which are overdue.
// Days are counted in UTC, because exam dates are saved as midnight UTC.

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(date) {
  const d = new Date(date);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

// Whole days from today to the exam day: 0 = today, 1 = tomorrow, -1 = yesterday.
function daysLeft(examDate, now) {
  return Math.round((startOfUtcDay(examDate) - startOfUtcDay(now)) / DAY_MS);
}

// 'overdue'  - the day has passed and there is still no grade
// 'upcoming' - today or in the next `days` days
// null       - not shown on the dashboard
function deadlineStatus(exam, now, days) {
  const left = daysLeft(exam.date, now);
  if (left < 0) {
    return exam.grade === null || exam.grade === undefined ? 'overdue' : null;
  }
  return left <= days ? 'upcoming' : null;
}

module.exports = { DAY_MS, startOfUtcDay, daysLeft, deadlineStatus };
