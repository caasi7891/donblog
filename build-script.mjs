import { execSync } from 'child_process';
import fs from 'fs';

try {
  const output = execSync('npm.cmd run build', { encoding: 'utf-8', stdio: 'pipe' });
  fs.writeFileSync('build-output.txt', output);
  console.log("Build Success. Output saved.");
} catch (err) {
  fs.writeFileSync('build-output.txt', err.stdout + '\n' + (err.stderr || '') + '\n' + err.message);
  console.log("Build Failed. Output saved.");
}
