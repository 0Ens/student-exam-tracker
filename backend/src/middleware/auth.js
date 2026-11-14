const jwt = require('jsonwebtoken');
const prisma = require('../db');
const config = require('../config');
const { HttpError } = require('./errors');

// Checks the Bearer token and loads the user into req.user.
async function requireAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Authentication required'));
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    return next(new HttpError(401, 'Invalid or expired token'));
  }

  const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } });
  if (!user) {
    return next(new HttpError(401, 'Invalid or expired token'));
  }
  req.user = user;
  next();
}

module.exports = { requireAuth };
