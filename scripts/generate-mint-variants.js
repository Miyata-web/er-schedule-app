const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const outDir = path.join(__dirname, "../public/icons/options");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const SIZE = 512;
const R = 88;

// ── 淡いミントグリーン背景（少し明るく） ──
const BG1 = "#4dd4a4";
const BG2 = "#28a87c";

// ── 各種エレメントカラー ──
const SCHEMES = [
  { name: "white",     c1: "#ffffff",   op: [1, 0.70, 0.35], label: "ホワイト" },
  { name: "silver",    c1: "#b8c8d8",   op: [1, 0.72, 0.36], label: "シルバー" },
  { name: "chrome",    c1: "#e2e4e8",   op: [1, 0.68, 0.32], label: "クローム" },
  { name: "gold",      c1: "#c9a86c",   op: [1, 0.70, 0.34], label: "ゴールド" },
  { name: "rosegold",  c1: "#e0a898",   op: [1, 0.70, 0.34], label: "ローズゴールド" },
  { name: "copper",    c1: "#c47a4a",   op: [1, 0.72, 0.36], label: "コッパー" },
  { name: "darkgray",  c1: "#2d3748",   op: [1, 0.72, 0.40], label: "ダークグレー" },
  { name: "navy",      c1: "#1a3060",   op: [1, 0.70, 0.38], label: "ネイビー" },
];

function iconSVG(bg1, bg2, c1, ops) {
  const [o1, o2, o3] = ops;
  return `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <linearGradient id="sh" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="rgba(255,255,255,0.18)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" rx="${R}" fill="url(#bg)"/>
  <rect width="${SIZE}" height="${SIZE}" rx="${R}" fill="url(#sh)"/>

  <!-- TOP ROW -->
  <rect x="96"  y="96"  width="92"  height="64" rx="10" fill="${c1}" opacity="${o1}"/>
  <rect x="200" y="96"  width="92"  height="64" rx="10" fill="${c1}" opacity="${o1 * 0.82}"/>
  <rect x="304" y="96"  width="112" height="64" rx="10" fill="${c1}" opacity="${o1 * 0.90}"/>

  <!-- ROW 1 -->
  <rect x="96"  y="178" width="52" height="52" rx="9"  fill="${c1}" opacity="${o1 * 0.88}"/>
  <rect x="162" y="185" width="168" height="13" rx="6" fill="${c1}" opacity="${o2}"/>
  <rect x="162" y="206" width="118" height="10" rx="5" fill="${c1}" opacity="${o3}"/>
  <!-- ROW 2 -->
  <rect x="96"  y="246" width="52" height="52" rx="9"  fill="${c1}" opacity="${o1 * 0.88}"/>
  <rect x="162" y="253" width="190" height="13" rx="6" fill="${c1}" opacity="${o2}"/>
  <rect x="162" y="274" width="140" height="10" rx="5" fill="${c1}" opacity="${o3}"/>
  <!-- ROW 3 -->
  <rect x="96"  y="314" width="52" height="52" rx="9"  fill="${c1}" opacity="${o1 * 0.88}"/>
  <rect x="162" y="321" width="148" height="13" rx="6" fill="${c1}" opacity="${o2}"/>
  <rect x="162" y="342" width="100" height="10" rx="5" fill="${c1}" opacity="${o3}"/>

  <!-- CHECKMARK -->
  <text x="390" y="440" font-family="Arial" font-size="112" font-weight="900"
        fill="${c1}" opacity="${o1}" text-anchor="middle">✓</text>
</svg>`;
}

async function generate() {
  for (const s of SCHEMES) {
    const svg = iconSVG(BG1, BG2, s.c1, s.op);
    const outPath = path.join(outDir, `mint-${s.name}.png`);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`✅ ミント + ${s.label}`);
  }
}
generate().catch(console.error);
