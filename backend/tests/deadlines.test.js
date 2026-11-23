const request = require('supertest');
const { createApp } = require('../src/app');
const { getDeadlines } = require('../src/services/deadlineService');
const { prisma, resetDb, registerUser } = require('./helpers');

const app = createApp();
const DAY = 24 * 60 * 60 * 1000;

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

// Midnight UTC, `offset` days from today
function day(offset) {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + offset * DAY,
  );
}

async function createCourse(token, overrides = {}) {
  const res = await request(app)
    .post('/api/courses')
    .set(auth(token))
    .send({ name: 'Algorithms', code: 'CS201', credits: 4, term: '2026 Fall', ...overrides });
  return res.body;
}

async function addExam(token, courseId, title, offset, grade = null) {
  const res = await request(app)
    .post(`/api/courses/${courseId}/exams`)
    .set(auth(token))
    .send({ title, type: 'assignment', date: day(offset).toISOString(), weight: 10, grade });
  expect(res.status).toBe(201);
  return res.body;
}

const titles = (list) => list.map((e) => e.title);

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('GET /api/deadlines', () => {
  it('rejects requests without a token', async () => {
    expect((await request(app).get('/api/deadlines')).status).toBe(401);
  });

  it('TC-09: splits items into overdue and upcoming, sorted by date', async () => {
    const { token } = await registerUser(app);
    const course = await createCourse(token);
    await addExam(token, course.id, 'Homework 2', -13);
    await addExam(token, course.id, 'Quiz 1', -3, 80);
    await addExam(token, course.id, 'Homework 3', -1);
    await addExam(token, course.id, 'Final', 30);
    await addExam(token, course.id, 'Midterm', 5);
    await addExam(token, course.id, 'Lab', 0);

    const res = await request(app).get('/api/deadlines').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.days).toBe(14);
    expect(titles(res.body.overdue)).toEqual(['Homework 2', 'Homework 3']);
    expect(titles(res.body.upcoming)).toEqual(['Lab', 'Midterm']);
    expect(res.body.overdue[0].daysLeft).toBe(-13);
    expect(res.body.upcoming[1]).toMatchObject({
      daysLeft: 5,
      weight: 10,
      course: { id: course.id, code: 'CS201', name: 'Algorithms' },
    });
  });

  it('uses the days parameter for the window', async () => {
    const { token } = await registerUser(app);
    const course = await createCourse(token);
    await addExam(token, course.id, 'Midterm', 5);
    await addExam(token, course.id, 'Final', 30);

    const short = await request(app).get('/api/deadlines?days=3').set(auth(token));
    expect(titles(short.body.upcoming)).toEqual([]);
    const month = await request(app).get('/api/deadlines?days=30').set(auth(token));
    expect(titles(month.body.upcoming)).toEqual(['Midterm', 'Final']);
  });

  it.each(['0', '366', 'abc', '2.5'])('rejects days=%s', async (days) => {
    const { token } = await registerUser(app);
    const res = await request(app).get(`/api/deadlines?days=${days}`).set(auth(token));
    expect(res.status).toBe(400);
    expect(res.body.details.days).toHaveLength(1);
  });

  it('includes the items of all courses', async () => {
    const { token } = await registerUser(app);
    const a = await createCourse(token);
    const b = await createCourse(token, { name: 'History', code: 'HIS101' });
    await addExam(token, b.id, 'Essay', 2);
    await addExam(token, a.id, 'Quiz', 1);

    const res = await request(app).get('/api/deadlines').set(auth(token));
    expect(res.body.upcoming.map((e) => e.course.code)).toEqual(['CS201', 'HIS101']);
  });

  it('TC-14: does not show the items of another user', async () => {
    const owner = await registerUser(app);
    const other = await registerUser(app, { email: 'other@example.com' });
    const course = await createCourse(owner.token);
    await addExam(owner.token, course.id, 'Midterm', 2);
    await addExam(owner.token, course.id, 'Homework', -2);

    const res = await request(app).get('/api/deadlines').set(auth(other.token));
    expect(res.body).toEqual({ days: 14, overdue: [], upcoming: [] });
  });
});

describe('deadline service', () => {
  it('uses the given time as today', async () => {
    const { token, user } = await registerUser(app);
    const course = await createCourse(token);
    await addExam(token, course.id, 'Midterm', 5);

    const later = new Date(Date.now() + 7 * DAY);
    const result = await getDeadlines(user.id, { now: later });
    expect(titles(result.overdue)).toEqual(['Midterm']);
    expect(result.overdue[0].daysLeft).toBe(-2);
    expect(result.days).toBe(14);
  });
});
