'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Medal, User } from 'lucide-react';

interface PlayerScore {
  id: string;
  name: string;
  score: number;
  isCurrent: boolean;
  isLeader: boolean;
  justScored: boolean;
}

interface MobileScoreBarProps {
  players: PlayerScore[];
}

export const MobileScoreBar: React.FC<MobileScoreBarProps> = ({ players }) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="lg:hidden bg-black/30 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto no-scrollbar">
        <Trophy className="w-3 h-3 text-amber-400 shrink-0 ml-1" />
        <AnimatePresence>
          {sorted.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold shrink-0 transition-all ${
                p.isCurrent
                  ? 'bg-sky-500/25 text-sky-300 ring-1 ring-sky-400/40'
                  : i === 0
                    ? 'bg-amber-500/10 text-amber-300'
                    : 'bg-white/5 text-white/50'
              }`}
            >
              {p.isCurrent && <User className="w-2.5 h-2.5" />}
              {i === 0 && !p.isCurrent && <Crown className="w-2.5 h-2.5 text-amber-400" />}
              <span className="truncate max-w-[44px]">{p.name.split(' ')[0]}</span>
              <span className={`tabular-nums ${i === 0 ? 'text-amber-400' : p.isCurrent ? 'text-sky-300' : 'text-white/40'}`}>
                {p.score}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
