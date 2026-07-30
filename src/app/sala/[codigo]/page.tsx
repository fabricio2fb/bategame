'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Key, LogOut, Wifi, WifiOff, Volume2, VolumeX } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { LobbyPlayerPanel } from '@/components/LobbyPlayerPanel';
import { LobbyCenterPanel } from '@/components/LobbyCenterPanel';
import { LobbySettingsPanel } from '@/components/LobbySettingsPanel';
import { GameCountdown } from '@/components/GameCountdown';
import { LeaveRoomDialog } from '@/components/LeaveRoomDialog';
import { RemovePlayerDialog } from '@/components/RemovePlayerDialog';
import { EditRoomDialog } from '@/components/EditRoomDialog';
import { LobbySkeleton } from '@/components/LobbySkeleton';
import { useSocketRoom } from '@/hooks/useSocketRoom';
import { RoomSettings } from '@/lib/types';
import { getGamePath, getRoomPath, isValidRoomCode, normalizeRoomCode } from '@/lib/room-code';

export default function SalaPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = Array.isArray(params.codigo) ? params.codigo[0] : params.codigo;
  const code = normalizeRoomCode(rawCode);
  const { room, currentPlayer, connectionStatus, roomLookupComplete, joinRoom, leaveRoom, toggleReady, updateSettings, removePlayer, startGame, error, onGameEvent, offGameEvent } = useSocketRoom(code);

  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState<string | null>(null);
  const [showEditSettings, setShowEditSettings] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameStarting, setGameStarting] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [joinName, setJoinName] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!rawCode || !code || rawCode === code) return;
    router.replace(getRoomPath(code));
  }, [rawCode, code, router]);

  // Listen for game events from the server
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!onGameEvent || !offGameEvent) return;

    const handleCountdown = (data: { count: number }) => {
      setCountdown(data.count);
    };

    const handleGameStarted = () => {
      router.push(getGamePath(code));
    };

    onGameEvent('game:countdown', handleCountdown);
    onGameEvent('game:started', handleGameStarted);

    return () => {
      offGameEvent('game:countdown', handleCountdown);
      offGameEvent('game:started', handleGameStarted);
    };
  }, [onGameEvent, offGameEvent, code, router]);

  // Global countdown timer - navigates when it reaches 0
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      router.push(getGamePath(code));
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(prev => prev !== null ? prev - 1 : null);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, code, router]);

  const handleStartGame = useCallback(async () => {
    setGameStarting(true);
    const result = await startGame();
    if (result.success) {
      setCountdown(3);
    }
    setGameStarting(false);
  }, [startGame]);

  const handleLeaveConfirm = useCallback(() => {
    leaveRoom();
    setShowLeaveDialog(false);
    router.push('/');
  }, [leaveRoom, router]);

  const handleRemoveConfirm = useCallback(() => {
    if (showRemoveDialog) {
      removePlayer(showRemoveDialog);
      setShowRemoveDialog(null);
    }
  }, [showRemoveDialog, removePlayer]);

  const handleSaveSettings = useCallback(async (settings: Partial<RoomSettings>) => {
    await updateSettings(settings);
    setShowEditSettings(false);
  }, [updateSettings]);

  const handleJoinFromDirectLink = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    if (!joinName.trim()) {
      setJoinError('Informe seu nome.');
      return;
    }
    if (!isValidRoomCode(code)) {
      setJoinError('Codigo de sala invalido.');
      return;
    }
    if (connectionStatus !== 'connected') {
      setJoinError('Ainda conectando ao servidor. Tente novamente em instantes.');
      return;
    }
    setJoining(true);
    const result = await joinRoom(code, joinName.trim());
    setJoining(false);
    if (!result.success) {
      setJoinError(result.error || 'Nao foi possivel entrar nesta sala.');
    }
  }, [code, connectionStatus, joinName, joinRoom]);

  if (connectionStatus === 'connecting' || !roomLookupComplete) return <LobbySkeleton />;

  if (!room || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#38BDF8] to-[#4ADE80] flex flex-col">
        <header className="h-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto h-full flex items-center"><Logo /></div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-2 border-black/15 rounded-2xl p-8 sm:p-10 max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#EF4444]/10 flex items-center justify-center mx-auto">
              <LogOut className="w-7 h-7 text-[#EF4444]" />
            </div>
            <h1 className="text-xl font-bold text-[#0F172A]">Sala não encontrada</h1>
            <p className="text-sm text-[#64748B]">{error || 'Confira o código e tente novamente.'}</p>
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/entrar" className="w-full py-2.5 bg-[#F1F5F9] hover:bg-[#CBD5E1] text-[#0F172A] text-sm font-semibold rounded-lg transition-all text-center">Tentar outro código</Link>
              <Link href="/" className="w-full py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-semibold rounded-lg transition-all text-center">Voltar ao início</Link>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#38BDF8] to-[#4ADE80] flex flex-col">
        <header className="h-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto h-full flex items-center justify-between">
            <Logo />
            <Link href="/" className="text-xs sm:text-sm font-medium text-white/80 hover:text-white">Voltar</Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border-2 border-black/15 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center mx-auto mb-3">
                <Key className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Sala {room.code}</p>
              <h1 className="text-xl font-bold text-[#0F172A] mt-1">{room.name}</h1>
              <p className="text-sm text-[#64748B] mt-1">Digite seu nome para entrar no lobby.</p>
            </div>
            <form onSubmit={handleJoinFromDirectLink} className="space-y-4">
              {joinError && (
                <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs font-medium flex items-center gap-2" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{joinError}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <label htmlFor="direct-join-name" className="block text-xs font-semibold text-[#64748B]">
                  Seu nome no jogo <span className="text-[#EF4444]">*</span>
                </label>
                <input id="direct-join-name" type="text" maxLength={20}
                  placeholder="Seu nome no jogo"
                  value={joinName}
                  onChange={e => { setJoinName(e.target.value); setJoinError(''); }}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#3B82F6] rounded-lg px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none transition-colors" />
              </div>
              <button type="submit" disabled={joining}
                className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                {joining ? 'Entrando...' : 'Entrar no lobby'}
              </button>
            </form>
          </motion.div>
        </main>
      </div>
    );
  }

  const isHost = currentPlayer?.isHost ?? false;
  const readyCount = room.players.filter(p => p.isReady && !p.isHost).length;
  const nonHostCount = room.players.filter(p => !p.isHost).length;
  const canStart = isHost && room.players.length >= 2 && nonHostCount > 0 && nonHostCount === readyCount && !gameStarting;

  const getStartDisabledReason = (): string | null => {
    if (!isHost) return null;
    if (room.players.length < 2) return 'É necessário pelo menos mais 1 jogador.';
    const notReady = nonHostCount - readyCount;
    if (notReady > 0) return `Aguardando ${notReady} jogador${notReady > 1 ? 'es' : ''} ficar${notReady > 1 ? 'em' : ''} pronto${notReady > 1 ? 's' : ''}.`;
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#38BDF8] to-[#4ADE80] flex flex-col">
      <AnimatePresence>
        {countdown !== null && (
          <GameCountdown count={countdown} players={room.players} />
        )}
      </AnimatePresence>

      {/* Connection alert bar */}
      {connectionStatus === 'disconnected' && (
        <div className="bg-[#F59E0B]/20 backdrop-blur-sm border-b border-[#F59E0B]/30 px-4 py-2 text-xs text-[#F59E0B] text-center font-medium">
          Reconectando ao servidor...
        </div>
      )}

      {/* Top header */}
      <header className="h-14 px-4 sm:px-6 border-b border-white/10 bg-black/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => setSoundOn(!soundOn)}
              className="p-2 rounded-lg text-white/60 hover:text-white/90 hover:bg-white/10 transition-all cursor-pointer">
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button onClick={() => setShowLeaveDialog(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-all cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 w-full py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 h-full">
          {/* Left column - Players */}
          <div className="lg:col-span-4 space-y-3">
            <LobbyPlayerPanel
              players={room.players}
              currentPlayerId={currentPlayer?.id ?? null}
              isHost={isHost}
              maxPlayers={room.settings.maxPlayers}
              onRemovePlayer={(id) => setShowRemoveDialog(id)}
              showTeams={room.settings.gameMode === 'teams'}
              teams={room.teams}
            />
            {/* Guest ready button on mobile */}
            {!isHost && (
              <div className="lg:hidden">
                <button onClick={toggleReady}
                  className={`w-full py-3.5 font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    currentPlayer?.isReady
                      ? 'bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-[0_4px_16px_rgba(34,197,94,0.35)]'
                      : 'bg-white/90 hover:bg-white text-[#0F172A] shadow-lg'
                  }`}>
                  {currentPlayer?.isReady ? '✅ Pronto' : '👋 Estou pronto'}
                </button>
              </div>
            )}
          </div>

          {/* Center column - Room identity */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center">
            <LobbyCenterPanel
              room={room}
              readyCount={readyCount}
              nonHostCount={nonHostCount}
            />
            {/* Guest ready button on desktop */}
            {!isHost && (
              <div className="hidden lg:block mt-4">
                <button onClick={toggleReady}
                  className={`w-56 py-3.5 font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    currentPlayer?.isReady
                      ? 'bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-[0_4px_16px_rgba(34,197,94,0.35)]'
                      : 'bg-white/90 hover:bg-white text-[#0F172A] shadow-lg'
                  }`}>
                  {currentPlayer?.isReady ? '✅ Pronto' : '👋 Estou pronto'}
                </button>
              </div>
            )}
          </div>

          {/* Right column - Settings and start */}
          <div className="lg:col-span-4 space-y-3">
            <LobbySettingsPanel
              settings={room.settings}
              isHost={isHost}
              canStart={canStart}
              gameStarting={gameStarting}
              startDisabledReason={getStartDisabledReason()}
              countdownActive={countdown !== null}
              onEditSettings={() => setShowEditSettings(true)}
              onStartGame={handleStartGame}
            />
          </div>
        </div>
      </main>

      {/* Bottom status bar */}
      <footer className="h-9 px-4 sm:px-6 bg-black/10 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' ? (
              <><Wifi className="w-3 h-3 text-[#22C55E]" /><span className="text-[10px] text-white/50">Conectado</span></>
            ) : (
              <><WifiOff className="w-3 h-3 text-[#F59E0B]" /><span className="text-[10px] text-white/50">Reconectando...</span></>
            )}
          </div>
          <span className="text-[10px] text-white/30">
            {room.players.length} jogador{room.players.length !== 1 ? 'es' : ''} na sala
          </span>
        </div>
      </footer>

      <LeaveRoomDialog isOpen={showLeaveDialog} isHost={isHost}
        onClose={() => setShowLeaveDialog(false)} onConfirm={handleLeaveConfirm} />

      <RemovePlayerDialog isOpen={showRemoveDialog !== null}
        onClose={() => setShowRemoveDialog(null)} onConfirm={handleRemoveConfirm} />

      {room && (
        <EditRoomDialog isOpen={showEditSettings} settings={room.settings}
          currentPlayers={room.players.length}
          onClose={() => setShowEditSettings(false)} onSave={handleSaveSettings} />
      )}
    </div>
  );
}
