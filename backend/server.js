// Local development entry point.
// Mounts the API at /api to mirror the Netlify redirect: /api/* → function.
require('dotenv').config();
const express = require('express');
const path = require('path');
const { app, seedStaff } = require('./app');

const localServer = express();

// API routes at /api (same URL structure as in production via Netlify redirect)
localServer.use('/api', app);

// Serve built frontend for local full-stack testing
localServer.use(express.static(path.join(__dirname, '../frontend/dist')));
localServer.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'), (err) => {
    if (err) res.status(404).send('Frontend ni zgrajen. Zaženite: cd frontend && npm run build');
  });
});

async function start() {
  await seedStaff();
  const PORT = process.env.PORT || 3001;
  localServer.listen(PORT, () => {
    console.log(`\n🌸 GlowLoyalty strežnik deluje na http://localhost:${PORT}`);
    console.log(`   Osebje:  osebje@salon.si  /  osebje123\n`);
  });
}

start().catch(console.error);
