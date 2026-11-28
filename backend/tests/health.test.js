const request = require('supertest');
const { createApp } = require('../src/app');

const app = createApp();

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns 404 json for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });
});

describe('CORS', () => {
  const saved = process.env.CORS_ORIGIN;

  // Setting process.env to undefined would store the text "undefined".
  afterEach(() => {
    if (saved === undefined) delete process.env.CORS_ORIGIN;
    else process.env.CORS_ORIGIN = saved;
  });

  it('allows the origins listed in CORS_ORIGIN', async () => {
    process.env.CORS_ORIGIN = 'https://tracker.example.com, http://localhost:5173';
    const listed = createApp();

    const res = await request(listed).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const other = await request(listed)
      .get('/api/health')
      .set('Origin', 'https://evil.example.com');
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows every origin when CORS_ORIGIN is not set', async () => {
    delete process.env.CORS_ORIGIN;
    const res = await request(createApp()).get('/api/health').set('Origin', 'http://any.example');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });
});
