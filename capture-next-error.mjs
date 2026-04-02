import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const child = spawn('npx.cmd', ['next', 'dev'], { cwd: process.cwd(), env: process.env });
let logs = '';

child.stdout.on('data', (d) => { logs += d.toString(); });
child.stderr.on('data', (d) => { logs += d.toString(); });

setTimeout(() => {
  fs.writeFileSync(path.join(process.cwd(), 'next-logs.txt'), logs);
  child.kill();
}, 12000);
