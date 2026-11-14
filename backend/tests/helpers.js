const request = require('supertest');
const prisma = require('../src/db');

async function resetDb() {
  await prisma.exam.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
}

let counter = 0;

// Registers a fresh user and returns its token and data.
async function registerUser(app, overrides = {}) {
  counter += 1;
  const body = {
    name: `User ${counter}`,
    email: `user${counter}@example.com`,
    password: 'password123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(body);
  return { token: res.body.token, user: res.body.user, password: body.password };
}

module.exports = { prisma, resetDb, registerUser };
