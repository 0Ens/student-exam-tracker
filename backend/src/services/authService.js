const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const config = require('../config');
const { HttpError } = require('../middleware/errors');

const SALT_ROUNDS = 10;

function toPublicUser(user) {
  return { id: user.id, email: user.email, name: user.name };
}

function signToken(user) {
  return jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

async function register({ name, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, 'E-mail is already registered');
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });
  return { token: signToken(user), user: toPublicUser(user) };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) {
    throw new HttpError(401, 'Invalid e-mail or password');
  }
  return { token: signToken(user), user: toPublicUser(user) };
}

module.exports = { register, login, toPublicUser };
