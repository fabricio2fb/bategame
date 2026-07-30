'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface PlayerTablet3DProps {
  tone: 'idle' | 'buzzer-open' | 'active' | 'correct' | 'wrong' | 'timeout';
  color: string;
  playerName: string;
}

const GLOW_MAP: Record<string, string> = {
  active: 'rgba(14,165,233,0.6)',
  correct: 'rgba(34,197,94,0.6)',
  wrong: 'rgba(239,68,68,0.6)',
  'buzzer-open': 'rgba(251,191,36,0.7)',
  timeout: 'rgba(245,158,11,0.5)',
};

function getScreenGradient(tone: string): string {
  switch (tone) {
    case 'correct': return 'from-emerald-400 to-emerald-600';
    case 'wrong': return 'from-rose-400 to-rose-600';
    case 'active': return 'from-sky-300 to-cyan-500';
    case 'buzzer-open': return 'from-amber-200 to-amber-500';
    case 'timeout': return 'from-amber-200 to-orange-500';
    default: return 'from-slate-900 to-slate-800';
  }
}

export const PlayerTablet3D: React.FC<PlayerTablet3DProps> = ({ tone, color, playerName }) => {
  const glowColor = GLOW_MAP[tone] || 'transparent';
  const isLit = tone !== 'idle';
  const screenGrad = getScreenGradient(tone);
  const isBuzzerOpen = tone === 'buzzer-open';

  return (
    <div className="relative" style={{ perspective: '400px' }}>
      {/* Shadow on table */}
      <div className="absolute -bottom-2 left-3 right-3 h-3 rounded-full bg-black/30 blur-md" />

      {/* Base / stand */}
      <div className="absolute -bottom-1.5 left-4 right-4 h-2.5 rounded-b-lg bg-gradient-to-b from-slate-700 to-slate-900" />

      {/* Tablet body */}
      <motion.div
        className="relative h-12 w-28 rounded-lg sm:h-14 sm:w-32"
        style={{
          transform: 'rotateX(55deg)',
          boxShadow: isLit
            ? `0 0 20px ${glowColor}, 0 10px 24px rgba(2,6,23,0.4)`
            : '0 8px 20px rgba(2,6,23,0.35)',
        }}
        animate={tone === 'timeout' ? { opacity: [1, 0.3, 1] } : undefined}
        transition={{ duration: 0.35, repeat: tone === 'timeout' ? Infinity : 0 }}
      >
        {/* Metallic frame */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-slate-600 to-slate-800 p-[2px]">
          {/* Screen */}
          <div className={`relative h-full w-full rounded-[5px] bg-gradient-to-br ${screenGrad} overflow-hidden`}>
            {/* Glass reflection */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/18 to-transparent pointer-events-none" />
            <div className="absolute -left-2 top-2 h-10 w-10 bg-white/6 rounded-full blur-lg pointer-events-none" />

            {/* Content */}
            {isBuzzerOpen && (
              <div className="flex h-full items-center justify-center">
                <Zap className="h-5 w-5 text-amber-50 drop-shadow-md sm:h-6 sm:w-6" />
              </div>
            )}

            {tone === 'active' && (
              <div className="h-full w-full bg-white/8" />
            )}

            {isLit && <div className="h-1/2 rounded-t-[5px] bg-white/10" />}
          </div>
        </div>

        {/* Bezel edge highlight */}
        <div className="absolute inset-0 rounded-lg border border-white/8" />

        {/* Bottom bezel thickness */}
        <div className="absolute -bottom-1 left-[6px] right-[6px] h-[5px] rounded-b-md bg-slate-800" />
      </motion.div>

      {/* Screen glow effect */}
      {isLit && (
        <motion.div
          className="absolute -inset-2 rounded-xl pointer-events-none"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: `radial-gradient(ellipse at center, ${glowColor}, transparent 70%)`,
            transform: 'rotateX(55deg)',
          }}
        />
      )}
    </div>
  );
};
