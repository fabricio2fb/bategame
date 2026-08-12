'use client';

import { useParams } from 'next/navigation';
import { QualEAPalavraRuntime } from '@/components/game-runtime/QualEAPalavraRuntime';
import { normalizeRoomCode } from '@/lib/room-code';

export default function QualEAPalavraPartidaPage() {
  const params = useParams();
  const rawCode = Array.isArray(params.codigo) ? params.codigo[0] : params.codigo;
  const code = normalizeRoomCode(rawCode);

  return <QualEAPalavraRuntime roomCode={code} />;
}
