'use client';

import React, { useMemo, useState } from 'react';
import { Activity, Settings, Users } from 'lucide-react';
import { GameHeader } from '@/components/partida1/GameHeader';
import { MobileScoreBar } from '@/components/partida1/MobileScoreBar';
import { ScoreboardPanel } from '@/components/partida1/ScoreboardPanel';
import { FinalResults } from '@/components/FinalResults';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { GAME_REGISTRY } from '@/lib/game-registry';
import type { PartidaShellProps } from './PartidaShell.types';

export function PartidaShell({
  gameTitle,
  category = '',
  status,
  questionNumber,
  totalQuestions,
  timer,
  soundOn,
  currentPlayerId,
  isHost,
  scores,
  teamScores = [],
  settings,
  settingsSummary,
  connectionStatus,
  sidePanel,
  children,
  onToggleSound,
  onLeave,
  onRematch,
}: PartidaShellProps) {
  const [showPlayersPanel, setShowPlayersPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const shellGame = settings?.gameType ? GAME_REGISTRY[settings.gameType] : null;
  const accentColor = shellGame?.accentColor || '#3B82F6';

  const scoreRows = useMemo(() => {
    const topScore = Math.max(0, ...scores.map((score) => score.score));
    return scores.map((score) => ({
      id: score.playerId,
      name: score.name,
      avatarUrl: score.avatarUrl,
      score: score.score,
      isCurrent: score.playerId === currentPlayerId,
      isLeader: score.score === topScore,
      justScored: false,
    }));
  }, [currentPlayerId, scores]);

  if (status === 'game-finished') {
    return (
      <FinalResults
        scores={scores}
        currentPlayerId={currentPlayerId}
        isHost={isHost}
        accentColor={accentColor}
        onRematch={onRematch || (() => undefined)}
        onLeave={onLeave}
      />
    );
  }

  return (
    <div className="h-[100dvh] lg:h-screen bg-gradient-to-br from-[#0c1929] via-[#0f2744] to-[#0a1628] flex flex-col overflow-hidden">
      {connectionStatus === 'disconnected' && (
        <div className="bg-amber-500/20 backdrop-blur-sm px-4 py-1 text-[10px] text-amber-300 text-center font-medium">
          Reconectando ao servidor...
        </div>
      )}
      {connectionStatus === 'error' && (
        <div className="bg-red-500/20 backdrop-blur-sm px-4 py-1 text-[10px] text-red-200 text-center font-medium">
          Nao foi possivel conectar. Tentando novamente...
        </div>
      )}

      <GameHeader
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        category={category || gameTitle}
        timer={timer}
        soundOn={soundOn}
        gameTitle={shellGame?.gameType === 'bateprimeiro' ? undefined : (shellGame?.title || gameTitle)}
        gameIcon={shellGame?.gameType === 'bateprimeiro' ? undefined : shellGame?.icon}
        accentColor={accentColor}
        onToggleSound={onToggleSound}
        isHost={isHost}
        players={scores.map((score) => ({ id: score.playerId, name: score.name, avatarUrl: score.avatarUrl, score: score.score }))}
        settingsSummary={settingsSummary}
        onLeave={onLeave}
        onViewPlayers={() => setShowPlayersPanel(true)}
        onViewSettings={() => setShowSettingsPanel(true)}
      />

      <MobileScoreBar players={scoreRows} />

      <div className="flex-1 flex min-h-0">
        <div className="hidden lg:flex lg:w-64 xl:w-72 flex-col p-3 gap-3 overflow-y-auto">
          <ScoreboardPanel players={scoreRows} />
        </div>

        <main className="flex-1 min-w-0 overflow-hidden">
          <div className="h-full overflow-y-auto px-3 py-4 sm:px-5 lg:px-6 lg:py-5">
            {children}
          </div>
        </main>

        <aside className="hidden lg:flex lg:w-56 xl:w-64 flex-col p-3 gap-3 overflow-y-auto">
          {sidePanel || (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/70">
              <div className="mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#38BDF8]" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">Rodada</span>
              </div>
              <p className="text-sm leading-relaxed">
                Acompanhe os palpites e a revelacao da rodada aqui.
              </p>
            </div>
          )}
        </aside>
      </div>

      {showPlayersPanel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center" onClick={() => setShowPlayersPanel(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#3B82F6]" />
              <h2 className="text-base font-bold text-[#0F172A]">Jogadores</h2>
            </div>
            <div className="space-y-2">
              {scoreRows.map((player) => (
                <div key={player.id} className="flex items-center justify-between rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2 font-semibold text-[#0F172A]">
                    <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} className="h-7 w-7" textClassName="text-[10px]" />
                    <span className="truncate">{player.name}</span>
                  </span>
                  <span className="text-[#64748B]">{player.score} pts</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowPlayersPanel(false)} className="mt-4 w-full rounded-xl bg-[#F1F5F9] py-2.5 text-sm font-semibold text-[#0F172A]">
              Fechar
            </button>
          </div>
        </div>
      )}

      {showSettingsPanel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center" onClick={() => setShowSettingsPanel(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4 text-[#3B82F6]" />
              <h2 className="text-base font-bold text-[#0F172A]">Configuracoes da sala</h2>
            </div>
            <p className="text-sm text-[#64748B]">{settingsSummary || 'Configuracoes sincronizadas pelo servidor.'}</p>
            {settings?.gameMode === 'teams' && teamScores.length > 0 && (
              <div className="mt-3 rounded-xl bg-[#F8FAFC] p-3">
                <p className="text-xs font-bold uppercase text-[#64748B]">Times</p>
                <div className="mt-2 space-y-1">
                  {teamScores.map((team) => (
                    <div key={team.teamId} className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#0F172A]">{team.name}</span>
                      <span className="text-[#64748B]">{team.score} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setShowSettingsPanel(false)} className="mt-4 w-full rounded-xl bg-[#F1F5F9] py-2.5 text-sm font-semibold text-[#0F172A]">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
