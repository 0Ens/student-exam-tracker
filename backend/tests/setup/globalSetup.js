const { execSync } = require('child_process');
const path = require('path');

// Recreate the test database from the migrations once before the test run.
module.exports = async () => {
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', {
    cwd: path.join(__dirname, '..', '..'),
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'ignore',
  });
};
