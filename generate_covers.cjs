const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'public', 'version_covers');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function generateSvg(title, subtitle, c1, c2, symbol) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270" width="480" height="270">
  <defs>
    <linearGradient id="bg_${title.replace(/[^a-z0-9]/gi, '')}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="glow_${title.replace(/[^a-z0-9]/gi, '')}" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.65)"/>
    </radialGradient>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="480" height="270" fill="url(#bg_${title.replace(/[^a-z0-9]/gi, '')})"/>
  <rect width="480" height="270" fill="url(#glow_${title.replace(/[^a-z0-9]/gi, '')})"/>
  <rect width="480" height="270" fill="url(#grid)"/>

  <!-- Centered Isometric Decorative Icon -->
  <g transform="translate(240, 105)" opacity="0.9">
    ${symbol === 'nether' ? `
      <path d="M0 -38 C18 -18 32 0 18 32 C9 42 -9 42 -18 32 C-32 0 -18 -18 0 -38 Z" fill="rgba(255,80,80,0.25)" stroke="rgba(255,140,140,0.5)" stroke-width="2"/>
      <circle cx="0" cy="10" r="12" fill="rgba(255,200,80,0.35)"/>
    ` : symbol === 'portal' ? `
      <rect x="-24" y="-36" width="48" height="72" rx="6" fill="rgba(147,51,234,0.3)" stroke="rgba(192,132,252,0.5)" stroke-width="2"/>
      <rect x="-14" y="-26" width="28" height="52" rx="3" fill="rgba(168,85,247,0.45)"/>
    ` : `
      <path d="M0 -38 L34 -18 L34 22 L0 42 L-34 22 L-34 -18 Z" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <path d="M0 -38 L34 -18 L0 2 L-34 -18 Z" fill="rgba(255,255,255,0.18)"/>
      <path d="M0 2 L34 -18 L34 22 L0 42 Z" fill="rgba(0,0,0,0.22)"/>
      <path d="M0 2 L-34 -18 L-34 22 L0 42 Z" fill="rgba(0,0,0,0.45)"/>
    `}
  </g>

  <!-- Typography -->
  <g transform="translate(240, 202)">
    <text text-anchor="middle" y="0" fill="#ffffff" font-family="'Barlow Condensed', sans-serif" font-weight="900" font-size="22" letter-spacing="2">${title}</text>
    <text text-anchor="middle" y="22" fill="rgba(255,255,255,0.72)" font-family="sans-serif" font-weight="600" font-size="12" letter-spacing="0.5">${subtitle}</text>
  </g>
</svg>`;
}

const list = [
  { name: 'cover_26_4.svg', title: '26.4 ДРОП', subtitle: 'Ледяные пещеры', c1: '#0f2b38', c2: '#040d14', symbol: 'cube' },
  { name: 'cover_26_3.svg', title: '26.3 WILDERNESS', subtitle: 'Пестрый лес', c1: '#1b3b22', c2: '#09150d', symbol: 'cube' },
  { name: 'cover_26_2.svg', title: '26.2 CHAOS CUBED', subtitle: 'Серные пещеры', c1: '#3d2b0e', c2: '#140d04', symbol: 'nether' },
  { name: 'cover_26_1.svg', title: '26.1 TINY TAKEOVER', subtitle: 'Малыши мобов', c1: '#2b1a3d', c2: '#0f0817', symbol: 'cube' },
  { name: 'cover_1_21_11.svg', title: '1.21.11 MOUNTS', subtitle: 'Mounts of Mayhem', c1: '#36151b', c2: '#110507', symbol: 'nether' },
  { name: 'cover_1_21_9.svg', title: '1.21.9 COPPER AGE', subtitle: 'Медный голем, снаряжение', c1: '#3d2417', c2: '#140a06', symbol: 'cube' },
  { name: 'cover_1_21_6.svg', title: '1.21.6 CHASE THE SKIES', subtitle: 'Гастёныши', c1: '#1c2838', c2: '#080e17', symbol: 'cube' },
  { name: 'cover_1_21_4.svg', title: '1.21.4 GARDEN AWAKENS', subtitle: 'Бледный сад, Скрипун', c1: '#1e2422', c2: '#090d0b', symbol: 'portal' },
  { name: 'cover_1_21.svg', title: '1.21 TRICKY TRIALS', subtitle: 'Дворец испытаний, Булава', c1: '#2e1c36', c2: '#0d0712', symbol: 'cube' },
  { name: 'cover_1_20.svg', title: '1.20 TRAILS & TALES', subtitle: 'Вишневый биом, Археология', c1: '#3d1c28', c2: '#14060b', symbol: 'cube' },
  { name: 'cover_1_19.svg', title: '1.19 THE WILD UPDATE', subtitle: 'Мрачные глубины, Хранитель', c1: '#072428', c2: '#020d0f', symbol: 'portal' },
  { name: 'cover_1_18.svg', title: '1.18 CAVES & CLIFFS II', subtitle: 'Новая генерация гор', c1: '#172733', c2: '#050c12', symbol: 'cube' },
  { name: 'cover_1_17.svg', title: '1.17 CAVES & CLIFFS I', subtitle: 'Медь, аметисты, аксолотли', c1: '#21262d', c2: '#090d10', symbol: 'cube' },
  { name: 'cover_1_16.svg', title: '1.16 NETHER UPDATE', subtitle: 'Адское обновление, Незерит', c1: '#401111', c2: '#140303', symbol: 'nether' },
  { name: 'cover_1_15.svg', title: '1.15 BUZZY BEES', subtitle: 'Пчелы и ульи', c1: '#3d3412', c2: '#120f04', symbol: 'cube' },
  { name: 'cover_1_14.svg', title: '1.14 VILLAGE & PILLAGE', subtitle: 'Деревни и рейды', c1: '#36241a', c2: '#120a06', symbol: 'cube' },
  { name: 'cover_1_13.svg', title: '1.13 UPDATE AQUATIC', subtitle: 'Океаны и трезубец', c1: '#0e2b38', c2: '#040f14', symbol: 'cube' },
  { name: 'cover_1_12.svg', title: '1.12 WORLD OF COLOR', subtitle: 'Бетон, терракота', c1: '#361838', c2: '#120514', symbol: 'cube' },
  { name: 'cover_1_8.svg', title: '1.8 BOUNTIFUL UPDATE', subtitle: 'Подводные храмы, PvP', c1: '#142938', c2: '#040d14', symbol: 'cube' },
  { name: 'cover_1_7.svg', title: '1.7 THE UPDATE', subtitle: 'Обновление изменившее мир', c1: '#18331e', c2: '#051208', symbol: 'cube' },
  { name: 'cover_classic.svg', title: 'CLASSIC / BETA', subtitle: 'Ранние этапы игры', c1: '#21242b', c2: '#08090d', symbol: 'cube' }
];

for (const item of list) {
  const content = generateSvg(item.title, item.subtitle, item.c1, item.c2, item.symbol);
  fs.writeFileSync(path.join(targetDir, item.name), content, 'utf8');
}

console.log('Successfully generated', list.length, 'version cover SVGs');
