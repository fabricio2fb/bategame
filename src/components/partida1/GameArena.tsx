'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameArenaProps {
  winnerId: string | null;
  phase: string;
}

export const GameArena: React.FC<GameArenaProps> = ({ winnerId, phase }) => {
  const showRipple = !!winnerId && (phase === 'you-won' || phase === 'joao-won');

  return (
    <div className="absolute inset-[5%_4%_9%] sm:inset-[3%_4%_7%] rounded-[50%] [transform:rotateX(58deg)]">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.32),rgba(20,184,166,0.10)_30%,rgba(15,23,42,0.40)_65%,rgba(2,6,23,0.70))] shadow-[0_38px_90px_rgba(15,23,42,0.38)]" />

      <div className="absolute inset-[2%] rounded-full border border-white/30 shadow-[inset_0_1px_16px_rgba(255,255,255,0.20),0_0_28px_rgba(125,211,252,0.15)]" />

      <div className="absolute inset-[8%] rounded-full border border-cyan-100/15" />

      <div className="absolute inset-[19%] rounded-full bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.22),rgba(255,255,255,0.06)_30%,rgba(15,23,42,0.12)_72%)] border border-white/10" />

      <div className="absolute left-[19%] right-[19%] top-[18%] h-[16%] rounded-full bg-white/14 blur-md" />

      <div className="absolute left-[22%] right-[22%] bottom-[10%] h-[13%] rounded-full bg-black/16 blur-lg" />

      <AnimatePresence>
        {showRipple && (
          <motion.div
            key="ripple"
            initial={{ scale: 0.3, opacity: 0.6 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-100/50"
          />
        )}
      </AnimatePresence>

      <div className="absolute left-[30%] right-[30%] top-[30%] bottom-[30%] rounded-full border border-white/5" />
      <div className="absolute left-[40%] right-[40%] top-[40%] bottom-[40%] rounded-full border border-white/4" />
    </div>
  );
};