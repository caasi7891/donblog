const fs = require('fs');
const path = require('path');

const root = __dirname;
const imgDir = path.join(root, 'img');
const pubDir = path.join(root, 'public');

const files = ['dev_img.jpg', 'trading_img.jpg', 'travel_img.jpg'];

for (const file of files) {
  const src = path.join(imgDir, file);
  const dst = path.join(pubDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    fs.unlinkSync(src);
    console.log('Moved:', file);
  } else {
    console.log('Not found:', src);
  }
}

// Remove img dir if empty
try {
  fs.rmdirSync(imgDir);
  console.log('Removed img/ dir');
} catch (e) {
  console.log('img/ dir not removed:', e.message);
}

console.log('Done');
