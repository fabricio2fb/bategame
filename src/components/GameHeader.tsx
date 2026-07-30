'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';

interface GameHeaderProps {
  questionNumber: number;
  totalQuestions: number;
  category: string;
  connectionStatus: string;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ questionNumber, totalQuestions, category, connectionStatus }) => {
  const progress = totalQuestions > 0 ? (questionNumber / totalQuestions) * 100 : 0;

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-[#CBD5E1]/40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-3 min-w-0">
            <Logo className="[&>div]:h-7 [&>div]:w-7 [&>span]:hidden sm:[&>span]:inline [&>span]:text-sm" />
            <span className="text-xs font-bold text-[#64748B] whitespace-nowrap">Pergunta {questionNumber}/{totalQuestions}</span>
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#3B82F6] bg-[#3B82F6]/8 px-2 py-0.5 rounded-full font-medium">
              {category}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                <motion.div className="h-full bg-[#3B82F6] rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
              connectionStatus === 'connected' ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`} />
              {connectionStatus === 'connected' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
