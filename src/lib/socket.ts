'use client';

import { io, Socket } from 'socket.io-client';

const LOCAL_SOCKET_URL = 'http://127.0.0.1:3002';
const SOCKET_CONFIG_ERROR = 'Servidor Socket.IO nao configurado. Configure NEXT_PUBLIC_SOCKET_URL com a URL publica do backend.';

let globalSocket: Socket | null = null;

let lastError: string | null = null;

function normalizeSocketUrl(value: string): string {
  return value.trim().replace(/\/$/, '');
}

function isLocalBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  return ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
}

export function getSocketUrl(): string | null {
  const configuredUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (configuredUrl?.trim()) return normalizeSocketUrl(configuredUrl);
  if (isLocalBrowser() || process.env.NODE_ENV !== 'production') return LOCAL_SOCKET_URL;
  return null;
}

export function getSocketDiagnosticsLabel(): string {
  return getSocketUrl() ?? 'NEXT_PUBLIC_SOCKET_URL nao configurada';
}

export function getLastSocketError(): string | null {
  return lastError;
}

export function getSocket(): Socket {
  if (typeof window === 'undefined') {
    throw new Error('Socket cannot be used during server-side rendering');
  }

  if (globalSocket?.connected) {
    return globalSocket;
  }

  if (globalSocket) {
    globalSocket.connect();
    return globalSocket;
  }

  const socketUrl = getSocketUrl();
  if (!socketUrl) {
    lastError = SOCKET_CONFIG_ERROR;
    throw new Error(SOCKET_CONFIG_ERROR);
  }

  console.log(`[socket] Connecting to ${socketUrl}...`);

  globalSocket = io(socketUrl, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    transports: ['polling', 'websocket'],
  });

  globalSocket.on('connect', () => {
    lastError = null;
    console.log(`[socket] Connected: ${globalSocket?.id}`);
  });

  globalSocket.on('disconnect', (reason) => {
    console.log(`[socket] Disconnected: ${reason}`);
  });

  globalSocket.on('connect_error', (err) => {
    lastError = err.message;
    console.error(`[socket] Connection error:`, err.message);
  });

  return globalSocket;
}

export function disconnectSocket(): void {
  if (globalSocket) {
    globalSocket.removeAllListeners();
    globalSocket.disconnect();
    globalSocket = null;
  }
}
