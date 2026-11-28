require('dotenv').config({ quiet: true });
const { checkProductionEnv } = require('./lib/env');

// Stop early with a clear message instead of running with unsafe settings.
const problems = checkProductionEnv(process.env);
if (problems.length > 0) {
  console.error(`The production settings are not valid:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}

const { createApp } = require('./app');

const port = process.env.PORT || 4000;

createApp().listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
