const serverless = require('serverless-http');
const { app, seedStaff } = require('../../backend/app');

// Seed staff account on cold start (idempotent — safe to run every time)
seedStaff().catch(console.error);

exports.handler = serverless(app);
