const fs = require('fs');

const buf = fs.readFileSync('public/loaders/forge_fav.ico');
const numImages = buf.readUInt16LE(4);
console.log('Number of images in ICO:', numImages);

for (let i = 0; i < numImages; i++) {
  const offset = 6 + i * 16;
  const width = buf[offset] || 256;
  const height = buf[offset + 1] || 256;
  const size = buf.readUInt32LE(offset + 8);
  const dataOffset = buf.readUInt32LE(offset + 12);
  console.log('Image', i, ':', width, 'x', height, 'size:', size, 'offset:', dataOffset);
  const imgData = buf.subarray(dataOffset, dataOffset + size);
  const isPng = imgData.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
  console.log('Is PNG?', isPng);
  if (isPng) {
    fs.writeFileSync(`public/loaders/forge_raw_${width}.png`, imgData);
  }
}
