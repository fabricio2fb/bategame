'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Clock3, Send, Target, Trophy } from 'lucide-react';
import type { RoomStatus } from '@/lib/types';
import type { NumericPlayerGuess, NumericPublicQuestion, NumericRoundReveal } from '@/hooks/useQuemChegaMaisPertoRuntime';

interface QuemChegaMaisPertoGameAreaProps {
  status: RoomStatus | 'loading' | 'error';
  question: NumericPublicQuestion | null;
  questionNumber: number;
  totalRounds: number;
  timer: number;
  countdownValue: number | null;
  currentPlayerId: string | null;
  submittedPlayerIds: string[];
  scores: Array<{ playerId: string; name: string; score: number }>;
  lastReveal: NumericRoundReveal | null;
  submitError: string | null;
  isSubmitting: boolean;
  accentColor?: string;
  onSubmitGuess: (guess: number) => void;
}

export function QuemChegaMaisPertoGameArea({
  status,
  question,
  questionNumber,
  totalRounds,
  timer,
  countdownValue,
  currentPlayerId,
  submittedPlayerIds,
  scores,
  lastReveal,
  submitError,
  isSubmitting,
  accentColor = '#1E40AF',
  onSubmitGuess,
}: QuemChegaMaisPertoGameAreaProps) {
  const [guessText, setGuessText] = useState('');
  const currentPlayerSubmitted = currentPlayerId ? submittedPlayerIds.includes(currentPlayerId) : false;
  const phase = getVisualPhase(status, countdownValue, currentPlayerSubmitted, lastReveal);

  const handleChange = (value: string) => {
    const normalized = value.replace(',', '.');
    if (/^\d*([.]\d*)?$/.test(normalized)) {
      setGuessText(value.replace('.', ','));
    }
  };

  useEffect(() => {
    setGuessText('');
  }, [question?.id]);

  const submit = () => {
    const normalized = guessText.replace(',', '.');
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) return;
    onSubmitGuess(parsed);
  };

  const canSubmit = phase === 'answering' && guessText.trim().length > 0 && Number.isFinite(Number(guessText.replace(',', '.'))) && !isSubmitting;

  return (
    <div className="mx-auto flex min-h-full max-w-4xl items-center justify-center">
      <div className="relative w-full p-4 text-white sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {phase === 'countdown' && (
              <motion.div
                key="countdown"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                className="flex min-h-[460px] flex-col items-center justify-center text-center"
              >
                <p className="text-sm font-bold uppercase tracking-[0.24em]" style={{ color: accentColor }}>A partida vai comecar</p>
                <motion.div
                  key={countdownValue}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.4, opacity: 0 }}
                  className="mt-6 text-8xl font-black text-white drop-shadow-xl sm:text-9xl"
                >
                  {countdownValue || 0}
                </motion.div>
                <p className="mt-6 max-w-sm text-sm font-semibold text-white/50">
                  Prepare seu palpite. Todos respondem ao mesmo tempo.
                </p>
              </motion.div>
            )}

            {phase === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex min-h-[460px] flex-col items-center justify-center gap-4 text-center"
              >
                <div className="h-14 w-14 rounded-full border-4 border-white/15 border-t-white animate-spin" />
                <p className="text-sm font-semibold text-white/60">Carregando rodada numerica...</p>
              </motion.div>
            )}

            {phase === 'answering' && question && (
              <motion.div key={`answering-${question.id}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
                className="flex min-h-[460px] flex-col justify-center"
              >
                <RoundHeader questionNumber={questionNumber} totalRounds={totalRounds} category={question.category} timer={timer} />

                <div className="mt-8">
                  <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#A5B4FC]">
                    <Target className="h-4 w-4" />
                    Chegue mais perto
                  </p>
                  <h1 className="max-w-3xl text-3xl font-black leading-tight text-white drop-shadow-sm sm:text-5xl">
                    {question.text}
                  </h1>
                </div>

                <div className="mt-8 max-w-3xl">
                  <label htmlFor="numeric-guess" className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                    Seu palpite numerico
                  </label>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <input
                      id="numeric-guess"
                      value={guessText}
                      onChange={(event) => handleChange(event.target.value)}
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="Digite um numero"
                      className="min-h-16 flex-1 rounded-2xl border border-white/15 bg-black/30 px-5 text-2xl font-black tabular-nums text-white outline-none transition placeholder:text-white/25 focus:border-[#818CF8] focus:ring-4 focus:ring-[#6366F1]/20"
                    />
                    <button
                      type="button"
                      disabled={!canSubmit}
                      onClick={submit}
                      className="min-h-16 rounded-2xl bg-[#6366F1] px-7 text-sm font-black text-white shadow-lg shadow-[#6366F1]/25 transition hover:bg-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        {isSubmitting ? 'Enviando...' : 'Enviar palpite'}
                        <Send className="h-4 w-4" />
                      </span>
                    </button>
                  </div>
                  {submitError && (
                    <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200">
                      {submitError}
                    </p>
                  )}
                  <p className="mt-3 text-xs font-medium text-white/35">
                    Apenas numeros positivos. Decimais podem ser digitados com virgula.
                  </p>
                </div>
              </motion.div>
            )}

            {phase === 'waiting' && question && (
              <motion.div key="waiting" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
                className="flex min-h-[460px] flex-col items-center justify-center text-center"
              >
                <div className="grid h-20 w-20 place-items-center rounded-3xl bg-[#22C55E]/15">
                  <Check className="h-10 w-10 text-[#22C55E]" />
                </div>
                <p className="mt-5 text-2xl font-black text-white">Palpite enviado</p>
                <p className="mt-2 max-w-md text-sm font-semibold text-white/50">
                  Aguardando os outros jogadores ou o fim do tempo da rodada.
                </p>
              </motion.div>
            )}

            {phase === 'reveal' && lastReveal && (
              <motion.div key={`reveal-${lastReveal.questionId}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
                className="min-h-[460px]"
              >
                <div className="mb-5 grid gap-4 lg:grid-cols-[260px_1fr]">
                  <div className="rounded-3xl border border-[#22C55E]/20 bg-[#22C55E]/10 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#86EFAC]">Valor real</p>
                    <p className="mt-3 text-5xl font-black text-white tabular-nums">{lastReveal.correctValue}</p>
                    <p className="mt-3 text-sm font-semibold text-white/50">
                      {lastReveal.reason === 'timeout' ? 'Tempo encerrado.' : 'Todos responderam.'}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A5B4FC]">Resultado da rodada</p>
                    <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                      {winnerText(lastReveal)}
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-white/45">
                      Apenas quem ficou mais perto pontua. Empates dividem a vitoria da rodada.
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-3 sm:p-4">
                  <div className="mb-3 flex items-center gap-2 px-1">
                    <Trophy className="h-4 w-4 text-[#F59E0B]" />
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">Ranking de proximidade</span>
                  </div>
                  <div className="space-y-2">
                    {lastReveal.playerGuesses.map((entry, index) => (
                      <RevealRow key={entry.playerId} entry={entry} index={index} isWinner={isRevealWinner(lastReveal, entry)} isCurrent={entry.playerId === currentPlayerId} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {phase === 'transition' && (
              <motion.div key="transition" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex min-h-[460px] flex-col items-center justify-center text-center"
              >
                <div className="grid h-20 w-20 place-items-center rounded-3xl bg-white/10">
                  <ArrowRight className="h-10 w-10 text-white/60" />
                </div>
                <p className="mt-5 text-2xl font-black text-white">Preparando proxima rodada</p>
                <p className="mt-2 text-sm font-semibold text-white/45">O placar foi atualizado.</p>
              </motion.div>
            )}
          </AnimatePresence>
      </div>
    </div>
  );
}

type VisualPhase = 'countdown' | 'loading' | 'answering' | 'waiting' | 'reveal' | 'transition';

function getVisualPhase(
  status: RoomStatus | 'loading' | 'error',
  countdownValue: number | null,
  currentPlayerSubmitted: boolean,
  lastReveal: NumericRoundReveal | null,
): VisualPhase {
  if (status === 'countdown' || (countdownValue !== null && countdownValue > 0)) return 'countdown';
  if (status === 'loading' || status === 'error') return 'loading';
  if (status === 'round-reveal' && lastReveal) return 'reveal';
  if (status === 'round-finished' || status === 'scoreboard') return 'transition';
  if (status === 'answering' && currentPlayerSubmitted) return 'waiting';
  return 'answering';
}

function RoundHeader({ questionNumber, totalRounds, category, timer }: { questionNumber: number; totalRounds: number; category?: string; timer: number }) {
  const danger = timer <= 5;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/35">Rodada</p>
        <p className="mt-1 text-lg font-black text-white">{questionNumber}/{totalRounds || '?'}</p>
      </div>
      <div className="rounded-full bg-[#6366F1]/15 px-3 py-1.5 text-xs font-bold text-[#C4B5FD]">
        {category || 'Geral'}
      </div>
      <div className={`flex items-center gap-2 rounded-2xl px-4 py-2 font-black tabular-nums ${danger ? 'bg-[#EF4444]/15 text-[#FCA5A5]' : 'bg-[#F59E0B]/15 text-[#FCD34D]'}`}>
        <Clock3 className="h-4 w-4" />
        {timer}s
      </div>
    </div>
  );
}

function RevealRow({ entry, index, isWinner, isCurrent }: { entry: NumericPlayerGuess; index: number; isWinner: boolean; isCurrent: boolean }) {
  const missing = entry.guess === null;
  return (
    <div className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${
      isWinner
        ? 'border-[#22C55E]/40 bg-[#22C55E]/12'
        : isCurrent
          ? 'border-[#6366F1]/30 bg-[#6366F1]/10'
          : 'border-white/8 bg-white/[0.04]'
    }`}>
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-black ${
        isWinner ? 'bg-[#22C55E] text-white' : missing ? 'bg-white/5 text-white/25' : 'bg-white/10 text-white/55'
      }`}>
        {missing ? '-' : index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-white">{entry.playerName}</p>
          {isCurrent && <span className="rounded-full bg-[#6366F1]/15 px-2 py-0.5 text-[10px] font-bold text-[#C4B5FD]">Voce</span>}
          {isWinner && <span className="rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-[10px] font-bold text-[#86EFAC]">+1</span>}
        </div>
        {entry.teamName && <p className="text-xs font-semibold text-white/35">{entry.teamName}</p>}
      </div>
      <div className="text-right">
        <p className="text-sm font-black text-white tabular-nums">{missing ? 'Sem resposta' : entry.guess}</p>
        <p className="text-xs font-semibold text-white/35">{missing ? 'nao pontua' : `distancia ${entry.distance}`}</p>
      </div>
    </div>
  );
}

function winnerText(reveal: NumericRoundReveal): string {
  if (reveal.guesses.length === 0) return 'Ninguem pontuou';
  const winners = reveal.guesses.filter((guess) => guess.points > 0);
  if (winners.length === 0) return 'Ninguem pontuou';
  if (winners.length === 1) return `${winners[0].playerName || winners[0].teamName} marcou 1 ponto`;
  return `${winners.length} empatados marcaram 1 ponto`;
}

function isRevealWinner(reveal: NumericRoundReveal, entry: NumericPlayerGuess): boolean {
  if (entry.guess === null) return false;
  if (reveal.winnerPlayerIds.includes(entry.playerId)) return true;
  return !!entry.teamId && reveal.winnerTeamIds.includes(entry.teamId);
}
