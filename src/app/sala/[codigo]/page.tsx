'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Home, LogOut, Wifi, WifiOff, Volume2, VolumeX } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { LobbyPlayerPanel } from '@/components/LobbyPlayerPanel';
import { LobbyCenterPanel } from '@/components/LobbyCenterPanel';
import { LobbySettingsPanel } from '@/components/LobbySettingsPanel';
import { GameCountdown } from '@/components/GameCountdown';
import { LeaveRoomDialog } from '@/components/LeaveRoomDialog';
import { RemovePlayerDialog } from '@/components/RemovePlayerDialog';
import { EditRoomDialog } from '@/components/EditRoomDialog';
import { LobbySkeleton } from '@/components/LobbySkeleton';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { RoomNotFoundState } from '@/components/RoomNotFoundState';
import { useSocketRoom } from '@/hooks/useSocketRoom';
import { RoomSettings } from '@/lib/types';
import { GAME_REGISTRY } from '@/lib/game-registry';
import { getGamePath, getRoomPath, isValidRoomCode, normalizeRoomCode } from '@/lib/room-code';

interface ComingSoonState {
  gameType: string;
  title: string;
  message: string;
}

export default function SalaPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = Array.isArray(params.codigo) ? params.codigo[0] : params.codigo;
  const code = normalizeRoomCode(rawCode);
  const { room, currentPlayer, connectionStatus, roomLookupComplete, joinRoom, leaveRoom, toggleReady, updateSettings, removePlayer, startGame, chooseTeam, error, onGameEvent, offGameEvent } = useSocketRoom(code);

  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState<string | null>(null);
  const [showEditSettings, setShowEditSettings] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameStarting, setGameStarting] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [joinName, setJoinName] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [comingSoon, setComingSoon] = useState<ComingSoonState | null>(null);

  useEffect(() => {
    if (!rawCode || !code || rawCode === code) return;
    router.replace(getRoomPath(code));
  }, [rawCode, code, router]);

  useEffect(() => {
    const gameType = room?.settings.gameType || 'bateprimeiro';
    const icon = GAME_REGISTRY[gameType]?.icon || GAME_REGISTRY.bateprimeiro.icon;
    const title = GAME_REGISTRY[gameType]?.title || GAME_REGISTRY.bateprimeiro.title;
    const iconLinks = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]'));

    document.title = `${title} | Tempale`;

    if (iconLinks.length === 0) {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.sizes = 'any';
      link.href = icon;
      document.head.appendChild(link);
      return;
    }

    for (const link of iconLinks) {
      link.type = 'image/png';
      link.sizes = 'any';
      link.href = icon;
    }
  }, [room?.settings.gameType]);

  // Listen for game events from the server
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!onGameEvent || !offGameEvent) return;

    const handleCountdown = (data: { count: number }) => {
      setComingSoon(null);
      setCountdown(data.count);
    };

    const handleGameStarted = () => {
      setComingSoon(null);
      router.push(getGamePath(code, room?.settings.gameType));
    };

    const handleComingSoon = (data: ComingSoonState) => {
      setCountdown(null);
      setGameStarting(false);
      setComingSoon(data);
    };

    onGameEvent('game:countdown', handleCountdown);
    onGameEvent('game:started', handleGameStarted);
    onGameEvent('game:coming-soon', handleComingSoon);

    return () => {
      offGameEvent('game:countdown', handleCountdown);
      offGameEvent('game:started', handleGameStarted);
      offGameEvent('game:coming-soon', handleComingSoon);
    };
  }, [onGameEvent, offGameEvent, code, router, room?.settings.gameType]);

  // Global countdown timer - navigates when it reaches 0
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      router.push(getGamePath(code, room?.settings.gameType));
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(prev => prev !== null ? prev - 1 : null);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, code, router, room?.settings.gameType]);

  const handleStartGame = useCallback(async () => {
    setGameStarting(true);
    const result = await startGame();
    if (result.success && !result.comingSoon) {
      setCountdown(3);
    }
    setGameStarting(false);
  }, [startGame]);

  const handleLeaveConfirm = useCallback(() => {
    leaveRoom();
    setShowLeaveDialog(false);
    router.push('/bateprimeiro');
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
    return <RoomNotFoundState gameType="bateprimeiro" message={error || 'Confira o codigo e tente novamente.'} />;
  }

  const gameType = room.settings.gameType || 'bateprimeiro';
  const game = GAME_REGISTRY[gameType];

  if (!currentPlayer) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{
          backgroundColor: '#0F172A',
          backgroundImage:
            gameType === 'bateprimeiro'
              ? 'linear-gradient(to bottom right, #38BDF8, #4ADE80)'
              : `radial-gradient(circle at 50% 20%, ${game.accentColor}55, transparent 30rem), linear-gradient(to bottom right, #0F172A, #1E293B)`,
        }}
      >
        <header className="h-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto h-full flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/90 shadow-sm">
                <img src={game.icon} alt="" className="h-7 w-7 object-contain" />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-black text-white">{game.title}</span>
                {gameType === 'bateprimeiro' && (
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/50">BatePrimeiro</span>
                )}
              </span>
            </Link>
            <Link href="/" className="text-xs sm:text-sm font-medium text-white/80 hover:text-white">Hub</Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border-2 border-black/15 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center mx-auto mb-3">
                <img src={game.icon} alt={`Icone do jogo ${game.title}`} className="h-10 w-10 object-contain" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: game.accentColor }}>{game.title}</p>
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
                className="w-full py-3 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: game.accentColor }}>
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
  const manualTeamSelection = room.settings.gameMode === 'teams' && room.settings.teamAssignmentMode === 'manual';
  const teamCapacity = Math.ceil(room.settings.maxPlayers / (room.settings.teamCount || room.teams.length || 1));
  const assignedTeamCounts = room.teams.map(team => team.playerIds.length);
  const hasUnassignedPlayers = manualTeamSelection && room.players.some(player => !player.teamId);
  const hasUnbalancedTeams =
    manualTeamSelection &&
    assignedTeamCounts.length > 1 &&
    Math.max(...assignedTeamCounts) - Math.min(...assignedTeamCounts) > 1;

  const getStartDisabledReason = (): string | null => {
    if (!isHost) return null;
    if (room.players.length < 2) return 'É necessário pelo menos mais 1 jogador.';
    const notReady = nonHostCount - readyCount;
    if (notReady > 0) return `Aguardando ${notReady} jogador${notReady > 1 ? 'es' : ''} ficar${notReady > 1 ? 'em' : ''} pronto${notReady > 1 ? 's' : ''}.`;
    return null;
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: '#0F172A',
        backgroundImage:
          gameType === 'bateprimeiro'
            ? 'linear-gradient(to bottom right, #38BDF8, #4ADE80)'
            : `radial-gradient(circle at 50% 20%, ${game.accentColor}55, transparent 30rem), linear-gradient(to bottom right, #0F172A, #1E293B)`,
      }}
    >
      <AnimatePresence>
        {countdown !== null && (
          <GameCountdown
            count={countdown}
            players={room.players}
            accentColor={game.accentColor}
            gameIcon={game.icon}
            gameTitle={game.title}
          />
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
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/20 bg-white/90 shadow-sm">
              <img src={game.icon} alt="" className="h-6 w-6 object-contain" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-black text-white">{game.title}</span>
              {gameType === 'bateprimeiro' && (
                <span className="block text-[10px] font-bold uppercase tracking-wider text-white/50">BatePrimeiro</span>
              )}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              aria-label="Voltar ao hub"
              className="grid h-9 w-9 place-items-center rounded-lg text-white/65 transition-all hover:bg-white/10 hover:text-white sm:hidden"
            >
              <Home className="h-4 w-4" />
            </Link>
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
        {comingSoon ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-2xl flex-col items-center justify-center text-center"
          >
            <div className="grid h-28 w-28 place-items-center rounded-[2rem] border border-white/25 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.24)]">
              <img src={game.icon} alt={`Icone do jogo ${game.title}`} className="h-20 w-20 object-contain" />
            </div>
            <p className="mt-6 text-xs font-black uppercase tracking-wider" style={{ color: game.accentColor }}>
              Em breve
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">
              {comingSoon.title} ainda esta em desenvolvimento
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
              {comingSoon.message} A sala continua ativa para todos os jogadores.
            </p>
            <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setComingSoon(null)}
                className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold text-white shadow-[0_4px_18px_rgba(15,23,42,0.22)]"
                style={{ backgroundColor: game.accentColor }}
              >
                Voltar ao lobby
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/15"
              >
                Voltar ao hub
              </Link>
            </div>
          </motion.div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 h-full">
          {/* Left column - Players */}
          <div className="lg:col-span-4 space-y-3">
            <LobbyPlayerPanel
              players={room.players}
              currentPlayerId={currentPlayer?.id ?? null}
              isHost={isHost}
              maxPlayers={room.settings.maxPlayers}
              accentColor={game.accentColor}
              onRemovePlayer={(id) => setShowRemoveDialog(id)}
              showTeams={room.settings.gameMode === 'teams'}
              teams={room.teams}
            />
            {manualTeamSelection && (
              <div className="rounded-2xl border-2 border-black/15 bg-white/90 p-4 shadow-lg backdrop-blur-sm">
                <div className="mb-3">
                  <h2 className="text-sm font-bold text-[#0F172A]">Escolha seu time</h2>
                  <p className="mt-1 text-xs font-semibold text-[#64748B]">
                    Limite de {teamCapacity} jogador{teamCapacity !== 1 ? 'es' : ''} por time.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {room.teams.map((team) => {
                    const isCurrentTeam = currentPlayer?.teamId === team.id;
                    const isFull = team.playerIds.length >= teamCapacity && !isCurrentTeam;
                    const teamPlayers = room.players.filter(player => player.teamId === team.id);

                    return (
                      <button
                        key={team.id}
                        type="button"
                        disabled={isFull || isCurrentTeam}
                        onClick={async () => {
                          const result = await chooseTeam(team.id);
                          if (!result.success) setJoinError(result.error || 'Nao foi possivel entrar no time.');
                        }}
                        className="rounded-xl border-2 bg-[#F8FAFC] p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-55"
                        style={{ borderColor: isCurrentTeam ? team.color : '#CBD5E1' }}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-black text-[#0F172A]" style={{ color: team.color }}>
                            Time {team.name}
                          </span>
                          <span className="text-[11px] font-bold text-[#64748B]">
                            {team.playerIds.length}/{teamCapacity}
                          </span>
                        </span>
                        <span className="mt-2 flex min-h-8 flex-wrap gap-1.5">
                          {teamPlayers.length > 0 ? (
                            teamPlayers.map(player => (
                              <span key={player.id} className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-[#475569]">
                                <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} className="h-5 w-5" textClassName="text-[7px]" />
                                <span className="truncate">{player.name}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs font-semibold leading-relaxed text-[#64748B]">Nenhum jogador ainda</span>
                          )}
                        </span>
                        <span className="mt-2 block text-[11px] font-black uppercase tracking-wider" style={{ color: team.color }}>
                          {isCurrentTeam ? 'Voce esta aqui' : isFull ? 'Time cheio' : 'Entrar neste time'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {(hasUnassignedPlayers || hasUnbalancedTeams) && (
                  <div className="mt-3 rounded-xl border border-[#F59E0B]/30 bg-[#FFFBEB] px-3 py-2 text-xs font-semibold text-[#92400E]">
                    {hasUnassignedPlayers
                      ? 'Ainda tem jogador sem time. O host pode iniciar mesmo assim.'
                      : 'Os times estao desbalanceados, mas o host ainda pode iniciar.'}
                  </div>
                )}
                {joinError && (
                  <div className="mt-3 rounded-xl border border-[#EF4444]/30 bg-[#FEF2F2] px-3 py-2 text-xs font-semibold text-[#B91C1C]">
                    {joinError}
                  </div>
                )}
              </div>
            )}
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
              gameTitle={game.title}
              gameIcon={game.icon}
              accentColor={game.accentColor}
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
              accentColor={game.accentColor}
              onEditSettings={() => setShowEditSettings(true)}
              onStartGame={handleStartGame}
            />
          </div>
        </div>
        )}
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
