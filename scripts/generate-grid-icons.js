const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const outDir = path.join(__dirname, "../public/icons/options");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const SIZE = 512;
const R = 88;

// Gold/warm icon color that works on all backgrounds
const GOLD = "#c9a86c";
const GOLD2 = "rgba(201,168,108,0.65)";
const GOLD3 = "rgba(201,168,108,0.35)";

const iconContent = (bg1, bg2) => `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.12)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="${SIZE}" height="${SIZE}" rx="${R}" fill="url(#bg)"/>
  <rect width="${SIZE}" height="${SIZE}" rx="${R}" fill="url(#shine)"/>

  <!-- ── TOP ROW: 3 header cells (like schedule column headers) ── -->
  <rect x="96"  y="96"  width="92" height="64" rx="10" fill="${GOLD}"/>
  <rect x="200" y="96"  width="92" height="64" rx="10" fill="${GOLD}" opacity="0.82"/>
  <rect x="304" y="96"  width="112" height="64" rx="10" fill="${GOLD}" opacity="0.9"/>

  <!-- ── LIST ITEMS (3 rows) ── -->

  <!-- Row 1 -->
  <rect x="96"  y="178" width="52" height="52" rx="9" fill="${GOLD}" opacity="0.85"/>
  <rect x="162" y="184" width="168" height="13" rx="6" fill="${GOLD}" opacity="0.68"/>
  <rect x="162" y="205" width="118" height="10" rx="5" fill="${GOLD3}"/>

  <!-- Row 2 -->
  <rect x="96"  y="246" width="52" height="52" rx="9" fill="${GOLD}" opacity="0.85"/>
  <rect x="162" y="252" width="190" height="13" rx="6" fill="${GOLD}" opacity="0.68"/>
  <rect x="162" y="273" width="140" height="10" rx="5" fill="${GOLD3}"/>

  <!-- Row 3 -->
  <rect x="96"  y="314" width="52" height="52" rx="9" fill="${GOLD}" opacity="0.85"/>
  <rect x="162" y="320" width="148" height="13" rx="6" fill="${GOLD}" opacity="0.68"/>
  <rect x="162" y="341" width="100" height="10" rx="5" fill="${GOLD3}"/>

  <!-- ── CHECKMARK bottom right ── -->
  <text
    x="388" y="440"
    font-family="Arial, Helvetica, sans-serif"
    font-size="110"
    font-weight="900"
    fill="${GOLD}"
    text-anchor="middle"
  >✓</text>
`;

const variants = [
  { name: "grid-1-warm",       bg1: "#a89488", bg2: "#7d6357" },
  { name: "grid-2-navy",       bg1: "#1e3a6e", bg2: "#0f1f42" },
  { name: "grid-3-organic",    bg1: "#3a5a2a", bg2: "#1e3412" },
  { name: "grid-4-creative",   bg1: "#7a3d7a", bg2: "#4a1f4a" },
  { name: "grid-5-executive",  bg1: "#2a2a2a", bg2: "#0a0a0a" },
];

async function generate() {
  for (const v of variants) {
    const svg = `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
      ${iconContent(v.bg1, v.bg2)}
    </svg>`;
    const outPath = path.join(outDir, `option-${v.name}.png`);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`✅ ${v.name}`);
  }
}

generate().catch(console.error);
