// Script to generate high quality crisp Minecraft pixel block icons (32x32 SVG, rendered crisp with crisp-edges)
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/block_icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Helper to create pixel SVG block / item
function svgBlock(name, pixelGrid, colors) {
  // pixelGrid is array of strings (16x16 or 24x24 or 32x32), colors map char -> hex color
  const size = pixelGrid.length;
  let rects = '';
  for (let y = 0; y < size; y++) {
    const row = pixelGrid[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === ' ' || !colors[ch]) continue;
      rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[ch]}"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="32" height="32" style="shape-rendering:crispEdges;image-rendering:pixelated">${rects}</svg>`;
}

// 1. Spear (Копьё - 1.21.11)
function makeSpear() {
  const g = [
    "..............XX",
    ".............XXC",
    "............XXC.",
    "...........XXC..",
    "..........XXC...",
    ".........OXX....",
    "........OSX.....",
    ".......OS.......",
    "......OS........",
    ".....OS.........",
    "....OS..........",
    "...OS...........",
    "..OS............",
    ".OS.............",
    "OS..............",
    "S...............",
  ];
  return svgBlock('spear', g, {
    'X': '#c8d4df',
    'C': '#ffffff',
    'O': '#465568',
    'S': '#6b4c2b',
    '.': ' '
  });
}

// 2. Copper Bulb / Block / Golem (Медь - 1.21.9 & 1.17)
function makeCopperBlock() {
  const g = [
    "LLLLLLLLLLLLLLLD",
    "LBBBBBBBBBBBBBBD",
    "LBMNNNNNNNNNNBBD",
    "LBNCCCCCCCCCNBBD",
    "LBNCCCCCCCCCNBBD",
    "LBNCCCCCCCCCNBBD",
    "LBNCCCCCCCCCNBBD",
    "LBNCCCCCCCCCNBBD",
    "LBNCCCCCCCCCNBBD",
    "LBNCCCCCCCCCNBBD",
    "LBNCCCCCCCCCNBBD",
    "LBMNNNNNNNNNNBBD",
    "LBBBBBBBBBBBBBBD",
    "LBBBBBBBBBBBBBBD",
    "LDDDDDDDDDDDDDDD",
    "DDDDDDDDDDDDDDDD",
  ];
  return svgBlock('copper', g, {
    'L': '#eb8d6b',
    'B': '#d46944',
    'M': '#e27b55',
    'N': '#ad4726',
    'C': '#bf5430',
    'D': '#66240d',
  });
}

// 3. Mace (Булава - 1.21 Tricky Trials)
function makeMace() {
  const g = [
    "........HHHH....",
    ".......HTTTTH...",
    ".......HTTTTH...",
    ".......HTTTTH...",
    "........HHHH....",
    ".........SS.....",
    "........SSSS....",
    ".........B......",
    "........B.......",
    ".......B........",
    "......B.........",
    ".....B..........",
    "....B...........",
    "...B............",
    "..B.............",
    ".S..............",
  ];
  return svgBlock('mace', g, {
    'H': '#292b34',
    'T': '#454a5c',
    'S': '#d77c3e',
    'B': '#5e432b',
    '.': ' '
  });
}

// 4. Cherry Leaves (Вишневые листья - 1.20 Trails & Tales)
function makeCherryLeaves() {
  const g = [
    "PPWPPPPPWPWWPPPP",
    "PWFFFWPPFWFFFPPP",
    "PFFFFFFWFFFFFFWP",
    "WFFPPFFFFFFFPPFW",
    "PFPWWPFFFFFPWWFP",
    "PFPWWPFFFFFFWWFW",
    "WFFFFFFPWWFFFFFF",
    "PFFFFFFPWWFFFFFF",
    "PFFFFFFWFFFFFFWP",
    "WFFPPFFFFFFFPPFW",
    "PFPWWPFFFFFPWWFP",
    "PFFFFFFWFFFFFFWP",
    "WFFFFFFPWWFFFFFF",
    "PFFFFFFPWWFFFFFF",
    "PPWPPPPPWPWWPPPP",
    "WWWWWWWWWWWWWWWW",
  ];
  return svgBlock('cherry', g, {
    'P': '#fcaec9',
    'W': '#ffcde0',
    'F': '#e887a7',
  });
}

// 5. Sculk Catalyst / Shrieker (Скалк - 1.19 The Wild Update)
function makeSculk() {
  const g = [
    "0000000000000000",
    "0111111001111110",
    "01CCCC1001CCCC10",
    "01C22C1001C22C10",
    "01C22C1001C22C10",
    "01CCCC1001CCCC10",
    "0111111001111110",
    "0000000000000000",
    "0000000000000000",
    "0111111001111110",
    "01CCCC1001CCCC10",
    "01C22C1001C22C10",
    "01CCCC1001CCCC10",
    "0111111001111110",
    "0000000000000000",
    "0000000000000000",
  ];
  return svgBlock('sculk', g, {
    '0': '#03141a',
    '1': '#092d37',
    'C': '#046169',
    '2': '#00d7ca',
  });
}

// 6. Deepslate (Глубинный сланец - 1.18 Caves & Cliffs II)
function makeDeepslate() {
  const g = [
    "LLLLLLLLLLLLLLLD",
    "LBBBBBBBBBBBBBBD",
    "LDDDDDDDDDDDDDDD",
    "LMMMMMMMMMMMMMMD",
    "LLLLLLLLLLLLLLLD",
    "LBBBBBBBBBBBBBBD",
    "LDDDDDDDDDDDDDDD",
    "LMMMMMMMMMMMMMMD",
    "LLLLLLLLLLLLLLLD",
    "LBBBBBBBBBBBBBBD",
    "LDDDDDDDDDDDDDDD",
    "LMMMMMMMMMMMMMMD",
    "LLLLLLLLLLLLLLLD",
    "LBBBBBBBBBBBBBBD",
    "LDDDDDDDDDDDDDDD",
    "DDDDDDDDDDDDDDDD",
  ];
  return svgBlock('deepslate', g, {
    'L': '#565659',
    'B': '#3b3b3d',
    'M': '#2b2b2d',
    'D': '#1a1a1c',
  });
}

// 7. Amethyst Cluster / Block (Аметист - 1.17 Caves & Cliffs I)
function makeAmethyst() {
  const g = [
    ".......P........",
    "......PPP.......",
    ".....PMMMP......",
    "....PMMMMMP.....",
    "...PLMMMMMLP....",
    "...PLMMMMMLP....",
    "..PLLMMMMLLP....",
    "..PLLDMMDLLP....",
    ".PLLLDMMDLLLP...",
    ".PLLLDMMDLLLP...",
    "PLLLLDMMDLLLLP..",
    "PLLLLDMMDLLLLP..",
    "PLLLLDMMDLLLLP..",
    ".PDDDDDDDDDDP...",
    "..PMMMMMMMMP....",
    "...PPPPPPPP.....",
  ];
  return svgBlock('amethyst', g, {
    'P': '#d3a3f7',
    'L': '#a76be0',
    'M': '#7a3cb8',
    'D': '#4c1e7a',
    '.': ' '
  });
}

// 8. Ancient Debris / Netherite (Незерит - 1.16 Nether Update)
function makeNetherite() {
  const g = [
    "LLLLLLLLLLLLLLLD",
    "LBBMMMMMMMMBBBBD",
    "LBMCCCCCCCCCBBDD",
    "LBMCDDDDDDDCBBDD",
    "LBMCD11111DCBBDD",
    "LBMCD12221DCBBDD",
    "LBMCD12221DCBBDD",
    "LBMCD12221DCBBDD",
    "LBMCD11111DCBBDD",
    "LBMCDDDDDDDCBBDD",
    "LBMCCCCCCCCCBBDD",
    "LBBMMMMMMMMBBBBD",
    "LBBBBBBBBBBBBBBD",
    "LDDDDDDDDDDDDDDD",
    "DDDDDDDDDDDDDDDD",
    "DDDDDDDDDDDDDDDD",
  ];
  return svgBlock('netherite', g, {
    'L': '#5f4946',
    'B': '#4a3835',
    'M': '#3e2e2c',
    'C': '#6d4841',
    'D': '#281b19',
    '1': '#75544d',
    '2': '#916960',
  });
}

// 9. Honeycomb / Honey Block (Мёд и соты - 1.15 Buzzy Bees)
function makeHoney() {
  const g = [
    "YYYYYYYYYYYYYYYO",
    "YOOOOOOOOOOOOOOO",
    "YOFFFFFFFFFFFOOO",
    "YOFFFFFFFFFFFOOO",
    "YOFFFFFFFFFFFOOO",
    "YOFFFFFFFFFFFOOO",
    "YOFFFFFFFFFFFOOO",
    "YOFFFFFFFFFFFOOO",
    "YOFFFFFFFFFFFOOO",
    "YOFFFFFFFFFFFOOO",
    "YOFFFFFFFFFFFOOO",
    "YOFFFFFFFFFFFOOO",
    "YOOOOOOOOOOOOOOO",
    "YOOOOOOOOOOOOOOO",
    "OOOOOOOOOOOOOOOO",
    "OOOOOOOOOOOOOOOO",
  ];
  return svgBlock('honey', g, {
    'Y': '#ffe34a',
    'O': '#f09800',
    'F': '#e07f00',
  });
}

// 10. Crossbow / Bell / Emerald (Изумруд - 1.14 Village & Pillage)
function makeEmerald() {
  const g = [
    ".....GGGGGG.....",
    "...GG111111GG...",
    "..G1111111111G..",
    ".G112222222211G.",
    ".G122233332221G.",
    "G12233333333221G",
    "G12233333333221G",
    "G12233333333221G",
    "G12233333333221G",
    "G12233333333221G",
    "G12233333333221G",
    ".G122233332221G.",
    ".G112222222211G.",
    "..G1111111111G..",
    "...GG111111GG...",
    ".....GGGGGG.....",
  ];
  return svgBlock('emerald', g, {
    'G': '#17823e',
    '1': '#26a855',
    '2': '#42d677',
    '3': '#8df9b1',
    '.': ' '
  });
}

// 11. Conduit / Sea Lantern (Морской фонарь - 1.13 Update Aquatic)
function makeSeaLantern() {
  const g = [
    "WWWWWWWWWWWWWWWW",
    "WCCCCCCCCCCCCCCW",
    "WCLLLLLLLLLLLLCW",
    "WCLWWWWWWWWWWLCW",
    "WCLWCCCCCCCCWLCW",
    "WCLWCLLLLLLCWLCW",
    "WCLWCLWWWWCLWLCW",
    "WCLWCLWCCWLWCLW",
    "WCLWCLWCCWLWCLW",
    "WCLWCLWWWWCLWLCW",
    "WCLWCLLLLLLCWLCW",
    "WCLWCCCCCCCCWLCW",
    "WCLWWWWWWWWWWLCW",
    "WCLLLLLLLLLLLLCW",
    "WCCCCCCCCCCCCCCW",
    "WWWWWWWWWWWWWWWW",
  ];
  return svgBlock('sealantern', g, {
    'W': '#d9f7f5',
    'C': '#a7e4e1',
    'L': '#66c1bd',
  });
}

// 12. Glazed Terracotta / Concrete (Бетон - 1.12 World of Color)
function makeConcrete() {
  const g = [
    "RRRGGGBBBYYYCCCC",
    "RRRGGGBBBYYYCCCC",
    "RRRGGGBBBYYYCCCC",
    "GGGBBBYYYCCCCMMM",
    "GGGBBBYYYCCCCMMM",
    "GGGBBBYYYCCCCMMM",
    "BBBYYYCCCCMMMRRR",
    "BBBYYYCCCCMMMRRR",
    "BBBYYYCCCCMMMRRR",
    "YYYCCCCMMMRRRGGG",
    "YYYCCCCMMMRRRGGG",
    "YYYCCCCMMMRRRGGG",
    "CCCCMMMRRRGGGBBB",
    "CCCCMMMRRRGGGBBB",
    "CCCCMMMRRRGGGBBB",
    "MMMRRRGGGBBBYYYC",
  ];
  return svgBlock('concrete', g, {
    'R': '#ff4747',
    'G': '#47d147',
    'B': '#3385ff',
    'Y': '#ffd11a',
    'C': '#00e6e6',
    'M': '#e600e6',
  });
}

// 13. Totem of Undying / Shulker (Тотем - 1.11 Exploration)
function makeTotem() {
  const g = [
    ".....GGGGGG.....",
    "....GYYYYYYG....",
    "...GYYEEYEYYG...",
    "...GYYYYYYYYG...",
    "....GYYYYYYG....",
    "..GGGGGGGGGGGG..",
    ".GYYGGYYYYGGYYG.",
    ".GYYGYYYYYYGYYG.",
    "..GG.GYYYYG.GG..",
    ".....GYYYYG.....",
    ".....GYYYYG.....",
    ".....GYYYYG.....",
    ".....GYYYYG.....",
    ".....GYYYYG.....",
    "......GYYG......",
    ".......GG.......",
  ];
  return svgBlock('totem', g, {
    'G': '#917215',
    'Y': '#fce838',
    'E': '#3bf45d',
    '.': ' '
  });
}

// 14. Magma Block (Магма - 1.10 Frostburn)
function makeMagma() {
  const g = [
    "RRORRRORRRRORRRR",
    "ROOOROROOOROROOO",
    "ROYYYORRYYYOORRY",
    "OYYYYYOY YYYYOYY",
    "ROYYYORRYYYOORRY",
    "ROOOROROOOROROOO",
    "RRORRRORRRRORRRR",
    "ROOOROROOOROROOO",
    "ROYYYORRYYYOORRY",
    "OYYYYYOY YYYYOYY",
    "ROYYYORRYYYOORRY",
    "ROOOROROOOROROOO",
    "RRORRRORRRRORRRR",
    "ROOOROROOOROROOO",
    "RRORRRORRRRORRRR",
    "RRRRRRRRRRRRRRRR",
  ];
  return svgBlock('magma', g, {
    'R': '#541505',
    'O': '#c43d04',
    'Y': '#fca103',
  });
}

// 15. Elytra / Shield (Элитры - 1.9 Combat Update)
function makeElytra() {
  const g = [
    "......GG........",
    ".....GGGG.......",
    "....GGLLGG......",
    "...GGLLLLGG.....",
    "...GLLLLLLG.....",
    "..GLLDDDDLLG....",
    "..GLLDDDDLLG....",
    ".GLLDDDDDDLLG...",
    ".GLLDDDDDDLLG...",
    ".GLDDDDDDDDLG...",
    "GLDDDDDDDDDDLG..",
    "GLDDDDDDDDDDLG..",
    "GDDDDDDDDDDDDG..",
    "GDDDDDDDDDDDDG..",
    ".GDDDDDDDDDDG...",
    "..GGGGGGGGGG....",
  ];
  return svgBlock('elytra', g, {
    'G': '#1f202b',
    'L': '#565c6e',
    'D': '#353847',
    '.': ' '
  });
}

// 16. Prismarine (Призмарин - 1.8 Bountiful Update)
function makePrismarine() {
  const g = [
    "LLLLLLLLLLLLLLLD",
    "LBBBBBBBBBBBBBBD",
    "LBCCCCDDDDCCCCBD",
    "LBCDD1111DDDCBD",
    "LBCDD1111DDDCBD",
    "LBD11222211DDBBD",
    "LBD11222211DDBBD",
    "LBD11222211DDBBD",
    "LBCDD1111DDDCBD",
    "LBCDD1111DDDCBD",
    "LBCCCCDDDDCCCCBD",
    "LBBBBBBBBBBBBBBD",
    "LDDDDDDDDDDDDDDD",
    "DDDDDDDDDDDDDDDD",
    "DDDDDDDDDDDDDDDD",
    "DDDDDDDDDDDDDDDD",
  ];
  return svgBlock('prismarine', g, {
    'L': '#92ded3',
    'B': '#64b5ab',
    'C': '#4f968e',
    'D': '#356661',
    '1': '#2b524e',
    '2': '#1e3835',
  });
}

// 17. Stained Glass / Biome Grass (Стекло/Акация - 1.7 Update that changed the world)
function makeGrassBlock() {
  const g = [
    "GGGGGGGGGGGGGGGG",
    "GGGGGGGGGGGGGGGG",
    "GDGDGGGDGGGDGDGG",
    "DDDDDDDDDDDDDDDD",
    "BDDBDDBDBDDBDDBD",
    "BDBBBDBBDBBBDBBD",
    "BBBBBBBBBBBBBBBB",
    "DBBBDDBDBBBDDBDB",
    "DBBBDDBDBBBDDBDB",
    "BDBBBDBBDBBBDBBD",
    "BBBBBBBBBBBBBBBB",
    "DBBBDDBDBBBDDBDB",
    "BDBBBDBBDBBBDBBD",
    "BBBBBBBBBBBBBBBB",
    "BBBBBBBBBBBBBBBB",
    "BBBBBBBBBBBBBBBB",
  ];
  return svgBlock('grass', g, {
    'G': '#5b8e32',
    'D': '#3e6321',
    'B': '#866043',
  });
}

// 18. Saddle / Hay Bale (Седло/Сноп сена - 1.6 Horse Update)
function makeSaddle() {
  const g = [
    "....LLLLLLLL....",
    "...LBBBBBBBBL...",
    "..LBDDDDDDDDBL..",
    ".LBDDDDDDDDDDBL.",
    ".LBDDDLLLLDDDDBL",
    "LBDDDLFFFFLDDDDL",
    "LBDDDLFFFFLDDDDL",
    "LBDDDLLLLLDDDDDL",
    "LBDDDDDDDDDDDDDL",
    "LBDDDDDDDDDDDDDL",
    ".LBDDIIIIDDDDBL.",
    "..LDDIIIIDDDDL..",
    "...LII..IIL.....",
    "....II..II......",
    "....II..II......",
    "................",
  ];
  return svgBlock('saddle', g, {
    'L': '#9c5b2b',
    'B': '#80451a',
    'D': '#63310d',
    'F': '#421f07',
    'I': '#c9c9c9',
    '.': ' '
  });
}

// 19. Redstone Dust / Block (Редстоуновая пыль - 1.5 Redstone Update)
function makeRedstone() {
  const g = [
    "................",
    ".....RRRR.......",
    "....RRBBRR......",
    "...RRBBBBBBR....",
    "...RBBWWBBBR....",
    "...RBBWWBBBR....",
    "..RRBBBBBBBBR...",
    ".RRBBBBBBBBBBR..",
    ".RRBBBBBBBBBBR..",
    "..RRBBBBBBBBR...",
    "...RRBBBBBBR....",
    "....RRBBRR......",
    ".....RRRR.......",
    "................",
    "................",
    "................",
  ];
  return svgBlock('redstone', g, {
    'R': '#8c0909',
    'B': '#e01616',
    'W': '#ff7878',
    '.': ' '
  });
}

// 20. Anvil / Wither Skull / Command Block (Наковальня - 1.4 Pretty Scary)
function makeAnvil() {
  const g = [
    "IIIIIIIIIIIIIIII",
    "ILLLLLLLLLLLLLLI",
    "IBBBBBBBBBBBBBBI",
    "IBBBBBBBBBBBBBBI",
    ".IDDDDDDDDDDDDI.",
    "..IIIIIIIIIIII..",
    "....IILLLLII....",
    "....IBBBBBBI....",
    "....IBBBBBBI....",
    "....IDDDDDDI....",
    "...IIIIIIIIII...",
    "..ILLLLLLLLLLI..",
    ".IBBBBBBBBBBBBI.",
    ".IBBBBBBBBBBBBI.",
    "IIIIIIIIIIIIIIII",
    "DDDDDDDDDDDDDDDD",
  ];
  return svgBlock('anvil', g, {
    'I': '#303030',
    'L': '#5e5e5e',
    'B': '#474747',
    'D': '#242424',
    '.': ' '
  });
}

// 21. Emerald Block / Trading (Изумрудный блок - 1.3)
function makeEmeraldBlock() {
  const g = [
    "LLLLLLLLLLLLLLLD",
    "LBBBBBBBBBBBBBBD",
    "LB111111111111BD",
    "LB122222222221BD",
    "LB123333333321BD",
    "LB123444444321BD",
    "LB123444444321BD",
    "LB123444444321BD",
    "LB123444444321BD",
    "LB123444444321BD",
    "LB123333333321BD",
    "LB122222222221BD",
    "LB111111111111BD",
    "LBBBBBBBBBBBBBBD",
    "LDDDDDDDDDDDDDDD",
    "DDDDDDDDDDDDDDDD",
  ];
  return svgBlock('emerald_block', g, {
    'L': '#5bf78d',
    'B': '#2de369',
    'D': '#0b6628',
    '1': '#19bd4f',
    '2': '#0ea33f',
    '3': '#0b8232',
    '4': '#076124',
  });
}

// 22. Jungle Wood / Ocelot (Джунгли - 1.2)
function makeJungleLog() {
  const g = [
    "LLLLLLLLLLLLLLLD",
    "LBBMMMMMMMMBBBBD",
    "LBMNNNNNNNNBBDDD",
    "LBMNNNNNNNNBBDDD",
    "LBMNNGGGGNNBBDDD",
    "LBMNGGGGNNNBBDDD",
    "LBMNNNNNNNNBBDDD",
    "LBMNNNNNNNNBBDDD",
    "LBMNNGGGGNNBBDDD",
    "LBMNNGGGGNNBBDDD",
    "LBMNNNNNNNNBBDDD",
    "LBBMMMMMMMMBBBBD",
    "LBBBBBBBBBBBBBBD",
    "LDDDDDDDDDDDDDDD",
    "DDDDDDDDDDDDDDDD",
    "DDDDDDDDDDDDDDDD",
  ];
  return svgBlock('jungle', g, {
    'L': '#66533c',
    'B': '#54432e',
    'M': '#473724',
    'N': '#3b2c1b',
    'G': '#42542a',
    'D': '#261b0e',
  });
}

// 23. Piston / Spawn Egg (Поршень - Beta 1.7)
function makePiston() {
  const g = [
    "WWWWWWWWWWWWWWWD",
    "WBBBBBBBBBBBBBBD",
    "WDDDDDDDDDDDDDDB",
    "WWWWWWWWWWWWWWWD",
    "GIIIIIIIIIIIIIID",
    "GILLLLLLLLLLLIID",
    "GIBBBBBBBBBBBIID",
    "GIDDDDDDDDDDDIID",
    "GIIIIIIIIIIIIIID",
    "GILLLLLLLLLLLIID",
    "GIBBBBBBBBBBBIID",
    "GIDDDDDDDDDDDIID",
    "GIIIIIIIIIIIIIID",
    "GILLLLLLLLLLLIID",
    "GDDDDDDDDDDDDDDB",
    "DDDDDDDDDDDDDDDD",
  ];
  return svgBlock('piston', g, {
    'W': '#ad824c',
    'B': '#876132',
    'D': '#543b1c',
    'G': '#919191',
    'I': '#6e6e6e',
    'L': '#7d7d7d',
  });
}

// 24. Bow / Bed (Кровать - Beta 1.3)
function makeBed() {
  const g = [
    "................",
    "................",
    "................",
    "................",
    "RRRRRRRRRRRRRRRR",
    "RRRRRRRRRRRRRRRR",
    "RRWWWWWWWWWWWWWW",
    "RRWWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWWWW",
    "BBBBBBBBBBBBBBBB",
    "BBBBBBBBBBBBBBBB",
    "LL............LL",
    "LL............LL",
    "LL............LL",
    "................",
  ];
  return svgBlock('bed', g, {
    'R': '#b81d13',
    'W': '#dedede',
    'B': '#754b24',
    'L': '#4a2c11',
    '.': ' '
  });
}

// 25. Eye of Ender / Dragon (Око Эндера - 1.0.0 Release)
function makeEyeOfEnder() {
  const g = [
    "......GGGG......",
    "....GG1111GG....",
    "...G11222211G...",
    "..G1223333221G..",
    "..G123O44O321G..",
    ".G1234OOOO4321G.",
    ".G1234OOOO4321G.",
    ".G1234OOOO4321G.",
    ".G1234OOOO4321G.",
    ".G123O4444O321G..",
    "..G1234444321G..",
    "..G1223333221G..",
    "...G11222211G...",
    "....GG1111GG....",
    "......GGGG......",
    "................",
  ];
  return svgBlock('ender_eye', g, {
    'G': '#08261e',
    '1': '#0d4234',
    '2': '#156953',
    '3': '#1ea180',
    '4': '#2fe8ba',
    'O': '#d61818',
    '.': ' '
  });
}

// 26. Cobblestone (Булыжник - Classic / Alpha)
function makeCobblestone() {
  const g = [
    "LLLLLLLLLLLLLLLD",
    "LBBDDDBBBDDDBBBD",
    "LBDDDDDDDDDDDDLD",
    "LBDDLLLDBBLLDDLD",
    "LBDDLLLDBBLLDDLD",
    "LBDDDDDDDDDDDDLD",
    "LBBDDDBBBDDDBBBD",
    "LDDLLDBBDDDLDBBD",
    "LDDLLDBBDDDLDBBD",
    "LBDDDDDDDDDDDDLD",
    "LBDDLLLDBBLLDDLD",
    "LBDDLLLDBBLLDDLD",
    "LBDDDDDDDDDDDDLD",
    "LBBDDDBBBDDDBBBD",
    "LDDDDDDDDDDDDDDD",
    "DDDDDDDDDDDDDDDD",
  ];
  return svgBlock('cobblestone', g, {
    'L': '#878787',
    'B': '#696969',
    'D': '#474747',
  });
}

// 27. Blue Ice / Packed Ice (Синий лёд - 26.4 Дроп Ледяные пещеры)
function makeBlueIce() {
  const g = [
    "LLLLLLLLLLLLLLLD",
    "LBBBBBBBBBBBBBBD",
    "LBCCCCCCCCCCCCBD",
    "LBC1111111111CBD",
    "LBC1222222221CBD",
    "LBC1233333321CBD",
    "LBC1234444321CBD",
    "LBC1234444321CBD",
    "LBC1234444321CBD",
    "LBC1233333321CBD",
    "LBC1222222221CBD",
    "LBC1111111111CBD",
    "LBCCCCCCCCCCCCBD",
    "LBBBBBBBBBBBBBBD",
    "LDDDDDDDDDDDDDDD",
    "DDDDDDDDDDDDDDDD",
  ];
  return svgBlock('blue_ice', g, {
    'L': '#b5d5ff',
    'B': '#8abaff',
    'C': '#639fff',
    '1': '#4087f5',
    '2': '#2973e8',
    '3': '#195fd1',
    '4': '#0d47ab',
    'D': '#083380',
  });
}

// 28. Firefly Bush / Wild Flowers (Светлячки / Трава - 1.21.5)
function makeFireflyBush() {
  const g = [
    ".......YY.......",
    "......YYYY......",
    ".......YY.......",
    "...GG......GG...",
    "..GGGG....GGGG..",
    ".GGDDGG..GGDDGG.",
    ".GGDDGG..GGDDGG.",
    "..GGGG....GGGG..",
    "....GG....GG....",
    "......GGGG......",
    ".....GGDDGG.....",
    ".....GGDDGG.....",
    "......GGGG......",
    ".......GG.......",
    ".......BB.......",
    ".......BB.......",
  ];
  return svgBlock('firefly', g, {
    'Y': '#faff54',
    'G': '#4f9429',
    'D': '#2d5e12',
    'B': '#5e4325',
    '.': ' '
  });
}

// 29. Creaking Heart / Pale Oak (Скрипун / Бледный дуб - 1.21.4)
function makePaleHeart() {
  const g = [
    "LLLLLLLLLLLLLLLD",
    "LBBBBBBBBBBBBBBD",
    "LBBMOOOOOOMBBBBD",
    "LBMORRRRRROMBBBD",
    "LBMORFFFFROMBBBD",
    "LBMOFRRRFROMBBBD",
    "LBMOFRRRFROMBBBD",
    "LBMORFFFFROMBBBD",
    "LBMORRRRRROMBBBD",
    "LBBMOOOOOOMBBBBD",
    "LBBBBBBBBBBBBBBD",
    "LBBBBBBBBBBBBBBD",
    "LDDDDDDDDDDDDDDD",
    "DDDDDDDDDDDDDDDD",
    "DDDDDDDDDDDDDDDD",
    "DDDDDDDDDDDDDDDD",
  ];
  return svgBlock('creaking_heart', g, {
    'L': '#c2c0b8',
    'B': '#99978f',
    'M': '#6e6c64',
    'O': '#d1661d',
    'R': '#e87b27',
    'F': '#ff9b3d',
    'D': '#3b3a36',
  });
}

// Write files
const files = {
  'spear.svg': makeSpear(),
  'copper.svg': makeCopperBlock(),
  'mace.svg': makeMace(),
  'cherry.svg': makeCherryLeaves(),
  'sculk.svg': makeSculk(),
  'deepslate.svg': makeDeepslate(),
  'amethyst.svg': makeAmethyst(),
  'netherite.svg': makeNetherite(),
  'honey.svg': makeHoney(),
  'emerald.svg': makeEmerald(),
  'emerald_block.svg': makeEmeraldBlock(),
  'sealantern.svg': makeSeaLantern(),
  'concrete.svg': makeConcrete(),
  'totem.svg': makeTotem(),
  'magma.svg': makeMagma(),
  'elytra.svg': makeElytra(),
  'prismarine.svg': makePrismarine(),
  'grass.svg': makeGrassBlock(),
  'saddle.svg': makeSaddle(),
  'redstone.svg': makeRedstone(),
  'anvil.svg': makeAnvil(),
  'jungle.svg': makeJungleLog(),
  'piston.svg': makePiston(),
  'bed.svg': makeBed(),
  'ender_eye.svg': makeEyeOfEnder(),
  'cobblestone.svg': makeCobblestone(),
  'blue_ice.svg': makeBlueIce(),
  'firefly.svg': makeFireflyBush(),
  'pale_heart.svg': makePaleHeart(),
};

for (const [filename, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(outDir, filename), content.trim(), 'utf8');
}
console.log('Successfully generated', Object.keys(files).length, 'block icons!');
