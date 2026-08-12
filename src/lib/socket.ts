'use client';

import { io, Socket } from 'socket.io-client';

const LOCAL_SOCKET_URL = 'http://127.0.0.1:3002';
const PRODUCTION_SOCKET_URL = 'https://bateprimeiro-socket.onrender.com';
const SOCKET_CONFIG_ERROR = 'Servidor Socket.IO nao configurado. Configure NEXT_PUBLIC_SOCKET_URL com a URL publica do backend.';

let globalSocket: Socket | null = null;

let lastError: string | null = null;
let connectionAttempt = 0;

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
  return PRODUCTION_SOCKET_URL;
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

  connectionAttempt += 1;
  console.info('[socket] connecting', {
    attempt: connectionAttempt,
    url: socketUrl,
    pageOrigin: window.location.origin,
    transports: ['websocket', 'polling'],
  });

  globalSocket = io(socketUrl, {
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
    console.info('[socket] connected', {
      id: globalSocket?.id,
      transport: globalSocket?.io.engine.transport.name,
    });
  });

  globalSocket.io.engine.on('upgrade', (transport) => {
    console.info('[socket] transport upgraded', { transport: transport.name });
  });

  globalSocket.on('disconnect', (reason) => {
    console.warn('[socket] disconnected', { reason });
  });

  globalSocket.on('connect_error', (err) => {
    lastError = err.message;
    const details = err as Error & {
      description?: unknown;
      context?: unknown;
      type?: string;
    };
    console.error('[socket] connect_error', {
      message: err.message,
      type: details.type,
      description: details.description,
      context: details.context,
      url: socketUrl,
      pageOrigin: window.location.origin,
      activeTransport: globalSocket?.io.engine?.transport?.name,
    });
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
