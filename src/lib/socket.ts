'use client';

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://127.0.0.1:3002';

let globalSocket: Socket | null = null;

let lastError: string | null = null;

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

  console.log(`[socket] Connecting to ${SOCKET_URL}...`);

  globalSocket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    transports: ['websocket', 'polling'],
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

export function getSocketUrl(): string {
  return SOCKET_URL;
}
