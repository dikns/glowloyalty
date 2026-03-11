// Generates PWA icon PNGs from the SVG logo using sharp.
// Run: node generate-icons.js
const sharp = require('sharp');
const path = require('path');

const src = path.join(__dirname, 'frontend/public/icons/logo.svg');
const out = path.join(__dirname, 'frontend/public/icons');

const sizes = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192x192.png',     size: 192 },
  { name: 'icon-512x512.png',     size: 512 },
];

(async () => {
  for (const { name, size } of sizes) {
    await sharp(src)
      .resize(size, size)
      .png()
      .toFile(path.join(out, name));
    console.log(`✓ ${name} (${size}x${size})`);
  }
  console.log('\nAll icons generated.');
})();
