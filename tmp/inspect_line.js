import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\pc1\\donblog\\app\\api\\trading\\summary\\route.ts', 'utf8');
const lines = content.split(/\r?\n/);
for (let i = 70; i < 75; i++) {
  console.log(`Line ${i+1}:`, JSON.stringify(lines[i]));
}
