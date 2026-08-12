'use client';

import { useParams } from 'next/navigation';
import { QuemChegaMaisPertoRuntime } from '@/components/game-runtime/QuemChegaMaisPertoRuntime';
import { normalizeRoomCode } from '@/lib/room-code';

export default function QuemChegaMaisPertoPartidaPage() {
  const params = useParams();
  const rawCode = Array.isArray(params.codigo) ? params.codigo[0] : params.codigo;
  const code = normalizeRoomCode(rawCode);

  return <QuemChegaMaisPertoRuntime roomCode={code} />;
}
