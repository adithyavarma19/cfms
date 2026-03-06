const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '24h';
process.env.CORS_ORIGIN = 'https://feedback.example.edu';

const pool = require('../src/config/db');
pool.query = async (sql) => {
  if (String(sql).includes('FROM auth_users')) {
    return { rows: [] };
  }
  return { rows: [] };
};

const { createApp, buildCorsOptions } = require('../src/index');
const { validateProductionEnv } = require('../src/config/env');
const { canAccessStudentByUser } = require('../src/routes/students');

async function withServer(app, fn) {
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
}

test('validateProductionEnv returns missing vars in production', () => {
  const missing = validateProductionEnv({ NODE_ENV: 'production', DB_HOST: 'x' });
  assert.ok(missing.includes('DB_PORT'));
  assert.ok(missing.includes('JWT_SECRET'));
});

test('CORS options allow configured origin and reject unknown origin in production', async () => {
  const originalEnv = { ...process.env };
  process.env.NODE_ENV = 'production';
  process.env.CORS_ORIGIN = 'https://feedback.example.edu';
  const opts = buildCorsOptions();
  await new Promise((resolve, reject) => {
    opts.origin('https://feedback.example.edu', (allowErr, allowResult) => {
      try {
        assert.equal(allowErr, null);
        assert.equal(allowResult, true);
      } catch (err) {
        reject(err);
        return;
      }

      opts.origin('https://evil.example.com', (denyErr) => {
        try {
          assert.ok(denyErr);
          assert.equal(denyErr.message, 'CORS_ORIGIN_BLOCKED');
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  });
  process.env.NODE_ENV = originalEnv.NODE_ENV;
  process.env.CORS_ORIGIN = originalEnv.CORS_ORIGIN;
});

test('canAccessStudentByUser allows admin and self, blocks other users', () => {
  assert.equal(canAccessStudentByUser({ id: 'u1', role: 'admin' }, 'u2'), true);
  assert.equal(canAccessStudentByUser({ id: 'u1', role: 'student' }, 'u1'), true);
  assert.equal(canAccessStudentByUser({ id: 'u1', role: 'student' }, 'u2'), false);
});

test('register endpoint requires auth', async () => {
  const app = createApp();
  const response = await withServer(app, async (baseUrl) => fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ loginId: 'newuser', password: 'password123' }),
  }));
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.error, 'No token provided');
});

test('register endpoint blocks non-admin role', async () => {
  const app = createApp();
  const token = jwt.sign({ id: 's1', role: 'student' }, process.env.JWT_SECRET);
  const response = await withServer(app, async (baseUrl) => fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ loginId: 'newuser', password: 'password123' }),
  }));

  assert.equal(response.status, 403);
});

test('login payload validation returns 400', async () => {
  const app = createApp();
  const response = await withServer(app, async (baseUrl) => fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ loginId: '', password: '' }),
  }));
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, 'Validation failed');
});

test('login endpoint rate limits after 10 attempts in 15 minutes', async () => {
  const app = createApp();
  let lastStatus = 0;
  await withServer(app, async (baseUrl) => {
    for (let i = 0; i < 11; i += 1) {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ loginId: 'user1', password: 'password123' }),
      });
      lastStatus = response.status;
    }
  });
  assert.equal(lastStatus, 429);
});

test('students by-user blocks access for different student id before DB usage', async () => {
  const app = createApp();
  const token = jwt.sign({ id: 'student-a', role: 'student' }, process.env.JWT_SECRET);
  const response = await withServer(app, async (baseUrl) => fetch(`${baseUrl}/api/students/by-user/student-b`, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${token}`,
    },
  }));

  assert.equal(response.status, 403);
});
