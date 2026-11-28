// Settings that must be right before the API runs in production (WBS 6.1).

const MIN_SECRET_LENGTH = 32;
const EXAMPLE_SECRETS = ['change-me', 'test-secret'];

// Returns a list of problems. An empty list means the settings are fine.
// Outside production nothing is checked, so local development stays simple.
function checkProductionEnv(env) {
  if (env.NODE_ENV !== 'production') return [];

  const problems = [];
  if (!env.DATABASE_URL) {
    problems.push('DATABASE_URL is not set');
  }
  const secret = env.JWT_SECRET || '';
  if (EXAMPLE_SECRETS.includes(secret)) {
    problems.push('JWT_SECRET is still the example value');
  } else if (secret.length < MIN_SECRET_LENGTH) {
    problems.push(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
  }
  if (!env.CORS_ORIGIN || env.CORS_ORIGIN.trim() === '*') {
    problems.push('CORS_ORIGIN must be the address of the frontend, not *');
  }
  return problems;
}

// CORS_ORIGIN can hold one address or a comma separated list
// (for example the Vercel site and localhost). Empty or * allows every origin.
function corsOrigins(value) {
  if (!value || value.trim() === '*') return '*';
  const list = value
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return list.length === 1 ? list[0] : list;
}

module.exports = { checkProductionEnv, corsOrigins, MIN_SECRET_LENGTH };
