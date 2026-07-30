'use client';

import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';

export function SocketBootstrap() {
  useEffect(() => {
    try {
      getSocket();
    } catch (error) {
      console.warn('[socket] Bootstrap skipped:', error instanceof Error ? error.message : error);
    }
  }, []);

  return null;
}
