// Download 100% square 1:1 crisp Minecraft textures for any animated/stretched ones
import fs from 'fs';
import path from 'path';
import https from 'https';

const outDir = path.resolve('public/minecraft_textures');

const updates = {
  // 1.19 The Wild Update -> Sculk Catalyst Top (16x16 square crystal) or Echo Shard
  'sculk.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/sculk_catalyst_top.png',

  // 1.10 Frostburn -> Magma Cream (16x16 square glowing magma ball)
  'magma.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/items/magma_cream.png',

  // 1.8 Bountiful Update -> Prismarine Bricks (16x16 square block) or Prismarine Shard
  'prismarine.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/prismarine_bricks.png',
  'prismarine_shard.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/items/prismarine_shard.png',

  // 1.13 Update Aquatic -> Heart of the Sea (16x16 glowing orb) & Trident
  'heart_of_the_sea.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/items/heart_of_the_sea.png',
  'trident.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/items/trident.png',

  // 1.12 World of Color -> Glazed Terracotta or Rainbow / Cyan Dye
  'glazed_terracotta.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/blocks/magenta_glazed_terracotta.png',
  'cyan_dye.png': 'https://raw.githubusercontent.com/PrismarineJS/minecraft-assets/master/data/1.21.4/items/cyan_dye.png',
};

function download(name, url) {
  return new Promise((resolve, reject) => {
    const dest = path.join(outDir, name);
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        reject(new Error('Status ' + res.statusCode));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

async function run() {
  for (const [name, url] of Object.entries(updates)) {
    try {
      await download(name, url);
      console.log('Fixed texture:', name);
    } catch(e) {
      console.error('Error fixing:', name, e.message);
    }
  }
}

run();
