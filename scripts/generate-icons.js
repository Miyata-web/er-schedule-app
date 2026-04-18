const sharp = require("sharp");
const path = require("path");

// ER Schedule app icon SVG
// Navy blue background + white hospital cross + "ER" text
const createSvg = (size) => {
  const r = size * 0.16; // corner radius
  const crossW = size * 0.18; // cross arm width
  const crossH = size * 0.52; // cross arm height
  const cx = size / 2;
  const cy = size * 0.46;

  // Cross arms
  const vx = cx - crossW / 2;
  const vy = cy - crossH / 2;
  const hx = cx - crossH / 2;
  const hy = cy - crossW / 2;

  // ER text
  const fontSize = size * 0.15;
  const textY = cy + crossH / 2 + fontSize * 1.1;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${r}" fill="#1e3a8a"/>

  <!-- Subtle gradient overlay -->
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2563eb" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#1e3a8a" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>

  <!-- Hospital cross -->
  <rect x="${vx}" y="${vy}" width="${crossW}" height="${crossH}" rx="${crossW * 0.25}" fill="white"/>
  <rect x="${hx}" y="${hy}" width="${crossH}" height="${crossW}" rx="${crossW * 0.25}" fill="white"/>

  <!-- "ER" text -->
  <text
    x="${cx}"
    y="${textY}"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${fontSize}"
    font-weight="900"
    letter-spacing="${fontSize * 0.1}"
    fill="white"
    opacity="0.92"
  >ER</text>
</svg>`;
};

async function generateIcons() {
  const sizes = [192, 512];
  const outDir = path.join(__dirname, "../public/icons");

  for (const size of sizes) {
    const svg = Buffer.from(createSvg(size));
    const outPath = path.join(outDir, `icon-${size}x${size}.png`);

    await sharp(svg)
      .png()
      .toFile(outPath);

    console.log(`✅ Generated ${size}x${size} icon → ${outPath}`);
  }

  // Also generate a small favicon-style icon
  const svg32 = Buffer.from(createSvg(32));
  await sharp(svg32).png().toFile(path.join(outDir, "icon-32x32.png"));
  console.log("✅ Generated 32x32 icon");
}

generateIcons().catch(console.error);
