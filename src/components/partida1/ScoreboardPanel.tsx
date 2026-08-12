'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Medal, TrendingUp, Zap } from 'lucide-react';
import { PlayerAvatar } from '@/components/PlayerAvatar';

interface PlayerScore {
  id: string;
  name: string;
  avatarUrl?: string;
  score: number;
  isCurrent: boolean;
  isLeader: boolean;
  justScored: boolean;
}

interface ScoreboardPanelProps {
  players: PlayerScore[];
}

export const ScoreboardPanel: React.FC<ScoreboardPanelProps> = ({ players }) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const topScore = sorted[0]?.score ?? 0;

  return (
    <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-[#F59E0B]" />
        <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Placar</span>
      </div>

      {/* Players */}
      <div className="p-2 space-y-1">
        <AnimatePresence>
          {sorted.map((p, i) => {
            const gap = topScore - p.score;
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                  p.isCurrent
                    ? 'bg-[#3B82F6]/10 ring-1 ring-[#3B82F6]/25'
                    : 'hover:bg-white/5'
                } ${p.justScored ? 'bg-[#22C55E]/10' : ''}`}
              >
                {/* Position badge */}
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  i === 0 ? 'bg-[#F59E0B] text-white' : i === 1 ? 'bg-[#94A3B8] text-white' : i === 2 ? 'bg-[#D97706] text-white' : 'bg-white/10 text-white/40'
                }`}>
                  {i < 3 ? (i === 0 ? <Crown className="w-3 h-3" /> : <Medal className="w-3 h-3" />) : i + 1}
                </div>

                {/* Avatar */}
                <PlayerAvatar name={p.name} avatarUrl={p.avatarUrl} className="h-7 w-7" textClassName="text-[9px]" />

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-medium truncate max-w-[70px] ${p.isCurrent ? 'text-[#93C5FD]' : 'text-white/70'}`}>
                      {p.name}
                    </span>
                    {p.isCurrent && <span className="text-[8px] text-[#3B82F6] font-medium">Você</span>}
                  </div>
                  {/* Difference to leader */}
                  {gap > 0 && (
                    <span className="text-[9px] text-white/30">-{gap}</span>
                  )}
                  {gap === 0 && i === 0 && (
                    <span className="text-[9px] text-[#F59E0B]/60 flex items-center gap-0.5">
                      <Crown className="w-2 h-2" /> Líder
                    </span>
                  )}
                </div>

                {/* Score */}
                <div className="flex items-center gap-1">
                  <motion.span
                    key={p.score}
                    initial={p.justScored ? { scale: 1.5, y: -5 } : undefined}
                    animate={{ scale: 1, y: 0 }}
                    className={`text-xs font-bold tabular-nums ${i === 0 ? 'text-[#F59E0B]' : p.isCurrent ? 'text-[#93C5FD]' : 'text-white/60'}`}
                  >
                    {p.score}
                  </motion.span>
                  {p.justScored && (
                    <motion.span initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      className="text-[9px] text-[#22C55E] font-bold">+1</motion.span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
