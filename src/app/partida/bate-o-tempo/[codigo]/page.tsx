'use client';

import { useParams } from 'next/navigation';
import { BateOTempoRuntime } from '@/components/game-runtime/BateOTempoRuntime';
import { normalizeRoomCode } from '@/lib/room-code';

export default function BateOTempoPartidaPage() {
  const params = useParams();
  const rawCode = Array.isArray(params.codigo) ? params.codigo[0] : params.codigo;
  const code = normalizeRoomCode(rawCode);

  return <BateOTempoRuntime roomCode={code} />;
}
