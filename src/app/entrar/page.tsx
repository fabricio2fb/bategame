'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Key, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useSocketRoom } from '@/hooks/useSocketRoom';
import { getRoomPath, isValidRoomCode, sanitizeRoomCodeInput } from '@/lib/room-code';

type JoinError = 'not-found' | 'full' | 'started' | 'name-taken' | 'server-error' | null;

const ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
  'not-found': { title: 'Sala não encontrada', message: 'Confira o código e tente novamente.' },
  'full': { title: 'Sala cheia', message: 'Esta sala atingiu o limite de jogadores.' },
  'started': { title: 'Partida em andamento', message: 'Esta partida já começou e não aceita novos jogadores.' },
  'name-taken': { title: 'Nome em uso', message: 'Este nome já está sendo usado na sala. Escolha outro.' },
  'server-error': { title: 'Erro de conexão', message: 'Não foi possível conectar ao servidor.' },
};

export default function EntrarPage() {
  const router = useRouter();
  const { joinRoom, connectionStatus, socketError } = useSocketRoom();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<JoinError>(null);
  const [fieldError, setFieldError] = useState('');
  const normalizedName = playerName.trim().replace(/\s+/g, ' ');
  const canSubmit = normalizedName.length >= 2 && normalizedName.length <= 20 && isValidRoomCode(roomCode) && !isSubmitting;

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomCode(sanitizeRoomCodeInput(e.target.value));
    setError(null);
    setFieldError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setFieldError('');

    if (normalizedName.length < 2) {
      setFieldError('Informe um nome com pelo menos 2 caracteres.');
      return;
    }
    if (normalizedName.length > 20) {
      setFieldError('O nome deve ter no máximo 20 caracteres.');
      return;
    }
    if (!isValidRoomCode(roomCode)) {
      setFieldError('O código deve ter 5 caracteres.');
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
    } else {
      const err = result.error || '';
      if (err.includes('não encontrada')) setError('not-found');
      else if (err.includes('cheia')) setError('full');
      else if (err.includes('começou')) setError('started');
      else if (err.includes('em uso')) setError('name-taken');
      else setError('server-error');
    }
  };

  if (error) {
    const err = ERROR_MESSAGES[error];
    return (
      <div className="min-h-screen flex flex-col">
        <header className="h-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto h-full flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2"><Logo /></Link>
            <Link href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-[#64748B] hover:text-[#0F172A] bg-white border border-[#CBD5E1] rounded-lg transition-colors">
              <ArrowLeft className="w-4 h-4" /><span>Voltar</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white border-2 border-black/15 rounded-2xl p-8 sm:p-10 max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#EF4444]/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7 text-[#EF4444]" />
            </div>
            <h1 className="text-xl font-bold text-[#0F172A]">{err.title}</h1>
            <p className="text-sm text-[#64748B]">{err.message}</p>
            <div className="flex flex-col gap-2 pt-2">
              <button onClick={() => setError(null)}
                className="w-full py-2.5 bg-[#F1F5F9] hover:bg-[#CBD5E1] text-[#0F172A] text-sm font-semibold rounded-lg transition-colors cursor-pointer">
                Tentar outro código
              </button>
              <Link href="/"
                className="w-full py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-semibold rounded-lg transition-colors text-center">
                Voltar ao início
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2"><Logo /></Link>
          <Link href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-[#64748B] hover:text-[#0F172A] bg-white border border-[#CBD5E1] rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" /><span>Voltar</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white border-2 border-black/15 rounded-2xl p-6 sm:p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center mx-auto mb-3">
              <Key className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <h1 className="text-xl font-bold text-[#0F172A]">Entrar em uma sala</h1>
            <p className="text-sm text-[#64748B] mt-1">Digite seu nome e o código da sala fornecido.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fieldError && (
              <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs font-medium" role="alert">
                {fieldError}
              </div>
            )}
            {connectionStatus !== 'connected' && (
              <div className={`p-3 rounded-lg text-xs font-medium ${
                connectionStatus === 'error'
                  ? 'bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444]'
                  : 'bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B]'
              }`} role="alert">
                <p>
                  {connectionStatus === 'error'
                    ? 'Erro de conexão com o servidor'
                    : 'Conectando ao servidor...'}
                </p>
                {socketError && (
                  <p className="mt-0.5 opacity-80">Detalhe: {socketError}</p>
                )}
                <p className="mt-0.5 opacity-70">
                  URL: {process.env.NEXT_PUBLIC_SOCKET_URL || 'http://127.0.0.1:3002'}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="player-name" className="block text-xs font-semibold text-[#64748B]">
                Seu nome <span className="text-[#EF4444]">*</span>
              </label>
              <input id="player-name" type="text" maxLength={20}
                placeholder="Digite seu nome"
                value={playerName} onChange={e => { setPlayerName(e.target.value); setFieldError(''); }}
                className={`w-full bg-[#F8FAFC] border rounded-lg px-3.5 py-3 text-base text-[#0F172A] placeholder-[#94A3B8] outline-none transition-colors ${
                  fieldError ? 'border-[#EF4444]' : 'border-[#CBD5E1] focus:border-[#3B82F6]'
                }`}
                aria-invalid={!!fieldError}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="room-code" className="block text-xs font-semibold text-[#64748B]">
                Código da sala <span className="text-[#EF4444]">*</span>
              </label>
              <input id="room-code" type="text" maxLength={5}
                placeholder="B7K9P"
                value={roomCode} onChange={handleCodeChange}
                className={`w-full bg-[#F8FAFC] border rounded-lg px-3.5 py-3 text-center text-2xl font-mono font-bold tracking-[0.3em] text-[#0F172A] placeholder-[#94A3B8] uppercase outline-none transition-colors ${
                  fieldError ? 'border-[#EF4444]' : 'border-[#CBD5E1] focus:border-[#3B82F6]'
                }`}
                aria-invalid={!!fieldError}
              />
              <p className="text-[11px] text-[#94A3B8]">Código fornecido pelo apresentador da sala.</p>
            </div>

            <button type="submit" disabled={!canSubmit}
              className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_10px_rgba(59,130,246,0.25)] hover:shadow-[0_4px_14px_rgba(59,130,246,0.4)]">
              {isSubmitting ? <span>Conectando...</span> : <><Key className="w-4 h-4" /><span>Entrar na partida</span></>}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
