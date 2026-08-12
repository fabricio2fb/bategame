'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import type { GameType } from '@/lib/types';
import { getGamePath, normalizeRoomCode } from '@/lib/room-code';

export default function LegacyPartidaRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = Array.isArray(params.codigo) ? params.codigo[0] : params.codigo;
  const code = normalizeRoomCode(rawCode);

  useEffect(() => {
    let cancelled = false;

    try {
      const socket = getSocket();
      socket.emit('room:get', { roomCode: code }, (response: any) => {
        if (cancelled) return;
        const gameType = response?.success ? response.room?.settings?.gameType as GameType | undefined : undefined;
        router.replace(getGamePath(code, gameType));
      });
    } catch {
      router.replace(getGamePath(code, 'bateprimeiro'));
    }

    const fallback = window.setTimeout(() => {
      if (!cancelled) router.replace(getGamePath(code, 'bateprimeiro'));
    }, 2500);

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, [code, router]);

  return (
    <div className="flex h-[100dvh] items-center justify-center bg-gradient-to-br from-[#0c1929] via-[#0f2744] to-[#0a1628]">
      <div className="flex flex-col items-center gap-4 text-white/70">
        <div className="h-14 w-14 rounded-full border-4 border-white/15 border-t-white animate-spin" />
        <p className="text-sm font-semibold">Redirecionando partida...</p>
      </div>
    </div>
  );
}
