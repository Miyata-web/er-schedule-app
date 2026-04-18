const sharp = require("sharp");
const path = require("path");

const SIZE = 512;
const r = SIZE * 0.18;

const svgs = {
  A: `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#1e3a8a"/>
  </linearGradient></defs>
  <rect width="${SIZE}" height="${SIZE}" rx="${r}" fill="url(#g)"/>
  <rect x="206" y="110" width="100" height="272" rx="18" fill="white"/>
  <rect x="110" y="206" width="292" height="100" rx="18" fill="white"/>
  <text x="256" y="440" text-anchor="middle" font-family="Arial" font-size="76" font-weight="900" letter-spacing="8" fill="white" opacity="0.9">ER</text>
</svg>`,

  B: `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#ef4444"/><stop offset="100%" stop-color="#991b1b"/>
  </linearGradient></defs>
  <rect width="${SIZE}" height="${SIZE}" rx="${r}" fill="url(#g)"/>
  <rect x="206" y="110" width="100" height="272" rx="18" fill="white"/>
  <rect x="110" y="206" width="292" height="100" rx="18" fill="white"/>
  <text x="256" y="440" text-anchor="middle" font-family="Arial" font-size="76" font-weight="900" letter-spacing="8" fill="white" opacity="0.9">ER</text>
</svg>`,

  C: `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#1e293b"/><stop offset="100%" stop-color="#0f172a"/>
  </linearGradient></defs>
  <rect width="${SIZE}" height="${SIZE}" rx="${r}" fill="url(#g)"/>
  <rect x="206" y="110" width="100" height="272" rx="18" fill="#22d3ee"/>
  <rect x="110" y="206" width="292" height="100" rx="18" fill="#22d3ee"/>
  <text x="256" y="440" text-anchor="middle" font-family="Arial" font-size="76" font-weight="900" letter-spacing="8" fill="#22d3ee">ER</text>
</svg>`,

  D: `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#059669"/><stop offset="100%" stop-color="#065f46"/>
  </linearGradient></defs>
  <rect width="${SIZE}" height="${SIZE}" rx="${r}" fill="url(#g)"/>
  <rect x="206" y="110" width="100" height="272" rx="18" fill="white"/>
  <rect x="110" y="206" width="292" height="100" rx="18" fill="white"/>
  <text x="256" y="440" text-anchor="middle" font-family="Arial" font-size="76" font-weight="900" letter-spacing="8" fill="white" opacity="0.9">ER</text>
</svg>`,
};

// Label SVG overlay
const labelSvg = (letter, color) =>
  `<svg width="512" height="80" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="80" fill="#f8fafc"/>
  <text x="256" y="56" text-anchor="middle" font-family="Arial" font-size="42" font-weight="bold" fill="${color}">${letter}</text>
</svg>`;

const ICON = 200;  // icon display size
const PAD  = 24;
const LABEL_H = 40;
const COLS = 4;

const totalW = COLS * ICON + (COLS + 1) * PAD;
const totalH = ICON + LABEL_H + PAD * 3;

async function generate() {
  // Render each icon to a buffer at ICON×ICON
  const icons = {};
  for (const [key, svg] of Object.entries(svgs)) {
    icons[key] = await sharp(Buffer.from(svg)).resize(ICON, ICON).png().toBuffer();
  }

  const labels = { A: "#1e3a8a", B: "#991b1b", C: "#0e7490", D: "#065f46" };
  const labelBufs = {};
  for (const [key, color] of Object.entries(labels)) {
    labelBufs[key] = await sharp(Buffer.from(labelSvg(key, color)))
      .resize(ICON, LABEL_H)
      .png()
      .toBuffer();
  }

  const composites = [];
  const keys = ["A", "B", "C", "D"];

  keys.forEach((key, i) => {
    const x = PAD + i * (ICON + PAD);
    composites.push({ input: icons[key],     top: PAD,               left: x });
    composites.push({ input: labelBufs[key], top: PAD + ICON + 4,   left: x });
  });

  const outPath = path.join(__dirname, "../public/icons/options/comparison.png");
  await sharp({
    create: { width: totalW, height: totalH, channels: 4, background: { r: 248, g: 250, b: 252, alpha: 1 } }
  })
    .composite(composites)
    .png()
    .toFile(outPath);

  console.log("✅ comparison.png generated →", outPath);
}

generate().catch(console.error);
