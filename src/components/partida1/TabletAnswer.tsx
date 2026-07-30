'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Mic } from 'lucide-react';
import { clampReactionTime, formatReactionTime } from '@/lib/reaction-time';

interface TabletAnswerProps {
  mode: 'winner' | 'choices' | 'waiting' | 'judge' | 'result';
  playerName?: string;
  reactionTime?: number;
  alternatives?: string[];
  selectedAlt?: string;
  resultType?: 'correct' | 'wrong' | 'timeout';
  correctAnswer?: string;
  onSelectAlt?: (alt: string) => void;
  onJudgeCorrect?: () => void;
  onJudgeWrong?: () => void;
  isHost?: boolean;
}

const AVATAR_COLORS = ['#3B82F6', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
const ALT_LABELS = ['A', 'B', 'C', 'D'];

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export const TabletAnswer: React.FC<TabletAnswerProps> = ({
  mode, playerName, reactionTime, alternatives, selectedAlt,
  resultType, correctAnswer, onSelectAlt, onJudgeCorrect, onJudgeWrong, isHost,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="relative w-full max-w-md mx-auto"
      style={{ perspective: 600 }}
    >
      {/* Shadow */}
      <div className="absolute -bottom-2 left-10 right-10 h-4 bg-black/10 blur-xl rounded-full" />

      {/* Tablet body */}
      <div className="relative bg-gradient-to-b from-[#1E293B] to-[#0F172A] rounded-2xl p-3 shadow-2xl"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
        {/* Top bezel */}
        <div className="flex items-center justify-center pb-2">
          <div className="w-1 h-1 rounded-full bg-[#3B82F6]/40" />
        </div>

        {/* Screen */}
        <div className="bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] rounded-xl p-4 sm:p-5 min-h-[200px] relative overflow-hidden">
          {/* Screen reflection overlay */}
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent rounded-t-xl pointer-events-none" />
          <div className="absolute top-4 -left-4 w-20 h-20 bg-white/5 rounded-full blur-xl pointer-events-none" />

          <AnimatePresence mode="wait">
            {/* Winner announced */}
            {mode === 'winner' && (
              <motion.div key="winner" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center gap-3 py-2">
                <div className="w-14 h-14 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-[#F59E0B]" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-[#0F172A]">{playerName}</p>
                  <p className="text-xs text-[#64748B]">clicou primeiro</p>
                  {reactionTime !== undefined && (
                    <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-[#F59E0B]/10 rounded-full">
                      <Zap className="w-3 h-3 text-[#F59E0B]" />
                      <span className="text-xs font-bold text-[#F59E0B]">{formatReactionTime(clampReactionTime(reactionTime))}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Multiple choice alternatives */}
            {mode === 'choices' && alternatives && (
              <motion.div key="choices" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 py-1">
                <p className="text-xs font-semibold text-[#64748B] text-center mb-3">Escolha uma alternativa:</p>
                <div className="grid grid-cols-2 gap-2">
                  {alternatives.map((alt, i) => {
                    const isSelected = selectedAlt === alt;
                    const colors = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444'];
                    return (
                      <button key={i} onClick={() => onSelectAlt?.(alt)} disabled={!!selectedAlt}
                        className={`p-3 rounded-xl text-left text-xs font-medium transition-all cursor-pointer disabled:cursor-not-allowed ${
                          isSelected ? 'text-white' : selectedAlt ? 'bg-[#F1F5F9] text-[#94A3B8]' : 'bg-white border border-[#CBD5E1] hover:border-[#3B82F6]/30 text-[#0F172A] hover:shadow-sm'
                        }`}
                        style={isSelected ? { backgroundColor: colors[i % colors.length] } : undefined}>
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold mr-2 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                        }`}>{ALT_LABELS[i]}</span>
                        {alt}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Spoken - waiting */}
            {mode === 'waiting' && (
              <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-3 py-4">
                <Mic className="w-8 h-8 text-[#3B82F6]/40" />
                <p className="text-sm text-[#64748B]">Aguardando resposta...</p>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Judge controls */}
            {mode === 'judge' && (
              <motion.div key="judge" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="space-y-3 py-2">
                <p className="text-xs text-[#64748B] text-center font-medium">{playerName} respondeu. Julgue:</p>
                <div className="flex gap-2">
                  <button onClick={onJudgeCorrect}
                    className="flex-1 py-3 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95">
                    ✅ Correta
                  </button>
                  <button onClick={onJudgeWrong}
                    className="flex-1 py-3 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95">
                    ❌ Errada
                  </button>
                </div>
              </motion.div>
            )}

            {/* Result */}
            {mode === 'result' && resultType && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center gap-3 py-2">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  resultType === 'correct' ? 'bg-[#22C55E]/10' : resultType === 'timeout' ? 'bg-[#F59E0B]/10' : 'bg-[#EF4444]/10'
                }`}>
                  <span className="text-2xl">{resultType === 'correct' ? '✅' : resultType === 'timeout' ? '⏰' : '❌'}</span>
                </div>
                <div className="text-center">
                  <p className={`text-lg font-bold ${
                    resultType === 'correct' ? 'text-[#22C55E]' : resultType === 'timeout' ? 'text-[#F59E0B]' : 'text-[#EF4444]'
                  }`}>
                    {resultType === 'correct' ? 'Resposta correta!' : resultType === 'timeout' ? 'Tempo esgotado!' : 'Resposta incorreta'}
                  </p>
                  <p className="text-xs text-[#64748B] mt-1">{playerName}</p>
                </div>
                {correctAnswer && (
                  <div className="bg-[#F8FAFC] border border-[#CBD5E1]/60 rounded-lg p-3 w-full text-center">
                    <p className="text-xs text-[#64748B]">Resposta correta:</p>
                    <p className="text-sm font-bold text-[#22C55E]">{correctAnswer}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom bezel */}
        <div className="flex items-center justify-center pt-2">
          <div className="w-8 h-1 rounded-full bg-[#475569]/40" />
        </div>

        {/* Side edge highlight */}
        <div className="absolute top-4 bottom-4 left-[2px] w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        <div className="absolute top-4 bottom-4 right-[2px] w-[1px] bg-gradient-to-b from-transparent via-white/5 to-transparent" />
      </div>
    </motion.div>
  );
};
