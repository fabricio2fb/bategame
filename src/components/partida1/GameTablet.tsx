'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface GameTabletProps {
  tone: 'idle' | 'active' | 'correct' | 'wrong' | 'buzzer-open';
  color: string;
}

const GLOW_COLORS: Record<string, string> = {
  active: 'rgba(14,165,233,0.5)',
  correct: 'rgba(34,197,94,0.5)',
  wrong: 'rgba(239,68,68,0.5)',
  'buzzer-open': 'rgba(251,191,36,0.6)',
};

export const GameTablet: React.FC<GameTabletProps> = ({ tone, color }) => {
  const glowColor = GLOW_COLORS[tone] || 'transparent';

  const screenClass = tone === 'correct'
    ? 'from-emerald-400 to-emerald-600'
    : tone === 'wrong'
      ? 'from-rose-400 to-rose-600'
      : tone === 'active'
        ? 'from-sky-300 to-cyan-500'
        : tone === 'buzzer-open'
          ? 'from-amber-200 to-amber-500'
          : 'from-slate-900 to-slate-800';

  const showLightning = tone === 'buzzer-open';

  return (
    <motion.div
      className="relative h-9 w-20 sm:h-10 sm:w-24"
      style={{ perspective: '500px' }}
    >
      <div className="absolute -bottom-1.5 left-2 right-2 h-2 rounded-full bg-black/25 blur-md" />

      <div
        className="relative h-full w-full rounded-lg bg-slate-950 p-[2px] shadow-lg"
        style={{
          transform: 'rotateX(55deg)',
          boxShadow: glowColor !== 'transparent'
            ? `0 0 16px ${glowColor}, 0 8px 20px rgba(2,6,23,0.3)`
            : '0 8px 20px rgba(2,6,23,0.3)',
        }}
      >
        <div className="absolute inset-0 rounded-lg border border-white/8" />

        <div className={`h-full w-full rounded-[6px] bg-gradient-to-br ${screenClass} border border-white/10 overflow-hidden`}>
          {showLightning && (
            <div className="flex h-full items-center justify-center">
              <Zap className="h-4 w-4 text-amber-50 drop-shadow-md sm:h-5 sm:w-5" />
            </div>
          )}
          {tone === 'active' && (
            <div className="h-full w-full bg-white/10" />
          )}
          <div className="h-1/2 rounded-t-[6px] bg-white/12" />
        </div>

        <div className="absolute -bottom-1 left-[6px] right-[6px] h-[5px] rounded-b-md bg-slate-800" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 rounded-lg"
        style={{
          transform: 'rotateX(55deg)',
          background: 'linear-gradient(160deg, rgba(255,255,255,0.08) 0%, transparent 40%, transparent 70%, rgba(255,255,255,0.04) 100%)',
        }}
      />
    </motion.div>
  );
};