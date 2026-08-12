'use client';

import React from 'react';
import { CheckCircle2, Type } from 'lucide-react';
import { PartidaShell } from './PartidaShell';
import { RoomNotFoundState } from '@/components/RoomNotFoundState';
import { QualEAPalavraGameArea } from './QualEAPalavraGameArea';
import { useQualEAPalavraRuntime } from '@/hooks/useQualEAPalavraRuntime';
import { GAME_REGISTRY } from '@/lib/game-registry';

interface QualEAPalavraRuntimeProps {
  roomCode: string;
}

export function QualEAPalavraRuntime({ roomCode }: QualEAPalavraRuntimeProps) {
  const runtime = useQualEAPalavraRuntime(roomCode);
  const attemptedCount = runtime.submittedPlayerIds.length;
  const accentColor = GAME_REGISTRY['qual-e-a-palavra'].accentColor;

  if (runtime.status === 'error') {
    return <RoomNotFoundState gameType="qual-e-a-palavra" />;
  }

  return (
    <PartidaShell
      roomCode={roomCode}
      gameTitle="Qual e a Palavra"
      category={runtime.currentWord?.category || 'Letras embaralhadas'}
      status={runtime.status}
      questionNumber={runtime.questionNumber}
      totalQuestions={runtime.totalRounds}
      timer={runtime.timer}
      soundOn={runtime.soundOn}
      currentPlayerId={runtime.playerId}
      isHost={runtime.isHost}
      scores={runtime.scores}
      teamScores={runtime.teamScores}
      teams={runtime.teams}
      settings={runtime.settings}
      settingsSummary={runtime.settingsSummary}
      connectionStatus={runtime.connectionStatus}
      onToggleSound={() => runtime.setSoundOn((value) => !value)}
      onLeave={runtime.leave}
      onRematch={runtime.rematch}
      sidePanel={
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/75">
            <div className="mb-3 flex items-center gap-2">
              <Type className="h-4 w-4 text-[#2DD4BF]" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/80">Tentativas</span>
            </div>
            <p className="text-2xl font-black text-white">{attemptedCount}</p>
            <p className="mt-1 text-xs text-white/45">jogadores tentaram nesta rodada</p>
          </div>

          {runtime.lastReveal && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/75">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">Revelacao</span>
              </div>
              <p className="text-xs text-white/45">Palavra correta</p>
              <p className="text-2xl font-black text-white">{runtime.lastReveal.correctWord}</p>
              <p className="mt-2 text-xs font-semibold text-white/50">
                {runtime.lastReveal.winnerPlayerName
                  ? `${runtime.lastReveal.winnerPlayerName} acertou primeiro.`
                  : 'Ninguem acertou a tempo.'}
              </p>
            </div>
          )}
        </div>
      }
    >
      <QualEAPalavraGameArea
        status={runtime.status}
        word={runtime.currentWord}
        questionNumber={runtime.questionNumber}
        totalRounds={runtime.totalRounds}
        timer={runtime.timer}
        countdownValue={runtime.countdownValue}
        lastAttemptResult={runtime.lastAttemptResult}
        lastReveal={runtime.lastReveal}
        submitError={runtime.submitError}
        isSubmitting={runtime.isSubmitting}
        accentColor={accentColor}
        onSubmitAttempt={runtime.submitAttempt}
      />
    </PartidaShell>
  );
}
