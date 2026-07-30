'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, HelpCircle, Zap } from 'lucide-react';
import { clampReactionTime, formatReactionTime } from '@/lib/reaction-time';

interface GameResultsProps {
  type: 'correct' | 'wrong' | 'timeout' | 'all_wrong';
  correctAnswer?: string;
  explanation?: string;
  playerName?: string;
  reactionTime?: number;
  score?: number;
}

export const GameResults: React.FC<GameResultsProps> = ({ type, correctAnswer, explanation, playerName, reactionTime, score }) => {
  const config = {
    correct: {
      icon: <CheckCircle className="w-10 h-10" />,
      bg: 'bg-[#22C55E]',
      lightBg: 'bg-[#22C55E]/10',
      text: 'text-[#22C55E]',
      title: 'Resposta correta!',
      subtitle: playerName ? `${playerName} acertou!` : 'Você acertou!',
    },
    wrong: {
      icon: <XCircle className="w-10 h-10" />,
      bg: 'bg-[#EF4444]',
      lightBg: 'bg-[#EF4444]/10',
      text: 'text-[#EF4444]',
      title: 'Resposta incorreta',
      subtitle: playerName ? `${playerName} errou` : 'Você errou!',
    },
    timeout: {
      icon: <Clock className="w-10 h-10" />,
      bg: 'bg-[#F59E0B]',
      lightBg: 'bg-[#F59E0B]/10',
      text: 'text-[#F59E0B]',
      title: 'Tempo esgotado!',
      subtitle: 'Ninguém respondeu a tempo',
    },
    all_wrong: {
      icon: <HelpCircle className="w-10 h-10" />,
      bg: 'bg-[#94A3B8]',
      lightBg: 'bg-[#94A3B8]/10',
      text: 'text-[#64748B]',
      title: 'Ninguém acertou!',
      subtitle: 'Todos erraram esta pergunta',
    },
  };

  const c = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="bg-white/95 backdrop-blur-sm border-2 border-black/15 rounded-2xl p-6 sm:p-8 text-center shadow-xl space-y-4">
        <div className={`w-16 h-16 rounded-2xl ${c.lightBg} flex items-center justify-center mx-auto`}>
          <div className={c.text}>{c.icon}</div>
        </div>

        <div className="space-y-1">
          <h2 className={`text-xl sm:text-2xl font-bold ${c.text}`}>{c.title}</h2>
          <p className="text-sm text-[#64748B]">{c.subtitle}</p>
        </div>

        {type === 'correct' && reactionTime !== undefined && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1]/60 rounded-full">
            <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="text-xs font-semibold text-[#0F172A]">{formatReactionTime(clampReactionTime(reactionTime))}</span>
            <span className="text-[10px] text-[#64748B]">tempo de reação</span>
          </div>
        )}

        {score !== undefined && (
          <div className="text-center">
            <span className="text-3xl font-bold text-[#22C55E]">+{score}</span>
            <span className="text-sm text-[#64748B] ml-1">ponto{score !== 1 ? 's' : ''}</span>
          </div>
        )}

        {correctAnswer && (
          <div className="bg-[#F8FAFC] border border-[#CBD5E1]/60 rounded-xl p-4 space-y-1">
            <p className="text-xs font-medium text-[#64748B]">Resposta correta:</p>
            <p className="text-lg font-bold text-[#22C55E]">{correctAnswer}</p>
          </div>
        )}

        {explanation && (
          <p className="text-sm text-[#64748B] leading-relaxed">{explanation}</p>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="pt-2"
        >
          <p className="text-xs text-[#94A3B8]">Avançando para a próxima pergunta...</p>
          <div className="flex justify-center gap-1 mt-2">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"
              animate={{ scale: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} />
            <motion.div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"
              animate={{ scale: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }} />
            <motion.div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"
              animate={{ scale: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
