'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Clock3, RotateCcw, Send, Type, X } from 'lucide-react';
import type { RoomStatus } from '@/lib/types';
import type { WordAttemptResult, WordPublicQuestion, WordRoundReveal } from '@/hooks/useQualEAPalavraRuntime';

interface SelectedLetter {
  letter: string;
  index: number;
}

interface QualEAPalavraGameAreaProps {
  status: RoomStatus | 'loading' | 'error';
  word: WordPublicQuestion | null;
  questionNumber: number;
  totalRounds: number;
  timer: number;
  countdownValue: number | null;
  lastAttemptResult: WordAttemptResult | null;
  lastReveal: WordRoundReveal | null;
  submitError: string | null;
  isSubmitting: boolean;
  accentColor?: string;
  onSubmitAttempt: (attempt: string) => void;
}

export function QualEAPalavraGameArea({
  status,
  word,
  questionNumber,
  totalRounds,
  timer,
  countdownValue,
  lastAttemptResult,
  lastReveal,
  submitError,
  isSubmitting,
  accentColor = '#0F766E',
  onSubmitAttempt,
}: QualEAPalavraGameAreaProps) {
  const [selectedLetters, setSelectedLetters] = useState<SelectedLetter[]>([]);
  const [wrongPulse, setWrongPulse] = useState(false);
  const [correctPulse, setCorrectPulse] = useState(false);
  const phase = getVisualPhase(status, countdownValue, lastReveal);
  const selectedIndexes = useMemo(() => new Set(selectedLetters.map((entry) => entry.index)), [selectedLetters]);
  const formedWord = selectedLetters.map((entry) => entry.letter).join('');

  useEffect(() => {
    setSelectedLetters([]);
    setWrongPulse(false);
    setCorrectPulse(false);
  }, [word?.id]);

  useEffect(() => {
    if (!lastAttemptResult || lastAttemptResult.wordId !== word?.id) return;

    if (lastAttemptResult.correct) {
      setCorrectPulse(true);
      window.setTimeout(() => setCorrectPulse(false), 900);
      return;
    }

    setWrongPulse(true);
    window.setTimeout(() => {
      setWrongPulse(false);
      setSelectedLetters([]);
    }, 650);
  }, [lastAttemptResult, word?.id]);

  const selectLetter = (letter: string, index: number) => {
    if (phase !== 'answering' || selectedIndexes.has(index) || isSubmitting) return;
    setSelectedLetters((current) => [...current, { letter, index }]);
  };

  const removeLast = () => {
    setSelectedLetters((current) => current.slice(0, -1));
  };

  const clear = () => {
    setSelectedLetters([]);
  };

  const submit = () => {
    if (!word || formedWord.length !== word.length || isSubmitting) return;
    onSubmitAttempt(formedWord);
  };

  const canSubmit = phase === 'answering' && !!word && formedWord.length === word.length && !isSubmitting;

  return (
    <div className="mx-auto flex min-h-full max-w-4xl items-center justify-center">
      <div className="w-full p-4 text-white sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          {phase === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              className="flex min-h-[460px] flex-col items-center justify-center text-center"
            >
              <p className="text-sm font-bold uppercase tracking-[0.24em]" style={{ color: accentColor }}>A palavra ja vai aparecer</p>
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
                Monte a palavra antes da galera.
              </p>
            </motion.div>
          )}

          {phase === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[460px] flex-col items-center justify-center gap-4 text-center"
            >
              <div className="h-14 w-14 rounded-full border-4 border-white/15 border-t-white animate-spin" />
              <p className="text-sm font-semibold text-white/60">Carregando palavra...</p>
            </motion.div>
          )}

          {phase === 'answering' && word && (
            <motion.div
              key={`answering-${word.id}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              className="flex min-h-[460px] flex-col justify-center"
            >
              <RoundHeader questionNumber={questionNumber} totalRounds={totalRounds} category={word.category} timer={timer} />

              <div className="mt-8">
                <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#2DD4BF]">
                  <Type className="h-4 w-4" />
                  Qual e a palavra
                </p>
                <h1 className="max-w-3xl break-words text-5xl font-black tracking-[0.18em] text-white drop-shadow-sm sm:text-7xl">
                  {word.scrambledWord}
                </h1>
              </div>

              <div
                className={`mt-8 flex min-h-16 flex-wrap items-center gap-2 transition-colors ${
                  wrongPulse ? 'text-[#FCA5A5]' : correctPulse ? 'text-[#86EFAC]' : 'text-white'
                }`}
              >
                {Array.from({ length: word.length }).map((_, index) => {
                  const selected = selectedLetters[index]?.letter;
                  return (
                    <span
                      key={index}
                      className={`grid h-14 w-11 place-items-center rounded-xl border-b-4 text-2xl font-black transition-all sm:h-16 sm:w-14 sm:text-3xl ${
                        wrongPulse
                          ? 'border-[#EF4444] bg-[#EF4444]/12'
                          : correctPulse
                            ? 'border-[#22C55E] bg-[#22C55E]/12'
                            : 'border-white/30 bg-white/8'
                      }`}
                    >
                      {selected || ''}
                    </span>
                  );
                })}
              </div>

              <div className="mt-7 flex max-w-3xl flex-wrap gap-2 sm:gap-3">
                {word.letters.map((letter, index) => {
                  const used = selectedIndexes.has(index);
                  return (
                    <button
                      key={`${letter}-${index}`}
                      type="button"
                      disabled={used || isSubmitting}
                      onClick={() => selectLetter(letter, index)}
                      className="grid h-12 w-12 place-items-center rounded-2xl border border-white/18 bg-white/12 text-xl font-black text-white shadow-[0_10px_24px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-25 sm:h-14 sm:w-14 sm:text-2xl"
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>

              <div className="mt-7 flex max-w-3xl flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={submit}
                  disabled={!canSubmit}
                  className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0F766E] px-6 text-sm font-black text-white shadow-lg shadow-[#0F766E]/25 transition hover:bg-[#115E59] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar palavra'}
                  <Send className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={removeLast}
                  disabled={selectedLetters.length === 0 || isSubmitting}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-5 text-sm font-black text-white transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <RotateCcw className="h-4 w-4" />
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={clear}
                  disabled={selectedLetters.length === 0 || isSubmitting}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-5 text-sm font-black text-white transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Limpar
                </button>
              </div>

              {(wrongPulse || submitError) && (
                <p className="mt-4 inline-flex max-w-3xl items-center gap-2 rounded-xl border border-[#EF4444]/25 bg-[#EF4444]/10 px-3 py-2 text-sm font-bold text-[#FCA5A5]">
                  <X className="h-4 w-4" />
                  {submitError || 'Nao foi dessa vez. Tente de novo.'}
                </p>
              )}
              {correctPulse && (
                <p className="mt-4 inline-flex max-w-3xl items-center gap-2 rounded-xl border border-[#22C55E]/25 bg-[#22C55E]/10 px-3 py-2 text-sm font-bold text-[#86EFAC]">
                  <Check className="h-4 w-4" />
                  Palavra correta.
                </p>
              )}
            </motion.div>
          )}

          {phase === 'reveal' && lastReveal && (
            <motion.div
              key={`reveal-${lastReveal.wordId}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              className="flex min-h-[460px] flex-col justify-center"
            >
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2DD4BF]">Palavra correta</p>
              <h1 className="mt-4 break-words text-5xl font-black tracking-[0.12em] text-white sm:text-7xl">
                {lastReveal.correctWord}
              </h1>
              <p className={`mt-5 max-w-xl text-lg font-black ${lastReveal.winnerPlayerName ? 'text-[#86EFAC]' : 'text-white/55'}`}>
                {lastReveal.winnerPlayerName
                  ? `${lastReveal.winnerPlayerName} acertou primeiro.`
                  : 'Ninguem acertou a tempo.'}
              </p>
              {lastReveal.hint && (
                <p className="mt-3 max-w-xl text-sm font-semibold text-white/45">{lastReveal.hint}</p>
              )}
            </motion.div>
          )}

          {phase === 'transition' && (
            <motion.div
              key="transition"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[460px] flex-col items-center justify-center text-center"
            >
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-white/10">
                <ArrowRight className="h-10 w-10 text-white/60" />
              </div>
              <p className="mt-5 text-2xl font-black text-white">Preparando proxima palavra</p>
              <p className="mt-2 text-sm font-semibold text-white/45">O placar foi atualizado.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

type VisualPhase = 'countdown' | 'loading' | 'answering' | 'reveal' | 'transition';

function getVisualPhase(
  status: RoomStatus | 'loading' | 'error',
  countdownValue: number | null,
  lastReveal: WordRoundReveal | null,
): VisualPhase {
  if (status === 'countdown' || (countdownValue !== null && countdownValue > 0)) return 'countdown';
  if (status === 'loading' || status === 'error') return 'loading';
  if (status === 'round-reveal' && lastReveal) return 'reveal';
  if (status === 'round-finished' || status === 'scoreboard') return 'transition';
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
      <div className="rounded-full bg-[#0F766E]/18 px-3 py-1.5 text-xs font-bold text-[#99F6E4]">
        {category || 'Geral'}
      </div>
      <div className={`flex items-center gap-2 rounded-2xl px-4 py-2 font-black tabular-nums ${danger ? 'bg-[#EF4444]/15 text-[#FCA5A5]' : 'bg-[#F59E0B]/15 text-[#FCD34D]'}`}>
        <Clock3 className="h-4 w-4" />
        {timer}s
      </div>
    </div>
  );
}
