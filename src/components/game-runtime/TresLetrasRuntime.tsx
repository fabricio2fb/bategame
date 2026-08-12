'use client';

import React from 'react';
import { CheckCircle2, MessageSquareText } from 'lucide-react';
import { PartidaShell } from './PartidaShell';
import { RoomNotFoundState } from '@/components/RoomNotFoundState';
import { GAME_REGISTRY } from '@/lib/game-registry';
import { useTresLetrasRuntime } from '@/hooks/useTresLetrasRuntime';
import { TresLetrasGameArea } from './TresLetrasGameArea';

interface TresLetrasRuntimeProps {
  roomCode: string;
}

export function TresLetrasRuntime({ roomCode }: TresLetrasRuntimeProps) {
  const runtime = useTresLetrasRuntime(roomCode);
  const accentColor = GAME_REGISTRY['tres-letras'].accentColor;

  if (runtime.status === 'error') {
    return <RoomNotFoundState gameType="tres-letras" />;
  }

  return (
    <PartidaShell
      roomCode={roomCode}
      gameTitle="3 Letras"
      category="Criatividade e voto"
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
              <MessageSquareText className="h-4 w-4" style={{ color: accentColor }} />
              <span className="text-xs font-bold uppercase tracking-wider text-white/80">Respostas</span>
            </div>
            <p className="text-2xl font-black text-white">{runtime.submittedPlayerIds.length}</p>
            <p className="mt-1 text-xs text-white/45">jogadores enviaram nesta rodada</p>
          </div>

          {runtime.lastReveal && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/75">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">Resultado</span>
              </div>
              <div className="space-y-2">
                {runtime.lastReveal.answers.slice(0, 3).map((answer) => (
                  <div key={answer.answerId} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2 text-xs">
                    <span className="min-w-0 truncate font-semibold text-white/80">{answer.playerName}</span>
                    <span className={answer.points > 0 ? 'font-black text-[#22C55E]' : 'text-white/45'}>
                      +{answer.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      }
    >
      <TresLetrasGameArea
        status={runtime.status}
        currentRound={runtime.currentRound}
        questionNumber={runtime.questionNumber}
        totalRounds={runtime.totalRounds}
        timer={runtime.timer}
        countdownValue={runtime.countdownValue}
        submittedPlayerIds={runtime.submittedPlayerIds}
        currentPlayerId={runtime.playerId}
        votingState={runtime.votingState}
        voteCounts={runtime.voteCounts}
        myVotes={runtime.myVotes}
        lastReveal={runtime.lastReveal}
        submitError={runtime.submitError}
        isSubmitting={runtime.isSubmitting}
        accentColor={accentColor}
        onSubmitAnswer={runtime.submitAnswer}
        onSubmitVote={runtime.submitVote}
      />
    </PartidaShell>
  );
}
