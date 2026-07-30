'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, User, CheckCircle, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { clampReactionTime, formatReactionTime } from '@/lib/reaction-time';

type GamePhase = 'waiting' | 'prepare' | 'ready' | 'won' | 'correct' | 'wrong' | 'timeout' | 'next';

interface RoundPanelProps {
  phase: GamePhase;
  winnerName?: string;
  reactionTime?: number;
  questionNumber?: number;
}

export const RoundPanel: React.FC<RoundPanelProps> = ({ phase, winnerName, reactionTime, questionNumber }) => {
  return (
    <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-lg">
      <div className="px-4 py-3 border-b border-white/5">
        <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Rodada</span>
      </div>
      <div className="p-4">
        <AnimatePresence mode="wait">
          {phase === 'waiting' && (
            <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white/40" />
              </div>
              <p className="text-sm font-medium text-white/60">Aguardando pergunta...</p>
            </motion.div>
          )}

          {phase === 'prepare' && (
            <motion.div key="prepare" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-4">
              <motion.div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}>
                <Clock className="w-5 h-5 text-[#F59E0B]" />
              </motion.div>
              <p className="text-sm font-bold text-[#F59E0B]">Prepare-se!</p>
              <p className="text-xs text-white/40 text-center">O buzzer vai abrir<br />em instantes</p>
            </motion.div>
          )}

          {phase === 'ready' && (
            <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-4">
              <motion.div className="w-10 h-10 rounded-xl bg-[#3B82F6]/15 flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}>
                <Zap className="w-5 h-5 text-[#3B82F6]" />
              </motion.div>
              <p className="text-sm font-bold text-white/80">Botão liberado!</p>
              <p className="text-xs text-white/40 text-center">O primeiro a apertar<br />ganha a vez de responder</p>
            </motion.div>
          )}

          {phase === 'won' && winnerName && (
            <motion.div key="won" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 py-4">
              <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 flex items-center justify-center">
                <User className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white/90">{winnerName}</p>
                <p className="text-xs text-white/40">clicou primeiro</p>
              </div>
              {reactionTime !== undefined && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-[#F59E0B]/10 rounded-full">
                  <Zap className="w-3 h-3 text-[#F59E0B]" />
                  <span className="text-xs font-bold text-[#F59E0B]">{formatReactionTime(clampReactionTime(reactionTime))}</span>
                </div>
              )}
              <p className="text-xs text-white/30">Aguardando resposta...</p>
            </motion.div>
          )}

          {phase === 'correct' && (
            <motion.div key="correct" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-xl bg-[#22C55E]/15 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[#22C55E]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-[#22C55E]">Resposta correta!</p>
                {winnerName && <p className="text-xs text-white/60">{winnerName} ganhou +1 ponto</p>}
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }} />
                ))}
              </div>
            </motion.div>
          )}

          {phase === 'wrong' && (
            <motion.div key="wrong" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-xl bg-[#EF4444]/15 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-[#EF4444]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-[#EF4444]">Resposta incorreta</p>
                {winnerName && <p className="text-xs text-white/60">{winnerName} errou</p>}
              </div>
              <p className="text-xs text-white/30">Botão reaberto para os demais</p>
            </motion.div>
          )}

          {phase === 'timeout' && (
            <motion.div key="timeout" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/15 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-[#F59E0B]">Tempo esgotado!</p>
                <p className="text-xs text-white/60">Ninguém respondeu a tempo</p>
              </div>
            </motion.div>
          )}

          {phase === 'next' && (
            <motion.div key="next" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="flex flex-col items-center gap-3 py-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-white/40" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/60">Próxima pergunta</p>
                {questionNumber && <p className="text-xs text-white/30">Pergunta {questionNumber + 1} de 15</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
