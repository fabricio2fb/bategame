'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Timer, Check, X, Clock, Zap, Lock, Eye, Flag } from 'lucide-react';
import { BigBuzzerPro } from './BigBuzzerPro';
import { clampReactionTime, formatReactionTime } from '@/lib/reaction-time';

type GamePhase = 'question' | 'buzzer' | 'you-won' | 'joao-won' | 'choosing' | 'reveal' | 'correct' | 'wrong' | 'timeout' | 'next' | 'finished';
type QuestionMode = 'spoken' | 'multiple';

interface QuestionTabletProps {
  question: string;
  category: string;
  mode: QuestionMode;
  phase: GamePhase;
  alternatives?: string[];
  selectedAlt?: string;
  correctAnswer?: string;
  explanation?: string;
  winnerName?: string;
  reactionTime?: number;
  answerSecondsRemaining?: number | null;
  buzzerState: 'locked' | 'ready' | 'pressed' | 'won' | 'lost';
  onBuzzerPress: () => void;
  onSelectAlt: (alt: string) => void;
  onReportProblem?: (reason: string) => void;
}

const ALT_LABELS = ['A', 'B', 'C', 'D'];
const REPORT_REASONS = ['resposta incorreta', 'pergunta ambígua', 'erro de português', 'pergunta repetida', 'outro'];

export const QuestionTablet: React.FC<QuestionTabletProps> = ({
  question, category, mode, phase, alternatives, selectedAlt,
  correctAnswer, explanation, winnerName, reactionTime, answerSecondsRemaining,
  buzzerState, onBuzzerPress, onSelectAlt, onReportProblem,
}) => {
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const p = phase;
  const showBuzzer = p === 'buzzer';
  const showChoices = mode === 'multiple' && !!alternatives && (p === 'choosing' || p === 'reveal' || p === 'correct' || p === 'wrong');
  const showSpoken = mode === 'spoken' && (p === 'you-won' || p === 'joao-won' || p === 'choosing');
  const showCorrect = p === 'correct';
  const showWrong = p === 'wrong';
  const showTimeout = p === 'timeout';
  const showNext = p === 'next' || p === 'finished';
  const isLocked = p === 'reveal' || p === 'correct' || p === 'wrong';

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col sm:items-center gap-3 sm:gap-4 sm:py-4">

      {/* PERGUNTA — sempre visível */}
      <motion.div
        key={question}
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="w-full sm:max-w-xl rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.08] px-4 py-3 sm:p-5"
      >
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-[11px] font-bold text-sky-300/80 bg-sky-400/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-wider">
            {category}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-white/40">
            {mode === 'spoken' ? <Mic className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            {mode === 'spoken' ? 'Falada' : 'Múltipla'}
          </span>
        </div>
        <h2 className="text-base sm:text-xl md:text-2xl font-extrabold text-white leading-snug">
          {question}
        </h2>
        {onReportProblem && (
          <div className="mt-3 flex justify-end">
            {!reportOpen && !reportSent && (
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-white/35 hover:bg-white/10 hover:text-white/70"
              >
                <Flag className="h-3 w-3" />
                Reportar problema
              </button>
            )}
            {reportSent && (
              <span className="text-[11px] font-semibold text-emerald-300/70">Relatório registrado</span>
            )}
          </div>
        )}
        {reportOpen && onReportProblem && (
          <div className="mt-3 rounded-xl border border-white/10 bg-black/15 p-2">
            <p className="mb-2 text-[11px] font-semibold text-white/50">Qual é o problema?</p>
            <div className="flex flex-wrap gap-1.5">
              {REPORT_REASONS.map(reason => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    onReportProblem(reason);
                    setReportOpen(false);
                    setReportSent(true);
                  }}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[11px] font-semibold text-white/60 hover:bg-white/10 hover:text-white"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* BOZZER — liberação */}
      {showBuzzer && (
        <motion.div
          key="buzzer-area"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex flex-col items-center gap-2 mt-4 sm:mt-2"
        >
          <BigBuzzerPro state={buzzerState} onPress={onBuzzerPress} />
          <p className="text-[10px] sm:text-[11px] font-medium text-white/30 text-center">
            {buzzerState === 'ready' ? 'O primeiro a apertar ganha a vez' : 'Aguarde a liberação...'}
          </p>
        </motion.div>
      )}

      {/* ALGUÉM APERTOU — painel grande */}
      <AnimatePresence>
        {(p === 'you-won' || p === 'joao-won') && (
          <motion.div
            key="winner-panel"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            className="w-full sm:max-w-xl rounded-2xl border border-amber-400/20 bg-amber-400/[0.08] backdrop-blur-xl p-4 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-xl bg-amber-400/15">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-lg sm:text-xl font-black text-white">{winnerName} apertou primeiro</p>
                {reactionTime !== undefined && (
                  <p className="text-xs sm:text-sm text-amber-300/70 mt-0.5">
                    Tempo de reação: <span className="font-bold text-amber-300">{formatReactionTime(clampReactionTime(reactionTime))}</span>
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MULTIPLA ESCOLHA — visível para TODOS */}
      {showChoices && alternatives && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full sm:max-w-xl"
        >
          {answerSecondsRemaining !== null && answerSecondsRemaining !== undefined && phase === 'choosing' && (
            <div className="mb-2 flex items-center justify-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/[0.06] px-3 py-2 text-xs font-bold text-sky-200">
              <Timer className="h-3.5 w-3.5" />
              <span>{answerSecondsRemaining}s para responder</span>
            </div>
          )}
          <div className="grid grid-cols-1 gap-2 sm:gap-2.5 sm:grid-cols-2">
            {alternatives.map((alt, i) => {
              const isSelected = selectedAlt === alt;
              const isRevealChosen = phase === 'reveal' && selectedAlt === alt;
              const isCorrectReveal = phase === 'correct' && correctAnswer === alt;
              const isWrongReveal = phase === 'wrong' && selectedAlt === alt;
              const isCorrectAnswer = phase === 'correct' || phase === 'wrong' ? correctAnswer === alt : false;
              const canClick = !isLocked && !selectedAlt;

              return (
                <motion.button
                  key={alt}
                  type="button"
                  disabled={!canClick}
                  onClick={() => onSelectAlt(alt)}
                  whileHover={canClick ? { scale: 1.02 } : undefined}
                  whileTap={canClick ? { scale: 0.97 } : undefined}
                  className={`relative min-h-[44px] sm:min-h-[52px] rounded-xl sm:rounded-2xl border p-3 sm:p-3.5 text-left text-sm font-bold transition-all duration-200 disabled:cursor-not-allowed overflow-hidden ${
                    isCorrectReveal
                      ? 'border-emerald-400/60 bg-emerald-500/15 text-white ring-2 ring-emerald-400/30'
                      : isWrongReveal
                        ? 'border-rose-400/60 bg-rose-500/15 text-white ring-2 ring-rose-400/30'
                        : isSelected || isRevealChosen
                          ? 'border-sky-400/50 bg-sky-500/20 text-white'
                          : isLocked && isCorrectAnswer
                            ? 'border-emerald-400/20 bg-emerald-500/5 text-white/60'
                            : isLocked
                              ? 'border-white/5 bg-white/[0.02] text-white/25'
                              : 'border-white/10 bg-white/[0.05] text-white hover:border-white/20 hover:bg-white/[0.08]'
                  }`}
                >
                  {(isSelected || isRevealChosen) && (
                    <motion.div layoutId="selectedAlt"
                      className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-sky-600/10 rounded-2xl"
                    />
                  )}
                  <span className={`relative mr-3 inline-grid h-7 w-7 place-items-center rounded-lg text-xs font-black transition-colors ${
                    isSelected || isRevealChosen ? 'bg-white/20 text-white' : isCorrectReveal ? 'bg-emerald-400/30 text-white' : isWrongReveal ? 'bg-rose-400/30 text-white' : 'bg-white/10 text-white/50'
                  }`}>
                    {isCorrectReveal ? <Check className="w-3.5 h-3.5" /> : isWrongReveal ? <X className="w-3.5 h-3.5" /> : ALT_LABELS[i]}
                  </span>
                  <span className="relative">{alt}</span>
                  {isLocked && !isSelected && !isCorrectReveal && !isWrongReveal && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Lock className="w-3.5 h-3.5 text-white/15" />
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ESTÁ ESCOLHENDO — suspense */}
      <AnimatePresence>
        {phase === 'choosing' && !alternatives && (
          <motion.div
            key="choosing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="w-full sm:max-w-xl rounded-2xl border border-sky-400/20 bg-sky-400/[0.06] backdrop-blur-xl p-3 sm:p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="h-2 w-2 rounded-full bg-sky-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} />
                ))}
              </div>
              <p className="hidden">
                <span className="text-white font-bold">{winnerName}</span> está escolhendo uma alternativa...
              </p>
              <p className="text-sm font-semibold text-white/70">
                <span className="text-white font-bold">{winnerName}</span> esta respondendo...
                {answerSecondsRemaining !== null && answerSecondsRemaining !== undefined && (
                  <span className="ml-2 text-sky-300">{answerSecondsRemaining}s</span>
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REVELAÇÃO — alternativa escolhida */}
      <AnimatePresence>
        {phase === 'reveal' && selectedAlt && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="w-full sm:max-w-xl rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-4 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-400/10">
                <Eye className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <p className="text-xs text-white/40 font-medium">{winnerName} escolheu:</p>
                <p className="text-lg font-black text-white mt-0.5">
                  {ALT_LABELS[alternatives?.indexOf(selectedAlt) ?? 0]} — {selectedAlt}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FALADA — quando alguém apertou no modo falada */}
      {showSpoken && (
        <motion.div key="spoken" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="w-full sm:max-w-xl flex flex-col items-center gap-3"
        >
          <div className="w-full rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.08] p-4 sm:p-5">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">Clicou primeiro</p>
                <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{winnerName}</p>
              </div>
              <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl bg-sky-400/10">
                <Mic className="h-6 w-6 sm:h-7 sm:w-7 text-sky-400" />
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
              <p className="text-xs sm:text-sm font-semibold text-white/50">Respondendo...</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* CORRETA */}
      <AnimatePresence>
        {showCorrect && (
          <motion.div key="correct" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="w-full sm:max-w-xl flex flex-col items-center gap-3"
          >
            <div className="grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-2xl bg-emerald-400/15">
              <Check className="h-7 w-7 sm:h-8 sm:w-8 text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-black text-emerald-400">Resposta correta!</p>
              <p className="text-sm text-white/50 mt-1">
                {winnerName} ganhou <span className="font-bold text-emerald-400">+1 ponto</span>
              </p>
              {correctAnswer && (
                <p className="text-sm text-white/70 mt-3">Resposta: <span className="font-bold text-emerald-300">{correctAnswer}</span></p>
              )}
              {explanation && (
                <p className="text-xs sm:text-sm text-white/45 mt-2 max-w-md">{explanation}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ERRADA */}
      <AnimatePresence>
        {showWrong && (
          <motion.div key="wrong" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="w-full sm:max-w-xl flex flex-col gap-3"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-2xl bg-rose-400/15">
                <X className="h-7 w-7 sm:h-8 sm:w-8 text-rose-400" />
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-black text-rose-400">Resposta errada</p>
                <p className="text-xs sm:text-sm text-white/40 mt-1">{winnerName} não pode mais responder</p>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-center">
              <p className="text-xs sm:text-sm font-semibold text-emerald-300/80">
                <Zap className="inline w-3.5 h-3.5 mr-1" />
                Agora outro jogador pode tentar
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TIMEOUT */}
      <AnimatePresence>
        {showTimeout && (
          <motion.div key="timeout" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-2xl bg-amber-400/15">
              <Clock className="h-7 w-7 sm:h-8 sm:w-8 text-amber-400" />
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-black text-amber-400">Tempo esgotado</p>
              {correctAnswer && <p className="text-sm text-white/40 mt-1">Resposta: <span className="font-bold text-emerald-400">{correctAnswer}</span></p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NEXT / FINISHED */}
      <AnimatePresence>
        {showNext && (
          <motion.div key="next" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-2xl bg-white/5">
              <Timer className="h-7 w-7 sm:h-8 sm:w-8 text-white/40" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-white/40">
              {phase === 'finished' ? 'Rodada finalizada' : 'Preparando próxima rodada...'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
