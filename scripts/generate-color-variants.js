const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const outDir = path.join(__dirname, "../public/icons/options");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const SIZE = 512;
const R = 88;

// ── element color schemes ──────────────────────────────────────
const GOLD   = { c1:"#c9a86c", c2:"rgba(201,168,108,0.65)", c3:"rgba(201,168,108,0.30)" };
const SILVER = { c1:"#a8b8cc", c2:"rgba(168,184,204,0.62)", c3:"rgba(168,184,204,0.28)" };
const CHROME = { c1:"#e8e8ea", c2:"rgba(232,232,234,0.65)", c3:"rgba(232,232,234,0.28)" };

function iconSVG(bg1, bg2, scheme, label) {
  const { c1, c2, c3 } = scheme;
  return `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="rgba(255,255,255,0.14)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${SIZE}" height="${SIZE}" rx="${R}" fill="url(#bg)"/>
  <rect width="${SIZE}" height="${SIZE}" rx="${R}" fill="url(#shine)"/>

  <!-- TOP ROW: 3 schedule header cells -->
  <rect x="96"  y="96"  width="92"  height="64" rx="10" fill="${c1}"/>
  <rect x="200" y="96"  width="92"  height="64" rx="10" fill="${c1}" opacity="0.82"/>
  <rect x="304" y="96"  width="112" height="64" rx="10" fill="${c1}" opacity="0.90"/>

  <!-- LIST ROWS -->
  <!-- Row 1 -->
  <rect x="96"  y="178" width="52" height="52" rx="9" fill="${c1}" opacity="0.88"/>
  <rect x="162" y="185" width="168" height="13" rx="6" fill="${c1}" opacity="0.68"/>
  <rect x="162" y="206" width="118" height="10" rx="5" fill="${c1}" opacity="0.32"/>
  <!-- Row 2 -->
  <rect x="96"  y="246" width="52" height="52" rx="9" fill="${c1}" opacity="0.88"/>
  <rect x="162" y="253" width="190" height="13" rx="6" fill="${c1}" opacity="0.68"/>
  <rect x="162" y="274" width="140" height="10" rx="5" fill="${c1}" opacity="0.32"/>
  <!-- Row 3 -->
  <rect x="96"  y="314" width="52" height="52" rx="9" fill="${c1}" opacity="0.88"/>
  <rect x="162" y="321" width="148" height="13" rx="6" fill="${c1}" opacity="0.68"/>
  <rect x="162" y="342" width="100" height="10" rx="5" fill="${c1}" opacity="0.32"/>

  <!-- CHECKMARK -->
  <text x="390" y="440" font-family="Arial" font-size="112" font-weight="900"
        fill="${c1}" text-anchor="middle">✓</text>
</svg>`;
}

const variants = [
  // ── 暗い系 + シルバー ──
  { name: "dark-1_forest-silver",  bg1:"#1e3d1a", bg2:"#0d1f0c", scheme: SILVER, label:"深いグリーン＋シルバー" },
  { name: "dark-2_black-silver",   bg1:"#1e1e1e", bg2:"#080808", scheme: SILVER, label:"ブラック＋シルバー"     },
  { name: "dark-3_teal-silver",    bg1:"#0d3030", bg2:"#061818", scheme: SILVER, label:"ダークティール＋シルバー"},
  { name: "dark-4_navy-silver",    bg1:"#0d1a38", bg2:"#060e20", scheme: SILVER, label:"ディープネイビー＋シルバー"},

  // ── 明るい系 + クローム ──
  { name: "bright-1_skyblue",      bg1:"#3a9ed8", bg2:"#1a6aaa", scheme: CHROME, label:"スカイブルー＋クローム" },
  { name: "bright-2_lime",         bg1:"#72c23a", bg2:"#3e8a18", scheme: CHROME, label:"ライムグリーン＋クローム"},
  { name: "bright-3_cyan",         bg1:"#10b8d8", bg2:"#0878a0", scheme: CHROME, label:"シアン＋クローム"        },
  { name: "bright-4_mint",         bg1:"#28c88a", bg2:"#0e8858", scheme: CHROME, label:"ミント＋クローム"        },

  // ── ③⑤ ゴールドのまま（比較用）──
  { name: "ref-3_organic-gold",    bg1:"#3a5a2a", bg2:"#1e3412", scheme: GOLD,   label:"③オーガニック＋ゴールド"},
  { name: "ref-5_executive-gold",  bg1:"#2a2a2a", bg2:"#0a0a0a", scheme: GOLD,   label:"⑤エグゼクティブ＋ゴールド"},
];

async function generate() {
  for (const v of variants) {
    const svg = iconSVG(v.bg1, v.bg2, v.scheme, v.label);
    const outPath = path.join(outDir, `option-${v.name}.png`);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`✅ ${v.label}`);
  }
}
generate().catch(console.error);
