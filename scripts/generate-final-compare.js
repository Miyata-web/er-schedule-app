const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const outDir = path.join(__dirname, "../public/icons/options");
const SIZE = 512;
const R = 88;
const BG1 = "#4dd4a4";
const BG2 = "#28a87c";

function iconSVG(bg1, bg2, c1, o1, o2, o3) {
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
  <rect x="96"  y="96"  width="92"  height="64" rx="10" fill="${c1}" opacity="${o1}"/>
  <rect x="200" y="96"  width="92"  height="64" rx="10" fill="${c1}" opacity="${o1 * 0.82}"/>
  <rect x="304" y="96"  width="112" height="64" rx="10" fill="${c1}" opacity="${o1 * 0.90}"/>
  <rect x="96"  y="178" width="52"  height="52" rx="9"  fill="${c1}" opacity="${o1 * 0.88}"/>
  <rect x="162" y="185" width="168" height="13" rx="6"  fill="${c1}" opacity="${o2}"/>
  <rect x="162" y="206" width="118" height="10" rx="5"  fill="${c1}" opacity="${o3}"/>
  <rect x="96"  y="246" width="52"  height="52" rx="9"  fill="${c1}" opacity="${o1 * 0.88}"/>
  <rect x="162" y="253" width="190" height="13" rx="6"  fill="${c1}" opacity="${o2}"/>
  <rect x="162" y="274" width="140" height="10" rx="5"  fill="${c1}" opacity="${o3}"/>
  <rect x="96"  y="314" width="52"  height="52" rx="9"  fill="${c1}" opacity="${o1 * 0.88}"/>
  <rect x="162" y="321" width="148" height="13" rx="6"  fill="${c1}" opacity="${o2}"/>
  <rect x="162" y="342" width="100" height="10" rx="5"  fill="${c1}" opacity="${o3}"/>
  <text x="390" y="440" font-family="Arial" font-size="112" font-weight="900"
        fill="${c1}" opacity="${o1}" text-anchor="middle">✓</text>
</svg>`;
}

const variants = [
  // ── ホワイト系 ──
  { name:"final-W1", c1:"#ffffff", o1:0.85, o2:0.60, o3:0.28, label:"ホワイト\nやや透明感" },
  { name:"final-W2", c1:"#ffffff", o1:1.00, o2:0.75, o3:0.38, label:"ホワイト\nくっきり" },
  { name:"final-W3", c1:"#f0f8f4", o1:1.00, o2:0.78, o3:0.40, label:"ホワイト\nわずかにグリーン寄り" },

  // ── クローム系 ──
  { name:"final-C1", c1:"#dde4e0", o1:1.00, o2:0.72, o3:0.36, label:"クローム\nグリーン寄り" },
  { name:"final-C2", c1:"#e2e4e8", o1:1.00, o2:0.70, o3:0.34, label:"クローム\nニュートラル" },
  { name:"final-C3", c1:"#d8dce4", o1:1.00, o2:0.72, o3:0.36, label:"クローム\nブルー寄り" },
];

async function generate() {
  for (const v of variants) {
    const svg = iconSVG(BG1, BG2, v.c1, v.o1, v.o2, v.o3);
    const out = path.join(outDir, `${v.name}.png`);
    await sharp(Buffer.from(svg)).png().toFile(out);
    console.log(`✅ ${v.label.replace("\n"," ")}`);
  }
}
generate().catch(console.error);
