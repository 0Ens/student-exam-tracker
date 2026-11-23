const request = require('supertest');
const { createApp } = require('../src/app');
const { prisma, resetDb, registerUser } = require('./helpers');

const app = createApp();

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

async function createCourse(token, name, code) {
  const res = await request(app)
    .post('/api/courses')
    .set(auth(token))
    .send({ name, code, credits: 3, term: '2026 Fall' });
  return res.body;
}

async function addExam(token, courseId, title, type, date) {
  const res = await request(app)
    .post(`/api/courses/${courseId}/exams`)
    .set(auth(token))
    .send({ title, type, date, weight: 10 });
  expect(res.status).toBe(201);
  return res.body;
}

function search(token, query = '') {
  return request(app).get(`/api/exams${query}`).set(auth(token));
}

const titles = (res) => res.body.map((e) => e.title);

let token;
let algorithms;
let history;

beforeEach(async () => {
  await resetDb();
  ({ token } = await registerUser(app));
  algorithms = await createCourse(token, 'Algorithms', 'CS201');
  history = await createCourse(token, 'World History', 'HIS101');
  await addExam(token, algorithms.id, 'Final', 'exam', '2027-01-10');
  await addExam(token, algorithms.id, 'Midterm', 'exam', '2026-11-20');
  await addExam(token, algorithms.id, 'Homework 2', 'assignment', '2026-11-10');
  await addExam(token, history.id, 'Midterm essay', 'assignment', '2026-11-25');
  await addExam(token, history.id, 'Quiz 1', 'quiz', '2026-11-30');
});

afterAll(() => prisma.$disconnect());

describe('GET /api/exams (search and filter)', () => {
  it('rejects requests without a token', async () => {
    expect((await request(app).get('/api/exams')).status).toBe(401);
  });

  it('without filters returns all items sorted by date, with their course', async () => {
    const res = await search(token);
    expect(res.status).toBe(200);
    expect(titles(res)).toEqual(['Homework 2', 'Midterm', 'Midterm essay', 'Quiz 1', 'Final']);
    expect(res.body[0].course).toEqual({ id: algorithms.id, code: 'CS201', name: 'Algorithms' });
  });

  it('TC-12: filters by course and type "exam"', async () => {
    const res = await search(token, `?courseId=${algorithms.id}&type=exam`);
    expect(titles(res)).toEqual(['Midterm', 'Final']);
  });

  it('searches the title without caring about case', async () => {
    expect(titles(await search(token, '?q=midterm'))).toEqual(['Midterm', 'Midterm essay']);
  });

  it('searches the course code and name', async () => {
    expect(titles(await search(token, '?q=his1'))).toEqual(['Midterm essay', 'Quiz 1']);
    expect(titles(await search(token, '?q=algo'))).toEqual(['Homework 2', 'Midterm', 'Final']);
  });

  it('filters by a date range and includes the whole last day', async () => {
    const res = await search(token, '?from=2026-11-20&to=2026-11-30');
    expect(titles(res)).toEqual(['Midterm', 'Midterm essay', 'Quiz 1']);
  });

  it('combines text, type and dates', async () => {
    const res = await search(token, '?q=mid&type=assignment&from=2026-11-01');
    expect(titles(res)).toEqual(['Midterm essay']);
  });

  it('treats empty values as no filter', async () => {
    const res = await search(token, '?q=&type=&courseId=&from=&to=');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(5);
  });

  it('TC-13: returns an empty list when nothing matches', async () => {
    const res = await search(token, '?q=physics');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it.each([
    ['?type=lab', 'type'],
    ['?courseId=abc', 'courseId'],
    ['?courseId=-1', 'courseId'],
    ['?from=yesterday', 'from'],
    ['?from=2026-12-01&to=2026-11-01', 'to'],
    [`?q=${'a'.repeat(101)}`, 'q'],
  ])('rejects %s', async (query, field) => {
    const res = await search(token, query);
    expect(res.status).toBe(400);
    expect(res.body.details[field]).toHaveLength(1);
  });

  it('TC-14: does not find the items of another user', async () => {
    const other = await registerUser(app, { email: 'other@example.com' });
    expect((await search(other.token)).body).toEqual([]);
    expect((await search(other.token, `?courseId=${algorithms.id}`)).body).toEqual([]);
    expect((await search(other.token, '?q=Midterm')).body).toEqual([]);
  });

  it('still returns a single exam by id', async () => {
    const [first] = (await search(token)).body;
    const res = await request(app).get(`/api/exams/${first.id}`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Homework 2');
  });
});
