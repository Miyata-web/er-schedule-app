const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const outDir = path.join(__dirname, "../public/icons/options");
const SIZE = 512;
const R = 88;

// W-3 element color (white with slight green tint)
const C1 = "#f0f8f4";
const O1 = 1.00, O2 = 0.78, O3 = 0.40;

function iconSVG(gradientDef) {
  return `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${gradientDef}
    <linearGradient id="sh" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="rgba(255,255,255,0.20)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" rx="${R}" fill="url(#bg)"/>
  <rect width="${SIZE}" height="${SIZE}" rx="${R}" fill="url(#sh)"/>

  <!-- TOP ROW -->
  <rect x="96"  y="96"  width="92"  height="64" rx="10" fill="${C1}" opacity="${O1}"/>
  <rect x="200" y="96"  width="92"  height="64" rx="10" fill="${C1}" opacity="${O1 * 0.82}"/>
  <rect x="304" y="96"  width="112" height="64" rx="10" fill="${C1}" opacity="${O1 * 0.90}"/>
  <!-- ROW 1 -->
  <rect x="96"  y="178" width="52"  height="52" rx="9"  fill="${C1}" opacity="${O1 * 0.88}"/>
  <rect x="162" y="185" width="168" height="13" rx="6"  fill="${C1}" opacity="${O2}"/>
  <rect x="162" y="206" width="118" height="10" rx="5"  fill="${C1}" opacity="${O3}"/>
  <!-- ROW 2 -->
  <rect x="96"  y="246" width="52"  height="52" rx="9"  fill="${C1}" opacity="${O1 * 0.88}"/>
  <rect x="162" y="253" width="190" height="13" rx="6"  fill="${C1}" opacity="${O2}"/>
  <rect x="162" y="274" width="140" height="10" rx="5"  fill="${C1}" opacity="${O3}"/>
  <!-- ROW 3 -->
  <rect x="96"  y="314" width="52"  height="52" rx="9"  fill="${C1}" opacity="${O1 * 0.88}"/>
  <rect x="162" y="321" width="148" height="13" rx="6"  fill="${C1}" opacity="${O2}"/>
  <rect x="162" y="342" width="100" height="10" rx="5"  fill="${C1}" opacity="${O3}"/>
  <!-- CHECKMARK -->
  <text x="390" y="440" font-family="Arial" font-size="112" font-weight="900"
        fill="${C1}" opacity="${O1}" text-anchor="middle">✓</text>
</svg>`;
}

const variants = [
  {
    name: "grad-1_mint-teal",
    label: "ミント → ディープティール\n（斜め）",
    grad: `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#7eeac8"/>
      <stop offset="100%" stop-color="#0d7a5a"/>
    </linearGradient>`,
  },
  {
    name: "grad-2_sky-mint",
    label: "スカイブルー → ミント\n（斜め）",
    grad: `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#60c8e8"/>
      <stop offset="100%" stop-color="#28c88a"/>
    </linearGradient>`,
  },
  {
    name: "grad-3_lime-mint",
    label: "ライム → ミント\n（斜め）",
    grad: `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#88e060"/>
      <stop offset="100%" stop-color="#28a87c"/>
    </linearGradient>`,
  },
  {
    name: "grad-4_white-mint",
    label: "ホワイト → ミント\n（上から下）",
    grad: `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#c8f5e8"/>
      <stop offset="100%" stop-color="#1ea878"/>
    </linearGradient>`,
  },
  {
    name: "grad-5_mint-purple",
    label: "ミント → パープル\n（斜め）",
    grad: `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#4dd4a4"/>
      <stop offset="100%" stop-color="#7c4daf"/>
    </linearGradient>`,
  },
  {
    name: "grad-6_mint-ocean",
    label: "ミント → オーシャンブルー\n（斜め）",
    grad: `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#4dd4a4"/>
      <stop offset="100%" stop-color="#1a5ea8"/>
    </linearGradient>`,
  },
  {
    name: "grad-7_radial",
    label: "放射グラデーション\nライト → ダーク",
    grad: `<radialGradient id="bg" cx="35%" cy="35%" r="70%">
      <stop offset="0%"   stop-color="#7eeac8"/>
      <stop offset="100%" stop-color="#0a6648"/>
    </radialGradient>`,
  },
  {
    name: "grad-8_tricolor",
    label: "3色グラデーション\n水色 → ミント → エメラルド",
    grad: `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#70d8f0"/>
      <stop offset="50%"  stop-color="#4dd4a4"/>
      <stop offset="100%" stop-color="#0a8c5a"/>
    </linearGradient>`,
  },
];

async function generate() {
  for (const v of variants) {
    const svg = iconSVG(v.grad);
    const out = path.join(outDir, `${v.name}.png`);
    await sharp(Buffer.from(svg)).png().toFile(out);
    console.log(`✅ ${v.label.replace("\n", " ")}`);
  }
}
generate().catch(console.error);
