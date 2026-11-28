// Runs before the migrations in "npm run start:prod", so a wrong setting
// stops the start before the database is touched.
require('dotenv').config({ quiet: true });
const { exitOnInvalidEnv } = require('../src/lib/env');

exitOnInvalidEnv(process.env);
