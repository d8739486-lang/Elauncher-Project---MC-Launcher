// Node script to download official pixel-perfect Minecraft PNG textures from PrismarineJS/minecraft-assets repository
import fs from 'fs';
import path from 'path';
import https from 'https';

const outDir = path.resolve('public/minecraft_textures');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Download map: local filename -> github raw url
const textures = {
  // 1.21.11 / Spears
  'spear.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/26.1/items/iron_spear.png',
  
  // 1.21 Tricky Trials & Mace
  'mace.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/items/mace.png',

  // 1.21.9 Copper Age / 1.17 Copper
  'copper_block.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/copper_block.png',
  'copper_bulb.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/copper_bulb.png',

  // 1.21.5 Spring to life / Pale Garden / Creaking
  'creaking_heart.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/creaking_heart.png',
  'cherry_leaves.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/cherry_leaves.png',

  // 1.19 The Wild Update (Sculk)
  'sculk.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/sculk.png',
  'sculk_catalyst.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/sculk_catalyst_top.png',

  // 1.18 Caves & Cliffs II (Deepslate)
  'deepslate.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/deepslate.png',

  // 1.17 Caves & Cliffs I (Amethyst)
  'amethyst_block.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/amethyst_block.png',
  'amethyst_cluster.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/amethyst_cluster.png',

  // 1.16 Nether Update (Netherite Block / Ancient Debris)
  'netherite_block.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/netherite_block.png',

  // 1.15 Buzzy Bees (Honey Block / Honeycomb)
  'honey_block.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/honey_block_side.png',
  'honeycomb_block.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/honeycomb_block.png',

  // 1.14 Village & Pillage (Emerald / Emerald Block / Bell)
  'emerald.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/items/emerald.png',
  'emerald_block.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/emerald_block.png',

  // 1.13 Update Aquatic (Sea Lantern / Conduit)
  'sea_lantern.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/sea_lantern.png',

  // 1.12 World of Color (Cyan / Orange / Red Concrete or Glazed Terracotta)
  'cyan_concrete.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/cyan_concrete.png',
  'magenta_glazed_terracotta.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/magenta_glazed_terracotta.png',

  // 1.11 Exploration (Totem of Undying)
  'totem_of_undying.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/items/totem_of_undying.png',

  // 1.10 Frostburn Update (Magma Block)
  'magma.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/magma.png',

  // 1.9 Combat Update (Elytra)
  'elytra.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/items/elytra.png',

  // 1.8 Bountiful Update (Prismarine)
  'prismarine.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/prismarine.png',

  // 1.7 Update that changed the world (Grass block side)
  'grass_block.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/grass_block_side.png',

  // 1.6 Horse Update (Saddle)
  'saddle.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/items/saddle.png',

  // 1.5 Redstone Update (Redstone Dust Item & Redstone Block)
  'redstone.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/items/redstone.png',
  'redstone_block.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/redstone_block.png',

  // 1.4 Pretty Scary Update (Anvil & Wither Skull)
  'anvil.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/anvil.png',

  // 1.2 Jungle (Jungle Log)
  'jungle_log.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/jungle_log.png',

  // 1.0.0 Release (Ender Eye)
  'ender_eye.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/items/ender_eye.png',

  // Beta 1.7 (Piston)
  'piston.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/piston_side.png',
  'piston_top.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/piston_top.png',

  // Classic / Alpha (Cobblestone)
  'cobblestone.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/cobblestone.png',

  // 26.4 Ice Caves (Blue Ice)
  'blue_ice.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/blue_ice.png',

  // Diamond Sword & Pickaxe
  'diamond_sword.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/items/diamond_sword.png',
  'diamond_pickaxe.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/items/diamond_pickaxe.png',
};

function download(name, url) {
  return new Promise((resolve, reject) => {
    const dest = path.join(outDir, name);
    const file = fs.createWriteStream(dest);

    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        https.get(res.headers.location, (redirectRes) => {
          redirectRes.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`Failed ${url}: status ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function run() {
  console.log('Starting downloading official Minecraft PNG textures from internet...');
  for (const [name, url] of Object.entries(textures)) {
    try {
      await download(name, url);
      console.log(`[OK] ${name}`);
    } catch (e) {
      console.error(`[ERR] ${name}:`, e.message);
    }
  }
  console.log('Finished downloading all textures!');
}

run();
