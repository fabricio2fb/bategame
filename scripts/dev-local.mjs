import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://127.0.0.1:3002';
const webPort = process.env.WEB_PORT || '3001';
const serverPort = process.env.PORT || '3002';
const clientUrls =
  process.env.CLIENT_URLS || `http://localhost:${webPort},http://127.0.0.1:${webPort},http://localhost:3000`;

const processes = [];

function start(name, args, env) {
  const child = spawn(npmCommand, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      ...env,
    },
  });

  processes.push(child);

  child.on('exit', (code, signal) => {
    if (signal) return;
    if (code && code !== 0) {
      console.error(`[dev:local] ${name} exited with code ${code}`);
      stopAll();
      process.exit(code);
    }
  });
}

function stopAll() {
  for (const child of processes) {
    if (!child.killed) child.kill();
  }
}

process.on('SIGINT', () => {
  stopAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopAll();
  process.exit(0);
});

console.log('[dev:local] Starting local frontend and Socket.IO backend.');
console.log(`[dev:local] Frontend: http://localhost:${webPort}`);
console.log(`[dev:local] Socket.IO: ${socketUrl}`);

start('server', ['run', 'dev', '--prefix', 'server'], {
  NODE_ENV: 'development',
  PORT: serverPort,
  CLIENT_URLS: clientUrls,
});

start('web', ['run', 'dev:web'], {
  NODE_ENV: 'development',
  NEXT_PUBLIC_SOCKET_URL: socketUrl,
});
