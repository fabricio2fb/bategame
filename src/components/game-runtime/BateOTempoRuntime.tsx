'use client';

import React from 'react';
import { CheckCircle2, Clock3, Loader2, Play, Square, TimerReset } from 'lucide-react';
import { PartidaShell } from './PartidaShell';
import { RoomNotFoundState } from '@/components/RoomNotFoundState';
import {
  BateOTempoPersonalTimerResult,
  BateOTempoRoundRevealResult,
  BateOTempoTimerStatus,
  useBateOTempoRuntime,
} from '@/hooks/useBateOTempoRuntime';
import { GAME_REGISTRY } from '@/lib/game-registry';

interface BateOTempoRuntimeProps {
  roomCode: string;
}

export function BateOTempoRuntime({ roomCode }: BateOTempoRuntimeProps) {
  const runtime = useBateOTempoRuntime(roomCode);
  const stoppedCount = runtime.timerStatuses.filter((entry) => entry.status === 'stopped').length;
  const expectedPlayers = runtime.timerStatuses.length || runtime.scores.length;
  const accentColor = GAME_REGISTRY['bate-o-tempo'].accentColor;

  if (runtime.status === 'error') {
    return <RoomNotFoundState gameType="bate-o-tempo" />;
  }

  return (
    <PartidaShell
      roomCode={roomCode}
      gameTitle="Bate o Tempo"
      category="Precisao contra o relogio"
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
              <Clock3 className="h-4 w-4 text-[#06B6D4]" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/80">Cronometros</span>
            </div>
            <p className="text-2xl font-black text-white">{stoppedCount}/{expectedPlayers}</p>
            <p className="mt-1 text-xs text-white/45">jogadores ja pararam</p>
            <div className="mt-4 space-y-2">
              {runtime.timerStatuses.map((entry) => (
                <div key={entry.playerId} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs">
                  <span className="min-w-0 truncate font-semibold text-white/80">{entry.playerName}</span>
                  <span className={`ml-3 shrink-0 font-black uppercase ${getStatusTone(entry.status)}`}>
                    {getStatusLabel(entry.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {runtime.lastReveal && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/75">
              <div className="mb-3 flex items-center gap-2">
                <TimerReset className="h-4 w-4 text-[#22C55E]" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">Revelacao</span>
              </div>
              <p className="text-xs text-white/45">Tempo alvo</p>
              <p className="text-3xl font-black text-white">{runtime.lastReveal.targetLabel}</p>
              <div className="mt-3 space-y-2">
                {runtime.lastReveal.results.slice(0, 3).map((result) => (
                  <div key={result.playerId} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs">
                    <span className="font-semibold text-white/80">{result.playerName}</span>
                    <span className={result.points > 0 ? 'font-bold text-[#22C55E]' : 'text-white/45'}>
                      {result.elapsedLabel || 'sem tempo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      }
    >
      <BateOTempoGameArea
        status={runtime.status}
        targetLabel={runtime.targetLabel}
        questionNumber={runtime.questionNumber}
        totalRounds={runtime.totalRounds}
        currentTimerStatus={runtime.currentTimerStatus}
        personalTimerResult={runtime.personalTimerResult}
        lastReveal={runtime.lastReveal}
        countdownValue={runtime.countdownValue}
        actionError={runtime.actionError}
        isActing={runtime.isActing}
        accentColor={accentColor}
        onStart={runtime.startTimer}
        onStop={runtime.stopTimer}
      />
    </PartidaShell>
  );
}

interface BateOTempoGameAreaProps {
  status: string;
  targetLabel: string;
  questionNumber: number;
  totalRounds: number;
  currentTimerStatus: BateOTempoTimerStatus;
  personalTimerResult: BateOTempoPersonalTimerResult | null;
  lastReveal: {
    targetLabel: string;
    scoringMode: 'exact' | 'approximate';
    exactToleranceMs: number;
    results: BateOTempoRoundRevealResult[];
    winnerPlayerIds: string[];
    winnerTeamIds: string[];
  } | null;
  countdownValue: number | null;
  actionError: string | null;
  isActing: boolean;
  accentColor: string;
  onStart: () => void;
  onStop: () => void;
}

function BateOTempoGameArea({
  status,
  targetLabel,
  questionNumber,
  totalRounds,
  currentTimerStatus,
  personalTimerResult,
  lastReveal,
  countdownValue,
  actionError,
  isActing,
  accentColor,
  onStart,
  onStop,
}: BateOTempoGameAreaProps) {
  const isRunning = currentTimerStatus === 'running';
  const isStopped = currentTimerStatus === 'stopped' || personalTimerResult?.status === 'stopped';
  const isTimeout = currentTimerStatus === 'timeout' || personalTimerResult?.status === 'timeout';
  const canStart = (status === 'target-visible' || status === 'running') && currentTimerStatus === 'not-started';
  const canStop = (status === 'target-visible' || status === 'running') && isRunning;

  if (status === 'countdown') {
    return (
      <section className="flex h-full min-h-[420px] flex-col items-center justify-center px-4 text-center text-white">
        <p className="text-xs font-black uppercase tracking-[0.32em]" style={{ color: accentColor }}>Prepare o reflexo</p>
        <div className="mt-8 text-8xl font-black text-white drop-shadow-2xl sm:text-9xl">
          {countdownValue ?? 3}
        </div>
        <p className="mt-5 text-sm font-semibold text-white/50">O tempo alvo aparece antes do cronometro liberar.</p>
      </section>
    );
  }

  if (status === 'round-reveal' && lastReveal) {
    return (
      <section className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-center px-2 py-6 text-white">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-[#67E8F9]">Resultado da rodada</p>
          <h1 className="mt-3 text-5xl font-black sm:text-7xl">{lastReveal.targetLabel}</h1>
          <p className="mt-3 text-sm font-semibold text-white/50">
            {lastReveal.scoringMode === 'exact'
              ? `Modo exato: tolerancia de ${lastReveal.exactToleranceMs}ms.`
              : 'Modo aproximado: o menor desvio ganha 1 ponto.'}
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          {lastReveal.results.map((result, index) => {
            const won = result.points > 0;
            return (
              <div
                key={`${result.playerId}-${index}`}
                className={`grid grid-cols-[1fr_auto] gap-3 border-b border-white/10 px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_8rem_8rem_5rem] sm:items-center ${
                  won ? 'bg-[#22C55E]/10' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {won && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22C55E]" />}
                    <p className="truncate text-sm font-black text-white">{result.playerName}</p>
                  </div>
                  {result.teamName && <p className="mt-1 text-xs font-semibold text-white/40">{result.teamName}</p>}
                </div>
                <ResultValue label="Tempo" value={result.elapsedLabel || 'nao parou'} />
                <ResultValue label="Desvio" value={result.distanceLabel || '--'} />
                <div className={`text-right text-sm font-black ${won ? 'text-[#22C55E]' : 'text-white/35'}`}>
                  {won ? '+1' : '0'}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-[420px] flex-col items-center justify-center px-4 py-6 text-center text-white">
      <p className="text-xs font-black uppercase tracking-[0.32em] text-[#67E8F9]">
        Rodada {questionNumber || 1}{totalRounds ? ` de ${totalRounds}` : ''}
      </p>

      <div className="mt-7">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-white/45">Tempo alvo</p>
        <h1 className="mt-3 text-6xl font-black leading-none text-white sm:text-8xl">
          {targetLabel || '0:00.00'}
        </h1>
      </div>

      <div className="mt-10 flex min-h-[150px] flex-col items-center justify-center">
        {isRunning ? (
          <div className="flex flex-col items-center">
            <div className="relative grid h-28 w-28 place-items-center rounded-full border border-white/10 bg-white/[0.04]">
              <span
                className="absolute inset-0 rounded-full opacity-25"
                style={{ backgroundColor: accentColor, animation: 'pulse 1.2s ease-in-out infinite' }}
              />
              <Loader2 className="relative h-12 w-12 animate-spin text-[#67E8F9]" />
            </div>
            <p className="mt-5 max-w-sm text-sm font-semibold text-white/55">
              Seu cronometro esta rodando escondido. Pare quando sentir que bateu o alvo.
            </p>
          </div>
        ) : isStopped ? (
          <div className="flex flex-col items-center">
            <CheckCircle2 className="h-16 w-16 text-[#22C55E]" />
            <p className="mt-4 text-xl font-black text-white">Voce parou em</p>
            <p className="mt-2 text-5xl font-black text-white sm:text-6xl">
              {personalTimerResult?.elapsedLabel || 'registrado'}
            </p>
            <p className="mt-3 max-w-sm text-sm font-semibold text-white/50">Aguarde a revelacao da rodada.</p>
          </div>
        ) : isTimeout ? (
          <div className="flex flex-col items-center">
            <TimerReset className="h-16 w-16 text-red-200" />
            <p className="mt-4 text-xl font-black text-white">Tempo esgotado</p>
            <p className="mt-2 max-w-sm text-sm font-semibold text-white/50">Voce nao completou esta rodada.</p>
          </div>
        ) : (
          <p className="max-w-sm text-sm font-semibold text-white/50">
            Aperte iniciar, conte mentalmente e pare no tempo certo.
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        {canStop ? (
          <button
            type="button"
            onClick={onStop}
            disabled={isActing}
            className="inline-flex min-h-16 min-w-56 items-center justify-center gap-3 rounded-full bg-[#EF4444] px-8 text-lg font-black text-white shadow-[0_18px_45px_rgba(239,68,68,0.25)] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Square className="h-6 w-6 fill-current" />
            Parar
          </button>
        ) : (
          <button
            type="button"
            onClick={onStart}
            disabled={!canStart || isActing}
            className="inline-flex min-h-16 min-w-56 items-center justify-center gap-3 rounded-full px-8 text-lg font-black text-[#0F172A] shadow-[0_18px_45px_rgba(6,182,212,0.25)] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            <Play className="h-6 w-6 fill-current" />
            Iniciar
          </button>
        )}
      </div>

      {actionError && (
        <p className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100">
          {actionError}
        </p>
      )}
    </section>
  );
}

function ResultValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-left sm:text-right">
      <p className="text-[10px] font-black uppercase tracking-wider text-white/35">{label}</p>
      <p className="mt-1 text-sm font-black text-white/85">{value}</p>
    </div>
  );
}

function getStatusLabel(status: BateOTempoTimerStatus): string {
  if (status === 'running') return 'rodando';
  if (status === 'stopped') return 'parou';
  if (status === 'timeout') return 'tempo';
  return 'aguarda';
}

function getStatusTone(status: BateOTempoTimerStatus): string {
  if (status === 'running') return 'text-[#67E8F9]';
  if (status === 'stopped') return 'text-[#22C55E]';
  if (status === 'timeout') return 'text-red-200';
  return 'text-white/35';
}
