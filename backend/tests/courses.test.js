const request = require('supertest');
const { createApp } = require('../src/app');
const { prisma, resetDb, registerUser } = require('./helpers');

const app = createApp();

const course = {
  name: 'Software Project Management',
  code: 'SWE488',
  credits: 3,
  term: '2026 Fall',
};

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

async function createCourse(token, overrides = {}) {
  const res = await request(app)
    .post('/api/courses')
    .set(auth(token))
    .send({ ...course, ...overrides });
  return res.body;
}

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('courses require login', () => {
  it('TC-03: rejects requests without a token', async () => {
    const res = await request(app).get('/api/courses');
    expect(res.status).toBe(401);
  });
});

describe('TC-05: add, edit and delete a course', () => {
  it('creates a course for the logged-in user', async () => {
    const { token, user } = await registerUser(app);

    const res = await request(app).post('/api/courses').set(auth(token)).send(course);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ ...course, id: expect.any(Number), userId: user.id });
  });

  it('lists only the courses of the logged-in user', async () => {
    const a = await registerUser(app);
    const b = await registerUser(app);
    await createCourse(a.token, { name: 'Algorithms', code: 'CS201' });
    await createCourse(a.token);
    await createCourse(b.token, { name: 'Other student course' });

    const res = await request(app).get('/api/courses').set(auth(a.token));

    expect(res.status).toBe(200);
    expect(res.body.map((c) => c.name)).toEqual(['Algorithms', 'Software Project Management']);
  });

  it('returns a single course', async () => {
    const { token } = await registerUser(app);
    const created = await createCourse(token);

    const res = await request(app).get(`/api/courses/${created.id}`).set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.code).toBe('SWE488');
  });

  it('updates a course', async () => {
    const { token } = await registerUser(app);
    const created = await createCourse(token);

    const res = await request(app)
      .put(`/api/courses/${created.id}`)
      .set(auth(token))
      .send({ ...course, name: 'SPM', credits: 4 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: created.id, name: 'SPM', credits: 4 });
    const saved = await prisma.course.findUnique({ where: { id: created.id } });
    expect(saved.name).toBe('SPM');
  });

  it('deletes a course together with its exams', async () => {
    const { token } = await registerUser(app);
    const created = await createCourse(token);
    await prisma.exam.create({
      data: {
        title: 'Midterm',
        type: 'exam',
        date: new Date('2026-11-10'),
        weight: 40,
        courseId: created.id,
      },
    });

    const res = await request(app).delete(`/api/courses/${created.id}`).set(auth(token));

    expect(res.status).toBe(204);
    expect(await prisma.course.count()).toBe(0);
    expect(await prisma.exam.count()).toBe(0);
  });

  it('returns 404 for a course that does not exist', async () => {
    const { token } = await registerUser(app);

    for (const id of ['9999', 'abc']) {
      const res = await request(app).get(`/api/courses/${id}`).set(auth(token));
      expect(res.status).toBe(404);
    }
  });
});

describe('TC-06: course validation', () => {
  it('rejects a course without a name and saves nothing', async () => {
    const { token } = await registerUser(app);

    const res = await request(app)
      .post('/api/courses')
      .set(auth(token))
      .send({ ...course, name: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.details.name).toContain('Name is required');
    expect(await prisma.course.count()).toBe(0);
  });

  it('rejects invalid credits and missing fields', async () => {
    const { token } = await registerUser(app);

    const res = await request(app)
      .post('/api/courses')
      .set(auth(token))
      .send({ name: 'Physics', credits: 2.5 });

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.details).sort()).toEqual(['code', 'credits', 'term']);
    expect(await prisma.course.count()).toBe(0);
  });

  it('does not change a course when the update is invalid', async () => {
    const { token } = await registerUser(app);
    const created = await createCourse(token);

    const res = await request(app)
      .put(`/api/courses/${created.id}`)
      .set(auth(token))
      .send({ ...course, name: '' });

    expect(res.status).toBe(400);
    const saved = await prisma.course.findUnique({ where: { id: created.id } });
    expect(saved.name).toBe(course.name);
  });
});

describe("TC-14: a user cannot access another user's course", () => {
  it('returns 404 to user B for GET, PUT and DELETE and leaves the data unchanged', async () => {
    const a = await registerUser(app);
    const b = await registerUser(app);
    const owned = await createCourse(a.token);
    const url = `/api/courses/${owned.id}`;

    const get = await request(app).get(url).set(auth(b.token));
    const put = await request(app)
      .put(url)
      .set(auth(b.token))
      .send({ ...course, name: 'Hacked' });
    const del = await request(app).delete(url).set(auth(b.token));

    expect([get.status, put.status, del.status]).toEqual([404, 404, 404]);
    const saved = await prisma.course.findUnique({ where: { id: owned.id } });
    expect(saved).toMatchObject({ name: course.name, userId: a.user.id });
  });
});
