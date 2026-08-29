'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { clampReactionTime, formatReactionTime } from '@/lib/reaction-time';

type BuzzerState = 'locked' | 'waiting' | 'ready' | 'pressed' | 'won' | 'lost';

interface BuzzerButtonProps {
  state: BuzzerState;
  winnerName?: string;
  reactionTime?: number;
  onPress: () => void;
}

export const BuzzerButton: React.FC<BuzzerButtonProps> = ({ state, winnerName, reactionTime, onPress }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        onClick={state === 'ready' ? onPress : undefined}
        disabled={state !== 'ready'}
        animate={{
          scale: state === 'pressed' ? 0.9 : state === 'ready' ? [1, 1.03, 1] : 1,
        }}
        transition={{
          scale: state === 'ready' ? { repeat: Infinity, duration: 1.5 } : { duration: 0.2 },
        }}
        style={{ willChange: state === 'ready' || state === 'pressed' ? 'transform' : undefined }}
        className={`relative w-40 h-40 rounded-full font-bold text-lg transition-all cursor-pointer disabled:cursor-not-allowed outline-none ${
          state === 'ready'
            ? 'bg-[#3B82F6] text-white shadow-[0_8px_32px_rgba(59,130,246,0.5)] active:shadow-[0_2px_8px_rgba(59,130,246,0.3)] active:scale-95'
            : state === 'pressed'
              ? 'bg-[#2563EB] text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)]'
              : state === 'won'
                ? 'bg-[#22C55E] text-white shadow-[0_8px_32px_rgba(34,197,94,0.5)]'
                : state === 'lost'
                  ? 'bg-[#E2E8F0] text-[#94A3B8] shadow-none'
                  : 'bg-[#E2E8F0] text-[#94A3B8]'
        }`}>
        {/* Outer ring glow */}
        {state === 'ready' && (
          <motion.div
            className="absolute inset-[-6px] rounded-full border-2 border-[#3B82F6]/30"
            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
        {state === 'won' && (
          <motion.div
            className="absolute inset-[-6px] rounded-full border-2 border-[#22C55E]/30"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
        {/* Button surface */}
        <div className="relative flex flex-col items-center justify-center gap-1">
          {state === 'locked' && <><span className="text-2xl">⏳</span><span className="text-xs">Aguarde</span></>}
          {state === 'waiting' && <><span className="text-2xl">🤚</span><span className="text-xs">Prepare-se</span></>}
          {state === 'ready' && <><Zap className="w-8 h-8" /><span className="text-sm">Aperte!</span></>}
          {state === 'pressed' && <><Zap className="w-8 h-8" /><span className="text-sm">Enviado</span></>}
          {state === 'won' && <><span className="text-2xl">🏆</span><span className="text-xs">Você venceu!</span></>}
          {state === 'lost' && <><span className="text-2xl">👀</span><span className="text-xs">{winnerName?.split(' ')[0]} venceu</span></>}
        </div>
      </motion.button>

      {state === 'won' && reactionTime !== undefined && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-[#22C55E]/20 shadow-sm">
          <Zap className="w-3 h-3 text-[#F59E0B]" />
          <span className="text-xs font-bold text-[#0F172A]">{formatReactionTime(clampReactionTime(reactionTime))}</span>
          <span className="text-[10px] text-[#64748B]">tempo de reação</span>
        </motion.div>
      )}

      {state === 'lost' && winnerName && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-sm font-medium text-[#64748B]">
          {winnerName} apertou primeiro
        </motion.p>
      )}
    </div>
  );
};
