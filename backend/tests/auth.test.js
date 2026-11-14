const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createApp } = require('../src/app');
const { prisma, resetDb, registerUser } = require('./helpers');

const app = createApp();

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('POST /api/auth/register', () => {
  it('TC-01: creates an account with valid data and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ayse', email: 'Ayse@Example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toEqual({
      id: expect.any(Number),
      name: 'Ayse',
      email: 'ayse@example.com',
    });
    expect(res.body.user.passwordHash).toBeUndefined();

    const saved = await prisma.user.findUnique({ where: { email: 'ayse@example.com' } });
    expect(saved.passwordHash).not.toBe('password123');
  });

  it('TC-02: rejects an e-mail that already exists', async () => {
    await registerUser(app, { email: 'taken@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Other', email: 'taken@example.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
    expect(await prisma.user.count()).toBe(1);
  });

  it('rejects invalid input with field errors', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.details)).toEqual(
      expect.arrayContaining(['name', 'email', 'password']),
    );
    expect(await prisma.user.count()).toBe(0);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with the correct password', async () => {
    const { user, password } = await registerUser(app);

    const res = await request(app).post('/api/auth/login').send({ email: user.email, password });

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('TC-04: rejects a wrong password', async () => {
    const { user } = await registerUser(app);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid e-mail or password');
    expect(res.body.token).toBeUndefined();
  });

  it('gives the same error for an unknown e-mail', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid e-mail or password');
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user for a valid token', async () => {
    const { token, user } = await registerUser(app);

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual(user);
  });

  it('TC-03: denies access without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('TC-04: denies access after logout (token discarded or invalid)', async () => {
    const bad = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-token');
    expect(bad.status).toBe(401);

    const expired = jwt.sign({ sub: 1 }, process.env.JWT_SECRET, { expiresIn: -10 });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  it('denies a valid token whose user no longer exists', async () => {
    const { token } = await registerUser(app);
    await resetDb();

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
