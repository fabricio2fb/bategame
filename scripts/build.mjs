import { spawnSync } from 'node:child_process';

const isRender = process.env.RENDER === 'true' || !!process.env.RENDER_SERVICE_ID || process.env.BATEPRIMEIRO_SERVICE === 'socket';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true });
  if (result.error) {
    console.error('[build] Failed to run command:', command, args.join(' '), result.error);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (isRender) {
  console.log('[build] Render environment detected. Building Socket.IO backend.');
  run(npmCommand, ['ci', '--prefix', 'server', '--include=dev']);
  run(npmCommand, ['run', 'build', '--prefix', 'server']);
} else {
  console.log('[build] Building Next.js frontend.');
  run(npmCommand, ['run', 'build:web']);
}
