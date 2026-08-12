import { TresLetrasRuntime } from '@/components/game-runtime/TresLetrasRuntime';

interface PageProps {
  params: Promise<{ codigo: string }>;
}

export default async function TresLetrasPartidaPage({ params }: PageProps) {
  const { codigo } = await params;
  return <TresLetrasRuntime roomCode={codigo} />;
}
