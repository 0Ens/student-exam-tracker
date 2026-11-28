require('dotenv').config({ quiet: true });
const { exitOnInvalidEnv } = require('./lib/env');

// Stop early with a clear message instead of running with unsafe settings.
exitOnInvalidEnv(process.env);

const { createApp } = require('./app');

const port = process.env.PORT || 4000;

createApp().listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
