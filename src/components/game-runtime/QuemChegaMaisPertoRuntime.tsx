'use client';

import React from 'react';
import { Target, Users } from 'lucide-react';
import { PartidaShell } from './PartidaShell';
import { RoomNotFoundState } from '@/components/RoomNotFoundState';
import { QuemChegaMaisPertoGameArea } from './QuemChegaMaisPertoGameArea';
import { useQuemChegaMaisPertoRuntime } from '@/hooks/useQuemChegaMaisPertoRuntime';
import { GAME_REGISTRY } from '@/lib/game-registry';

interface QuemChegaMaisPertoRuntimeProps {
  roomCode: string;
}

export function QuemChegaMaisPertoRuntime({ roomCode }: QuemChegaMaisPertoRuntimeProps) {
  const runtime = useQuemChegaMaisPertoRuntime(roomCode);

  const expectedPlayers = runtime.scores.length;
  const submittedCount = runtime.submittedPlayerIds.length;
  const accentColor = GAME_REGISTRY['quem-chega-mais-perto'].accentColor;

  if (runtime.status === 'error') {
    return <RoomNotFoundState gameType="quem-chega-mais-perto" />;
  }

  return (
    <PartidaShell
      roomCode={roomCode}
      gameTitle="Quem Chega Mais Perto"
      category={runtime.currentQuestion?.category || 'Palpite numerico'}
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
              <Users className="h-4 w-4 text-[#38BDF8]" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/80">Palpites</span>
            </div>
            <p className="text-2xl font-black text-white">{submittedCount}/{expectedPlayers}</p>
            <p className="mt-1 text-xs text-white/45">jogadores responderam</p>
          </div>

          {runtime.lastReveal && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/75">
              <div className="mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-[#22C55E]" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">Revelacao</span>
              </div>
              <p className="text-xs text-white/45">Valor real</p>
              <p className="text-3xl font-black text-white">{runtime.lastReveal.correctValue}</p>
              <div className="mt-3 space-y-2">
                {runtime.lastReveal.guesses.slice(0, 3).map((guess) => (
                  <div key={`${guess.playerId || guess.teamId}-${guess.guess}`} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs">
                    <span className="font-semibold text-white/80">{guess.playerName || guess.teamName}</span>
                    <span className={guess.points > 0 ? 'font-bold text-[#22C55E]' : 'text-white/45'}>
                      {guess.guess} ({guess.distance})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      }
    >
      <QuemChegaMaisPertoGameArea
        status={runtime.status}
        question={runtime.currentQuestion}
        questionNumber={runtime.questionNumber}
        totalRounds={runtime.totalRounds}
        timer={runtime.timer}
        countdownValue={runtime.countdownValue}
        currentPlayerId={runtime.playerId}
        submittedPlayerIds={runtime.submittedPlayerIds}
        scores={runtime.scores}
        lastReveal={runtime.lastReveal}
        submitError={runtime.submitError}
        isSubmitting={runtime.isSubmitting}
        accentColor={accentColor}
        onSubmitGuess={runtime.submitGuess}
      />
    </PartidaShell>
  );
}
