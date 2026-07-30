import { spawnSync } from 'node:child_process';

const isRender = process.env.RENDER === 'true' || !!process.env.RENDER_SERVICE_ID || process.env.BATEPRIMEIRO_SERVICE === 'socket';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const args = isRender
  ? ['run', 'start', '--prefix', 'server']
  : ['run', 'start:web'];

console.log(isRender
  ? '[start] Render environment detected. Starting Socket.IO backend.'
  : '[start] Starting Next.js frontend.');

const result = spawnSync(npmCommand, args, { stdio: 'inherit', shell: true });
if (result.error) {
  console.error('[start] Failed to run command:', npmCommand, args.join(' '), result.error);
}
process.exit(result.status ?? 1);
