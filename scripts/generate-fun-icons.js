const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const outDir = path.join(__dirname, "../public/icons/options");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const SIZE = 512;
const R = 90; // corner radius

// A: クリップボードにメモするキャラクター (orange)
const svgA = `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fb923c"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" rx="${R}" fill="url(#bg)"/>

  <!-- Clipboard shadow -->
  <rect x="122" y="112" width="268" height="320" rx="20" fill="rgba(0,0,0,0.18)"/>
  <!-- Clipboard body -->
  <rect x="116" y="104" width="268" height="320" rx="20" fill="white"/>
  <!-- Clip -->
  <rect x="196" y="86" width="120" height="50" rx="10" fill="#94a3b8"/>
  <rect x="210" y="96" width="92" height="30" rx="7" fill="#cbd5e1"/>

  <!-- Face: eyes -->
  <circle cx="204" cy="214" r="18" fill="#1e293b"/>
  <circle cx="308" cy="214" r="18" fill="#1e293b"/>
  <circle cx="211" cy="207" r="7" fill="white"/>
  <circle cx="315" cy="207" r="7" fill="white"/>
  <!-- Blush -->
  <ellipse cx="178" cy="248" rx="22" ry="14" fill="#fca5a5" opacity="0.65"/>
  <ellipse cx="334" cy="248" rx="22" ry="14" fill="#fca5a5" opacity="0.65"/>
  <!-- Smile -->
  <path d="M 190 262 Q 256 310 322 262" stroke="#1e293b" stroke-width="11" fill="none" stroke-linecap="round"/>

  <!-- Checklist items -->
  <!-- item 1: checked -->
  <rect x="148" y="328" width="22" height="22" rx="5" fill="#bbf7d0"/>
  <path d="M152 339 L157 345 L167 332" stroke="#16a34a" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="182" y="332" width="80" height="10" rx="5" fill="#e2e8f0"/>
  <!-- item 2: checked -->
  <rect x="148" y="358" width="22" height="22" rx="5" fill="#bbf7d0"/>
  <path d="M152 369 L157 375 L167 362" stroke="#16a34a" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="182" y="362" width="100" height="10" rx="5" fill="#e2e8f0"/>
  <!-- item 3: unchecked -->
  <rect x="148" y="388" width="22" height="22" rx="5" fill="none" stroke="#cbd5e1" stroke-width="2.5"/>
  <rect x="182" y="392" width="64" height="10" rx="5" fill="#e2e8f0"/>

  <!-- Pencil (rotated) -->
  <g transform="translate(358,130) rotate(30)">
    <rect x="-14" y="-70" width="28" height="120" rx="4" fill="#fde047"/>
    <polygon points="-14,50 14,50 0,88" fill="#fef9c3"/>
    <polygon points="-6,72 6,72 0,88" fill="#78350f"/>
    <rect x="-14" y="-86" width="28" height="22" rx="4" fill="#fca5a5"/>
    <rect x="-14" y="-68" width="28" height="6" fill="#d1d5db"/>
  </g>
</svg>`;

// B: ペンギンがメモ中 (dark navy)
const svgB = `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" rx="${R}" fill="url(#bg)"/>

  <!-- Notepad (held by penguin) -->
  <rect x="262" y="210" width="160" height="200" rx="12" fill="white" opacity="0.95"/>
  <!-- Notepad lines -->
  <rect x="278" y="244" width="110" height="8" rx="4" fill="#e2e8f0"/>
  <rect x="278" y="264" width="90" height="8" rx="4" fill="#e2e8f0"/>
  <!-- Checkmark on notepad -->
  <rect x="278" y="286" width="20" height="20" rx="4" fill="#bbf7d0"/>
  <path d="M282 296 L287 302 L296 290" stroke="#16a34a" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="304" y="290" width="68" height="8" rx="4" fill="#e2e8f0"/>
  <rect x="278" y="318" width="20" height="20" rx="4" fill="#bbf7d0"/>
  <path d="M282 328 L287 334 L296 322" stroke="#16a34a" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="304" y="322" width="50" height="8" rx="4" fill="#e2e8f0"/>
  <!-- Notepad spiral -->
  <circle cx="262" cy="236" r="7" fill="none" stroke="#94a3b8" stroke-width="3"/>
  <circle cx="262" cy="260" r="7" fill="none" stroke="#94a3b8" stroke-width="3"/>
  <circle cx="262" cy="284" r="7" fill="none" stroke="#94a3b8" stroke-width="3"/>

  <!-- Penguin body -->
  <ellipse cx="210" cy="330" rx="90" ry="110" fill="#1e293b"/>
  <!-- Penguin belly -->
  <ellipse cx="210" cy="340" rx="58" ry="76" fill="white"/>
  <!-- Penguin head -->
  <circle cx="210" cy="190" r="88" fill="#1e293b"/>
  <!-- Penguin face white -->
  <ellipse cx="210" cy="198" rx="58" ry="52" fill="white"/>
  <!-- Eyes -->
  <circle cx="188" cy="182" r="16" fill="#1e293b"/>
  <circle cx="232" cy="182" r="16" fill="#1e293b"/>
  <circle cx="192" cy="177" r="6" fill="white"/>
  <circle cx="236" cy="177" r="6" fill="white"/>
  <!-- Beak -->
  <ellipse cx="210" cy="212" rx="18" ry="12" fill="#f59e0b"/>
  <!-- Right arm (writing) -->
  <ellipse cx="290" cy="288" rx="20" ry="56" fill="#1e293b" transform="rotate(-40 290 288)"/>
  <!-- Left arm -->
  <ellipse cx="130" cy="300" rx="16" ry="50" fill="#1e293b" transform="rotate(20 130 300)"/>
  <!-- Feet -->
  <ellipse cx="178" cy="432" rx="28" ry="14" fill="#f59e0b"/>
  <ellipse cx="242" cy="432" rx="28" ry="14" fill="#f59e0b"/>

  <!-- Stars -->
  <text x="380" y="160" font-size="40" fill="white" opacity="0.8">⭐</text>
  <text x="90" y="140" font-size="30" fill="white" opacity="0.6">✨</text>
</svg>`;

// C: スマイルToDo (purple/violet)
const svgC = `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#6d28d9"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" rx="${R}" fill="url(#bg)"/>

  <!-- Notepad body (with face) -->
  <rect x="96" y="80" width="320" height="360" rx="24" fill="white"/>
  <!-- Notepad top binding -->
  <rect x="96" y="80" width="320" height="48" rx="24" fill="#e9d5ff"/>
  <rect x="96" y="104" width="320" height="24" fill="#e9d5ff"/>
  <!-- Spiral dots -->
  <circle cx="156" cy="80" r="12" fill="white" stroke="#a855f7" stroke-width="3"/>
  <circle cx="212" cy="80" r="12" fill="white" stroke="#a855f7" stroke-width="3"/>
  <circle cx="268" cy="80" r="12" fill="white" stroke="#a855f7" stroke-width="3"/>
  <circle cx="324" cy="80" r="12" fill="white" stroke="#a855f7" stroke-width="3"/>
  <circle cx="380" cy="80" r="12" fill="white" stroke="#a855f7" stroke-width="3"/>

  <!-- Smiley face on notepad -->
  <circle cx="256" cy="208" r="72" fill="#fde68a"/>
  <circle cx="232" cy="192" r="11" fill="#1e293b"/>
  <circle cx="280" cy="192" r="11" fill="#1e293b"/>
  <circle cx="236" cy="188" r="4" fill="white"/>
  <circle cx="284" cy="188" r="4" fill="white"/>
  <path d="M 222 224 Q 256 258 290 224" stroke="#1e293b" stroke-width="8" fill="none" stroke-linecap="round"/>
  <!-- Cheeks -->
  <ellipse cx="210" cy="218" rx="16" ry="10" fill="#fca5a5" opacity="0.7"/>
  <ellipse cx="302" cy="218" rx="16" ry="10" fill="#fca5a5" opacity="0.7"/>

  <!-- Checklist below face -->
  <!-- item 1 -->
  <rect x="128" y="306" width="26" height="26" rx="6" fill="#d8b4fe"/>
  <path d="M133 319 L139 326 L151 311" stroke="#6d28d9" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="166" y="311" width="120" height="12" rx="6" fill="#ede9fe"/>
  <!-- item 2 -->
  <rect x="128" y="342" width="26" height="26" rx="6" fill="#d8b4fe"/>
  <path d="M133 355 L139 362 L151 347" stroke="#6d28d9" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="166" y="347" width="96" height="12" rx="6" fill="#ede9fe"/>
  <!-- item 3: unchecked -->
  <rect x="128" y="378" width="26" height="26" rx="6" fill="none" stroke="#c4b5fd" stroke-width="2.5"/>
  <rect x="166" y="383" width="74" height="12" rx="6" fill="#ede9fe"/>

  <!-- Pencil bottom right -->
  <g transform="translate(400,420) rotate(-45)">
    <rect x="-10" y="-50" width="20" height="86" rx="3" fill="#fde047"/>
    <polygon points="-10,36 10,36 0,62" fill="#fef3c7"/>
    <polygon points="-4,52 4,52 0,62" fill="#92400e"/>
    <rect x="-10" y="-62" width="20" height="16" rx="3" fill="#fca5a5"/>
    <rect x="-10" y="-48" width="20" height="5" fill="#d1d5db"/>
  </g>

  <!-- Stars outside notepad -->
  <text x="58" y="120" font-size="36" fill="white" opacity="0.8">✨</text>
  <text x="420" y="440" font-size="32" fill="white" opacity="0.7">⭐</text>
</svg>`;

// D: ロケット×チェックリスト (teal/cyan)
const svgD = `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#14b8a6"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" rx="${R}" fill="url(#bg)"/>

  <!-- Checklist paper -->
  <rect x="136" y="148" width="240" height="280" rx="18" fill="white" opacity="0.95"/>
  <!-- Paper fold corner -->
  <polygon points="336,148 376,148 376,188" fill="#e2e8f0"/>
  <polygon points="336,148 376,188 336,188" fill="#f1f5f9"/>

  <!-- Checklist items -->
  <!-- item 1 checked -->
  <rect x="162" y="184" width="24" height="24" rx="6" fill="#99f6e4"/>
  <path d="M167 196 L173 203 L184 188" stroke="#0f766e" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="198" y="189" width="108" height="11" rx="5" fill="#e2e8f0"/>
  <!-- item 2 checked -->
  <rect x="162" y="222" width="24" height="24" rx="6" fill="#99f6e4"/>
  <path d="M167 234 L173 241 L184 226" stroke="#0f766e" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="198" y="227" width="86" height="11" rx="5" fill="#e2e8f0"/>
  <!-- item 3 checked -->
  <rect x="162" y="260" width="24" height="24" rx="6" fill="#99f6e4"/>
  <path d="M167 272 L173 279 L184 264" stroke="#0f766e" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="198" y="265" width="120" height="11" rx="5" fill="#e2e8f0"/>
  <!-- item 4: unchecked -->
  <rect x="162" y="298" width="24" height="24" rx="6" fill="none" stroke="#a7f3d0" stroke-width="2.5"/>
  <rect x="198" y="303" width="70" height="11" rx="5" fill="#e2e8f0"/>
  <!-- item 5: unchecked -->
  <rect x="162" y="336" width="24" height="24" rx="6" fill="none" stroke="#a7f3d0" stroke-width="2.5"/>
  <rect x="198" y="341" width="96" height="11" rx="5" fill="#e2e8f0"/>

  <!-- Rocket -->
  <g transform="translate(330,100) rotate(30)">
    <!-- Rocket body -->
    <ellipse cx="0" cy="0" rx="30" ry="52" fill="white"/>
    <!-- Rocket window -->
    <circle cx="0" cy="-8" r="14" fill="#67e8f9" stroke="white" stroke-width="3"/>
    <circle cx="0" cy="-8" r="7" fill="#0891b2"/>
    <!-- Rocket tip -->
    <ellipse cx="0" cy="-52" rx="30" ry="20" fill="#f87171"/>
    <!-- Rocket fins -->
    <polygon points="-30,40 -48,70 -12,50" fill="#fbbf24"/>
    <polygon points="30,40 48,70 12,50" fill="#fbbf24"/>
    <!-- Rocket flame -->
    <ellipse cx="0" cy="64" rx="14" ry="20" fill="#fed7aa" opacity="0.9"/>
    <ellipse cx="0" cy="68" rx="8" ry="14" fill="#fde047"/>
  </g>

  <!-- Stars -->
  <circle cx="100" cy="110" r="6" fill="white" opacity="0.8"/>
  <circle cx="430" cy="380" r="5" fill="white" opacity="0.7"/>
  <circle cx="420" cy="200" r="4" fill="white" opacity="0.6"/>
  <circle cx="80" cy="380" r="7" fill="white" opacity="0.5"/>
  <text x="66" y="145" font-size="28" fill="white" opacity="0.7">✨</text>
</svg>`;

async function generate() {
  const options = [
    { name: "fun-A_clipboard-char", svg: svgA },
    { name: "fun-B_penguin", svg: svgB },
    { name: "fun-C_smile-todo", svg: svgC },
    { name: "fun-D_rocket-list", svg: svgD },
  ];

  for (const opt of options) {
    const outPath = path.join(outDir, `option-${opt.name}.png`);
    await sharp(Buffer.from(opt.svg)).png().toFile(outPath);
    console.log(`✅ ${opt.name}`);
  }
}

generate().catch(console.error);
