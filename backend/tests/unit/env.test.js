const { checkProductionEnv, corsOrigins, MIN_SECRET_LENGTH } = require('../../src/lib/env');

const goodEnv = {
  NODE_ENV: 'production',
  DATABASE_URL: 'file:/data/app.db',
  JWT_SECRET: 'x'.repeat(MIN_SECRET_LENGTH),
  CORS_ORIGIN: 'https://exam-tracker.vercel.app',
};

describe('checkProductionEnv', () => {
  it('does not check anything outside production', () => {
    expect(checkProductionEnv({})).toEqual([]);
    expect(checkProductionEnv({ NODE_ENV: 'development', JWT_SECRET: 'change-me' })).toEqual([]);
  });

  it('accepts good production settings', () => {
    expect(checkProductionEnv(goodEnv)).toEqual([]);
  });

  it('needs a database address', () => {
    expect(checkProductionEnv({ ...goodEnv, DATABASE_URL: '' })).toEqual([
      'DATABASE_URL is not set',
    ]);
  });

  it('rejects the example secrets', () => {
    for (const secret of ['change-me', 'test-secret']) {
      expect(checkProductionEnv({ ...goodEnv, JWT_SECRET: secret })).toEqual([
        'JWT_SECRET is still the example value',
      ]);
    }
  });

  it('rejects a short or missing secret', () => {
    const message = `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters`;
    expect(checkProductionEnv({ ...goodEnv, JWT_SECRET: 'short' })).toEqual([message]);
    expect(checkProductionEnv({ ...goodEnv, JWT_SECRET: undefined })).toEqual([message]);
  });

  it('rejects a missing CORS origin and the * origin', () => {
    const message = 'CORS_ORIGIN must be the address of the frontend, not *';
    expect(checkProductionEnv({ ...goodEnv, CORS_ORIGIN: undefined })).toEqual([message]);
    expect(checkProductionEnv({ ...goodEnv, CORS_ORIGIN: ' * ' })).toEqual([message]);
  });

  it('lists every problem at once', () => {
    expect(checkProductionEnv({ NODE_ENV: 'production' })).toHaveLength(3);
  });
});

describe('corsOrigins', () => {
  it('allows every origin when nothing is set', () => {
    expect(corsOrigins(undefined)).toBe('*');
    expect(corsOrigins('')).toBe('*');
    expect(corsOrigins('*')).toBe('*');
  });

  it('returns one origin as a string', () => {
    expect(corsOrigins('http://localhost:5173')).toBe('http://localhost:5173');
  });

  it('splits a comma separated list and removes spaces and trailing slashes', () => {
    expect(corsOrigins('https://a.vercel.app/, http://localhost:5173 ,')).toEqual([
      'https://a.vercel.app',
      'http://localhost:5173',
    ]);
  });
});
