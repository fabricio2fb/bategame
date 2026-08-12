'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Key } from 'lucide-react';
import { GamePageFooter, GamePageHeader } from '@/components/GamePageChrome';
import { GAME_REGISTRY } from '@/lib/game-registry';
import { getRoomPath, isValidRoomCode, sanitizeRoomCodeInput } from '@/lib/room-code';
import { getSocketDiagnosticsLabel } from '@/lib/socket';
import { useSocketRoom } from '@/hooks/useSocketRoom';
import type { GameType } from '@/lib/types';

interface GenericJoinRoomPageProps {
  gameType: Exclude<GameType, 'bateprimeiro'>;
}

type JoinError = 'not-found' | 'full' | 'started' | 'name-taken' | 'server-error' | null;

const ERROR_MESSAGES: Record<Exclude<JoinError, null>, { title: string; message: string }> = {
  'not-found': { title: 'Sala nao encontrada', message: 'Confira o codigo e tente novamente.' },
  full: { title: 'Sala cheia', message: 'Esta sala atingiu o limite de jogadores.' },
  started: { title: 'Partida em andamento', message: 'Esta partida ja comecou e nao aceita novos jogadores.' },
  'name-taken': { title: 'Nome em uso', message: 'Este nome ja esta sendo usado na sala. Escolha outro.' },
  'server-error': { title: 'Erro de conexao', message: 'Nao foi possivel conectar ao servidor.' },
};

export function GenericJoinRoomPage({ gameType }: GenericJoinRoomPageProps) {
  const router = useRouter();
  const game = GAME_REGISTRY[gameType];
  const { joinRoom, connectionStatus, socketError } = useSocketRoom();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<JoinError>(null);
  const [fieldError, setFieldError] = useState('');
  const normalizedName = playerName.trim().replace(/\s+/g, ' ');
  const canSubmit = normalizedName.length >= 2 && normalizedName.length <= 20 && isValidRoomCode(roomCode) && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setFieldError('');

    if (normalizedName.length < 2) {
      setFieldError('Informe um nome com pelo menos 2 caracteres.');
      return;
    }
    if (normalizedName.length > 20) {
      setFieldError('O nome deve ter no maximo 20 caracteres.');
      return;
    }
    if (!isValidRoomCode(roomCode)) {
      setFieldError('O codigo deve ter 5 caracteres.');
      return;
    }
    if (connectionStatus !== 'connected') {
      setError('server-error');
      return;
    }

    setIsSubmitting(true);
    const result = await joinRoom(roomCode, normalizedName);
    setIsSubmitting(false);

    if (result.success) {
      router.push(getRoomPath(roomCode));
      return;
    }

    const err = result.error || '';
    if (err.includes('nao encontrada') || err.includes('não encontrada') || err.includes('nÃƒÂ£o encontrada')) setError('not-found');
    else if (err.includes('cheia')) setError('full');
    else if (err.includes('comecou') || err.includes('comeÃƒÂ§ou')) setError('started');
    else if (err.includes('em uso')) setError('name-taken');
    else setError('server-error');
  }

  return (
    <div
      className="min-h-screen flex flex-col text-[#0F172A]"
      style={{
        backgroundColor: '#F8FAFC',
        backgroundImage: `linear-gradient(135deg, ${game.accentColor}33 0%, rgba(34,197,94,0.18) 100%), radial-gradient(circle at 74% 18%, rgba(255,255,255,0.42), transparent 26rem)`,
      }}
    >
      <GamePageHeader game={game} />

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-3xl border-2 border-black/15 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.12)] sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl border border-[#CBD5E1] bg-[#F8FAFC]">
              <img src={game.icon} alt={`Icone do jogo ${game.title}`} className="h-10 w-10 object-contain" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: game.accentColor }}>
              {game.title}
            </p>
            <h1 className="mt-1 text-xl font-black text-[#0F172A]">Entrar em sala</h1>
            <p className="mt-1 text-sm text-[#64748B]">Digite seu nome e o codigo recebido do host.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-sm text-[#B91C1C]">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="h-4 w-4" />
                {ERROR_MESSAGES[error].title}
              </div>
              <p className="mt-1 text-xs leading-relaxed">{ERROR_MESSAGES[error].message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fieldError && (
              <div className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-xs font-medium text-[#EF4444]" role="alert">
                {fieldError}
              </div>
            )}

            {connectionStatus !== 'connected' && (
              <div className="rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-3 text-xs font-medium text-[#B45309]" role="alert">
                <p>{connectionStatus === 'error' ? 'Erro de conexao com o servidor.' : 'Conectando ao servidor...'}</p>
                {socketError && <p className="mt-0.5 opacity-80">Detalhe: {socketError}</p>}
                <p className="mt-0.5 opacity-70">URL: {getSocketDiagnosticsLabel()}</p>
              </div>
            )}

            <label className="block space-y-1.5">
              <span className="block text-xs font-semibold text-[#64748B]">Seu nome</span>
              <input
                type="text"
                maxLength={20}
                placeholder="Digite seu nome"
                value={playerName}
                onChange={(event) => {
                  setPlayerName(event.target.value);
                  setFieldError('');
                }}
                className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-3 text-base text-[#0F172A] outline-none transition-colors focus:border-[#3B82F6]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="block text-xs font-semibold text-[#64748B]">Codigo da sala</span>
              <input
                type="text"
                maxLength={5}
                placeholder="B7K9P"
                value={roomCode}
                onChange={(event) => {
                  setRoomCode(sanitizeRoomCodeInput(event.target.value));
                  setError(null);
                  setFieldError('');
                }}
                className="w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 py-3 text-center font-mono text-2xl font-bold uppercase tracking-[0.3em] text-[#0F172A] outline-none transition-colors focus:border-[#3B82F6]"
              />
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-[0_2px_12px_rgba(15,23,42,0.18)] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: game.accentColor }}
            >
              {isSubmitting ? 'Conectando...' : <><Key className="h-4 w-4" /> Entrar em sala</>}
            </button>

            <Link href={`/${game.gameType}`} className="block text-center text-xs font-semibold text-[#64748B] transition-colors hover:text-[#0F172A]">
              Voltar ao jogo
            </Link>
          </form>
        </div>
      </main>

      <GamePageFooter game={game} />
    </div>
  );
}
