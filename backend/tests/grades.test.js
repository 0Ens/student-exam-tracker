const request = require('supertest');
const { createApp } = require('../src/app');
const { prisma, resetDb, registerUser } = require('./helpers');

const app = createApp();

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

async function createCourse(token, overrides = {}) {
  const res = await request(app)
    .post('/api/courses')
    .set(auth(token))
    .send({ name: 'Algorithms', code: 'CS201', credits: 4, term: '2026 Fall', ...overrides });
  return res.body;
}

function addExam(token, courseId, weight, grade, title = 'Exam') {
  return request(app)
    .post(`/api/courses/${courseId}/exams`)
    .set(auth(token))
    .send({ title, type: 'exam', date: '2026-11-20T09:00:00.000Z', weight, grade });
}

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('grades require login', () => {
  it('rejects requests without a token', async () => {
    expect((await request(app).get('/api/grades')).status).toBe(401);
    expect((await request(app).get('/api/courses/1/grade')).status).toBe(401);
  });
});

describe('GET /api/courses/:id/grade', () => {
  it('TC-10: grades 80 (40%) and 60 (60%) give an average of 68', async () => {
    const { token } = await registerUser(app);
    const course = await createCourse(token);
    await addExam(token, course.id, 40, 80, 'Midterm');
    await addExam(token, course.id, 60, 60, 'Final');

    const res = await request(app).get(`/api/courses/${course.id}/grade`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: course.id,
      code: 'CS201',
      name: 'Algorithms',
      credits: 4,
      average: 68,
      letter: 'CC',
      points: 2,
      gradedWeight: 100,
    });
  });

  it('returns no average when nothing is graded', async () => {
    const { token } = await registerUser(app);
    const course = await createCourse(token);
    await addExam(token, course.id, 40, null);

    const res = await request(app).get(`/api/courses/${course.id}/grade`).set(auth(token));
    expect(res.body).toMatchObject({ average: null, letter: null, points: null, gradedWeight: 0 });
  });

  it('TC-14: does not show the grade of another user', async () => {
    const owner = await registerUser(app);
    const other = await registerUser(app, { email: 'other@example.com' });
    const course = await createCourse(owner.token);

    const res = await request(app).get(`/api/courses/${course.id}/grade`).set(auth(other.token));
    expect(res.status).toBe(404);
  });

  it('returns 404 for an invalid id', async () => {
    const { token } = await registerUser(app);
    const res = await request(app).get('/api/courses/abc/grade').set(auth(token));
    expect(res.status).toBe(404);
  });
});

describe('GET /api/grades', () => {
  it('TC-11: returns every course and a GPA weighted by credits', async () => {
    const { token } = await registerUser(app);
    const algorithms = await createCourse(token, { credits: 3 });
    const history = await createCourse(token, { name: 'History', code: 'HIS101', credits: 1 });
    const empty = await createCourse(token, { name: 'Physics', code: 'PHY101', credits: 5 });
    await addExam(token, algorithms.id, 50, 92);
    await addExam(token, history.id, 100, 67);
    await addExam(token, empty.id, 30, null);

    const res = await request(app).get('/api/grades').set(auth(token));
    expect(res.status).toBe(200);
    // AA (4.0) x 3 + CC (2.0) x 1 = 14 / 4 credits; Physics has no grade yet
    expect(res.body.gpa).toBe(3.5);
    expect(res.body.courses).toHaveLength(3);
    const byCode = Object.fromEntries(res.body.courses.map((c) => [c.code, c]));
    expect(byCode.CS201).toMatchObject({ average: 92, letter: 'AA', gradedWeight: 50 });
    expect(byCode.HIS101).toMatchObject({ average: 67, letter: 'CC' });
    expect(byCode.PHY101).toMatchObject({ average: null, letter: null });
  });

  it('returns no GPA for a new user', async () => {
    const { token } = await registerUser(app);
    const res = await request(app).get('/api/grades').set(auth(token));
    expect(res.body).toEqual({ gpa: null, courses: [] });
  });

  it('TC-14: only uses the courses of the logged-in user', async () => {
    const owner = await registerUser(app);
    const other = await registerUser(app, { email: 'other@example.com' });
    const course = await createCourse(owner.token);
    await addExam(owner.token, course.id, 100, 95);

    const res = await request(app).get('/api/grades').set(auth(other.token));
    expect(res.body).toEqual({ gpa: null, courses: [] });
  });
});
