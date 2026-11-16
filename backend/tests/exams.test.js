const request = require('supertest');
const { createApp } = require('../src/app');
const { prisma, resetDb, registerUser } = require('./helpers');

const app = createApp();

const midterm = {
  title: 'Midterm',
  type: 'exam',
  date: '2026-11-20T09:00:00.000Z',
  weight: 30,
};

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

async function createCourse(token) {
  const res = await request(app).post('/api/courses').set(auth(token)).send({
    name: 'Software Project Management',
    code: 'SWE488',
    credits: 3,
    term: '2026 Fall',
  });
  return res.body;
}

function addExam(token, courseId, overrides = {}) {
  return request(app)
    .post(`/api/courses/${courseId}/exams`)
    .set(auth(token))
    .send({ ...midterm, ...overrides });
}

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('exams require login', () => {
  it('TC-03: rejects requests without a token', async () => {
    const list = await request(app).get('/api/courses/1/exams');
    const single = await request(app).get('/api/exams/1');
    expect(list.status).toBe(401);
    expect(single.status).toBe(401);
  });
});

describe('TC-07: add an exam with date and weight', () => {
  it('saves the exam and shows it under the course', async () => {
    const { token } = await registerUser(app);
    const course = await createCourse(token);

    const res = await addExam(token, course.id);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Midterm',
      type: 'exam',
      weight: 30,
      grade: null,
      courseId: course.id,
    });
    expect(res.body.date).toBe(midterm.date);

    const list = await request(app).get(`/api/courses/${course.id}/exams`).set(auth(token));
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].id).toBe(res.body.id);
  });

  it('lists the exams of a course by date', async () => {
    const { token } = await registerUser(app);
    const course = await createCourse(token);
    await addExam(token, course.id, { title: 'Final', date: '2026-12-28', weight: 40 });
    await addExam(token, course.id, {
      title: 'Quiz 1',
      type: 'quiz',
      date: '2026-11-10',
      weight: 10,
    });
    await addExam(token, course.id);

    const res = await request(app).get(`/api/courses/${course.id}/exams`).set(auth(token));

    expect(res.body.map((e) => e.title)).toEqual(['Quiz 1', 'Midterm', 'Final']);
  });

  it('gets, updates and deletes a single exam', async () => {
    const { token } = await registerUser(app);
    const course = await createCourse(token);
    const { body: exam } = await addExam(token, course.id);

    const got = await request(app).get(`/api/exams/${exam.id}`).set(auth(token));
    expect(got.status).toBe(200);
    expect(got.body.title).toBe('Midterm');

    const updated = await request(app)
      .put(`/api/exams/${exam.id}`)
      .set(auth(token))
      .send({ ...midterm, title: 'Midterm exam', grade: 85 });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({ title: 'Midterm exam', grade: 85 });

    const removed = await request(app).delete(`/api/exams/${exam.id}`).set(auth(token));
    expect(removed.status).toBe(204);
    expect(await prisma.exam.count()).toBe(0);
  });

  it('removes the exams when their course is deleted', async () => {
    const { token } = await registerUser(app);
    const course = await createCourse(token);
    await addExam(token, course.id);

    await request(app).delete(`/api/courses/${course.id}`).set(auth(token));

    expect(await prisma.exam.count()).toBe(0);
  });
});

describe('TC-08: total weight of a course cannot be more than 100%', () => {
  it('rejects a new exam that brings the total over 100%', async () => {
    const { token } = await registerUser(app);
    const course = await createCourse(token);
    await addExam(token, course.id, { weight: 70 });

    const res = await addExam(token, course.id, { title: 'Final', weight: 40 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/100%/);
    expect(res.body.details.weight[0]).toBe('Only 30% is left for this course');
    expect(await prisma.exam.count()).toBe(1);
  });

  it('accepts exams that add up to exactly 100%', async () => {
    const { token } = await registerUser(app);
    const course = await createCourse(token);
    await addExam(token, course.id, { weight: 60 });

    const res = await addExam(token, course.id, { title: 'Final', weight: 40 });

    expect(res.status).toBe(201);
  });

  it('rejects an update that brings the total over 100%', async () => {
    const { token } = await registerUser(app);
    const course = await createCourse(token);
    await addExam(token, course.id, { weight: 50 });
    const { body: final } = await addExam(token, course.id, { title: 'Final', weight: 40 });

    const res = await request(app)
      .put(`/api/exams/${final.id}`)
      .set(auth(token))
      .send({ ...midterm, title: 'Final', weight: 60 });

    expect(res.status).toBe(400);
    const saved = await prisma.exam.findUnique({ where: { id: final.id } });
    expect(saved.weight).toBe(40);
  });

  it('does not count the old weight of the exam being updated', async () => {
    const { token } = await registerUser(app);
    const course = await createCourse(token);
    await addExam(token, course.id, { weight: 50 });
    const { body: final } = await addExam(token, course.id, { title: 'Final', weight: 40 });

    const res = await request(app)
      .put(`/api/exams/${final.id}`)
      .set(auth(token))
      .send({ ...midterm, title: 'Final', weight: 50 });

    expect(res.status).toBe(200);
    expect(res.body.weight).toBe(50);
  });

  it('counts the weights of each course separately', async () => {
    const { token } = await registerUser(app);
    const first = await createCourse(token);
    const second = await createCourse(token);
    await addExam(token, first.id, { weight: 80 });

    const res = await addExam(token, second.id, { weight: 80 });

    expect(res.status).toBe(201);
  });
});

describe('exam validation', () => {
  it('returns field errors for an empty exam and saves nothing', async () => {
    const { token } = await registerUser(app);
    const course = await createCourse(token);

    const res = await request(app)
      .post(`/api/courses/${course.id}/exams`)
      .set(auth(token))
      .send({});

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.details)).toEqual(
      expect.arrayContaining(['title', 'type', 'date', 'weight']),
    );
    expect(await prisma.exam.count()).toBe(0);
  });

  it('rejects an unknown type, a bad date and a grade over 100', async () => {
    const { token } = await registerUser(app);
    const course = await createCourse(token);

    const res = await addExam(token, course.id, { type: 'lab', date: 'tomorrow', grade: 120 });

    expect(res.status).toBe(400);
    expect(res.body.details.type).toBeDefined();
    expect(res.body.details.date[0]).toBe('Date is not valid');
    expect(res.body.details.grade[0]).toBe('Grade cannot be more than 100');
  });

  it('treats an empty grade as not graded yet', async () => {
    const { token } = await registerUser(app);
    const course = await createCourse(token);

    const res = await addExam(token, course.id, { type: 'assignment', grade: '' });

    expect(res.status).toBe(201);
    expect(res.body.grade).toBeNull();
  });

  it('returns 404 for an unknown course or exam id', async () => {
    const { token } = await registerUser(app);

    const course = await addExam(token, 9999);
    const exam = await request(app).get('/api/exams/abc').set(auth(token));

    expect(course.status).toBe(404);
    expect(exam.status).toBe(404);
  });
});

describe('TC-14: users cannot see or change the exams of others', () => {
  it('returns 404 to another user for every exam endpoint', async () => {
    const owner = await registerUser(app);
    const other = await registerUser(app);
    const course = await createCourse(owner.token);
    const { body: exam } = await addExam(owner.token, course.id);

    const responses = await Promise.all([
      request(app).get(`/api/courses/${course.id}/exams`).set(auth(other.token)),
      addExam(other.token, course.id),
      request(app).get(`/api/exams/${exam.id}`).set(auth(other.token)),
      request(app)
        .put(`/api/exams/${exam.id}`)
        .set(auth(other.token))
        .send({ ...midterm, weight: 10 }),
      request(app).delete(`/api/exams/${exam.id}`).set(auth(other.token)),
    ]);

    expect(responses.map((r) => r.status)).toEqual([404, 404, 404, 404, 404]);
    const saved = await prisma.exam.findMany();
    expect(saved).toHaveLength(1);
    expect(saved[0].weight).toBe(30);
  });
});
