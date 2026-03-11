const serverless = require('serverless-http');
const { app, seedStaff } = require('../../backend/app');

seedStaff().catch(console.error);

const handler = serverless(app);

exports.handler = async (event, context) => {
  // Netlify can pass the path in several forms depending on how the redirect fires:
  //   /.netlify/functions/api/auth/login  (full rewritten URL)
  //   /api/auth/login                     (original request path preserved)
  //   /auth/login                         (splat only — ideal)
  // Normalise to what Express expects: /auth/login, /customer/profile, etc.
  let path = event.path || '/';
  path = path.replace(/^\/.netlify\/functions\/[^/]+/, ''); // strip function prefix
  path = path.replace(/^\/api/, '');                        // strip /api prefix
  if (!path.startsWith('/')) path = '/' + path;
  if (path === '') path = '/';

  return handler({ ...event, path }, context);
};
