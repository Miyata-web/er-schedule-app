const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const outDir = path.join(__dirname, "../public/icons/options");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const SIZE = 512;
const r = SIZE * 0.18;

// Option A: Navy blue + white cross + "ER" (current)
const svgA = `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" rx="${r}" fill="url(#g)"/>
  <rect x="206" y="110" width="100" height="272" rx="18" fill="white"/>
  <rect x="110" y="206" width="292" height="100" rx="18" fill="white"/>
  <text x="256" y="440" text-anchor="middle" font-family="Arial" font-size="76" font-weight="900" letter-spacing="8" fill="white" opacity="0.9">ER</text>
</svg>`;

// Option B: Red emergency theme + cross
const svgB = `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" rx="${r}" fill="url(#g)"/>
  <rect x="206" y="110" width="100" height="272" rx="18" fill="white"/>
  <rect x="110" y="206" width="292" height="100" rx="18" fill="white"/>
  <text x="256" y="440" text-anchor="middle" font-family="Arial" font-size="76" font-weight="900" letter-spacing="8" fill="white" opacity="0.9">ER</text>
</svg>`;

// Option C: Dark (black/navy) + teal cross
const svgC = `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" rx="${r}" fill="url(#g)"/>
  <rect x="206" y="110" width="100" height="272" rx="18" fill="#22d3ee"/>
  <rect x="110" y="206" width="292" height="100" rx="18" fill="#22d3ee"/>
  <text x="256" y="440" text-anchor="middle" font-family="Arial" font-size="76" font-weight="900" letter-spacing="8" fill="#22d3ee">ER</text>
</svg>`;

// Option D: Green + white cross (ambulance/medical green)
const svgD = `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#065f46"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" rx="${r}" fill="url(#g)"/>
  <rect x="206" y="110" width="100" height="272" rx="18" fill="white"/>
  <rect x="110" y="206" width="292" height="100" rx="18" fill="white"/>
  <text x="256" y="440" text-anchor="middle" font-family="Arial" font-size="76" font-weight="900" letter-spacing="8" fill="white" opacity="0.9">ER</text>
</svg>`;

async function generate() {
  const options = [
    { name: "A_navy-blue", svg: svgA },
    { name: "B_red-emergency", svg: svgB },
    { name: "C_dark-teal", svg: svgC },
    { name: "D_green-medical", svg: svgD },
  ];

  for (const opt of options) {
    const outPath = path.join(outDir, `option-${opt.name}.png`);
    await sharp(Buffer.from(opt.svg)).png().toFile(outPath);
    console.log(`✅ ${opt.name}`);
  }
}

generate().catch(console.error);
