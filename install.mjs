import { execSync } from 'child_process';
import fs from 'fs';

try {
  console.log("Installing missing tailwind plugins directly...");
  const output = execSync('npm.cmd install @tailwindcss/forms @tailwindcss/typography @tailwindcss/container-queries', { encoding: 'utf-8' });
  fs.writeFileSync('install-log.txt', output);
  console.log("Install completed!");
} catch (e) {
  fs.writeFileSync('install-log.txt', e.stdout + '\n' + (e.stderr || '') + '\n' + e.message);
}
