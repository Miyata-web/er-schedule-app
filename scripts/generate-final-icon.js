const sharp = require("sharp");
const path = require("path");

const outDir = path.join(__dirname, "../public/icons");

const C1 = "#f0f8f4";
const O1 = 1.00, O2 = 0.78, O3 = 0.40;

function iconSVG(size) {
  const R = Math.round(size * 0.172);
  const scale = size / 512;
  const s = (n) => Math.round(n * scale);

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#4dd4a4"/>
      <stop offset="100%" stop-color="#1a5ea8"/>
    </linearGradient>
    <linearGradient id="sh" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="rgba(255,255,255,0.20)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${R}" fill="url(#bg)"/>
  <rect width="${size}" height="${size}" rx="${R}" fill="url(#sh)"/>

  <!-- TOP ROW -->
  <rect x="${s(96)}"  y="${s(96)}"  width="${s(92)}"  height="${s(64)}" rx="${s(10)}" fill="${C1}" opacity="${O1}"/>
  <rect x="${s(200)}" y="${s(96)}"  width="${s(92)}"  height="${s(64)}" rx="${s(10)}" fill="${C1}" opacity="${0.82}"/>
  <rect x="${s(304)}" y="${s(96)}"  width="${s(112)}" height="${s(64)}" rx="${s(10)}" fill="${C1}" opacity="${0.90}"/>

  <!-- ROW 1 -->
  <rect x="${s(96)}"  y="${s(178)}" width="${s(52)}"  height="${s(52)}" rx="${s(9)}"  fill="${C1}" opacity="${0.88}"/>
  <rect x="${s(162)}" y="${s(185)}" width="${s(168)}" height="${s(13)}" rx="${s(6)}"  fill="${C1}" opacity="${O2}"/>
  <rect x="${s(162)}" y="${s(206)}" width="${s(118)}" height="${s(10)}" rx="${s(5)}"  fill="${C1}" opacity="${O3}"/>
  <!-- ROW 2 -->
  <rect x="${s(96)}"  y="${s(246)}" width="${s(52)}"  height="${s(52)}" rx="${s(9)}"  fill="${C1}" opacity="${0.88}"/>
  <rect x="${s(162)}" y="${s(253)}" width="${s(190)}" height="${s(13)}" rx="${s(6)}"  fill="${C1}" opacity="${O2}"/>
  <rect x="${s(162)}" y="${s(274)}" width="${s(140)}" height="${s(10)}" rx="${s(5)}"  fill="${C1}" opacity="${O3}"/>
  <!-- ROW 3 -->
  <rect x="${s(96)}"  y="${s(314)}" width="${s(52)}"  height="${s(52)}" rx="${s(9)}"  fill="${C1}" opacity="${0.88}"/>
  <rect x="${s(162)}" y="${s(321)}" width="${s(148)}" height="${s(13)}" rx="${s(6)}"  fill="${C1}" opacity="${O2}"/>
  <rect x="${s(162)}" y="${s(342)}" width="${s(100)}" height="${s(10)}" rx="${s(5)}"  fill="${C1}" opacity="${O3}"/>

  <!-- CHECKMARK -->
  <text x="${s(390)}" y="${s(440)}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${s(112)}" font-weight="900"
        fill="${C1}" opacity="${O1}" text-anchor="middle">✓</text>
</svg>`;
}

async function generate() {
  for (const size of [512, 192, 32]) {
    const svg = iconSVG(size);
    const out = path.join(outDir, `icon-${size}x${size}.png`);
    await sharp(Buffer.from(svg)).png().toFile(out);
    console.log(`✅ icon-${size}x${size}.png`);
  }
}
generate().catch(console.error);
