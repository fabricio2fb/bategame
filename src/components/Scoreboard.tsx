'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Medal } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';

interface ScoreEntry {
  playerId: string;
  name: string;
  avatarUrl?: string;
  score: number;
}

interface ScoreboardProps {
  scores: ScoreEntry[];
  currentPlayerId: string | null;
  compact?: boolean;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ scores, currentPlayerId, compact }) => {
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto px-1 py-1">
        {sorted.slice(0, 4).map((s, i) => (
          <div key={s.playerId} className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1 text-xs ${
            s.playerId === currentPlayerId ? 'bg-[#3B82F6]/10 font-bold text-[#3B82F6]' : 'text-[#64748B]'
          }`}>
            <span className="text-[10px] font-bold opacity-50">{i + 1}o</span>
            <PlayerAvatar name={s.name} avatarUrl={s.avatarUrl} className="h-4 w-4" textClassName="text-[7px]" />
            <span className="max-w-[50px] truncate">{s.name}</span>
            <span className="font-bold">{s.score}</span>
          </div>
        ))}
        {sorted.length > 4 && <span className="self-center text-xs text-[#94A3B8]">+{sorted.length - 4}</span>}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-black/15 bg-white/90 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-[#CBD5E1]/40 p-3">
        <Trophy className="h-4 w-4 text-[#F59E0B]" />
        <h2 className="text-xs font-bold text-[#0F172A]">Placar</h2>
      </div>
      <div className="space-y-0.5 p-2">
        <AnimatePresence>
          {sorted.map((s, i) => {
            const isCurrent = s.playerId === currentPlayerId;
            const isLeader = i === 0;
            return (
              <motion.div
                key={s.playerId}
                layout
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className={`flex items-center justify-between gap-2 rounded-xl p-2 transition-all ${
                  isCurrent ? 'bg-[#3B82F6]/8 ring-1 ring-[#3B82F6]/20' : 'hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className="relative shrink-0">
                    <PlayerAvatar name={s.name} avatarUrl={s.avatarUrl} className="h-7 w-7" textClassName="text-[10px]" />
                    {i < 3 && (
                      <span className={`absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full text-white ${
                        i === 0 ? 'bg-[#F59E0B]' : i === 1 ? 'bg-[#94A3B8]' : 'bg-[#D97706]'
                      }`}>
                        {i === 0 ? <Crown className="h-2.5 w-2.5" /> : <Medal className="h-2.5 w-2.5" />}
                      </span>
                    )}
                  </div>
                  <span className={`max-w-[80px] truncate text-xs ${isCurrent ? 'font-bold text-[#3B82F6]' : 'font-medium text-[#0F172A]'}`}>
                    {s.name}
                  </span>
                  {isCurrent && <span className="rounded bg-[#3B82F6]/10 px-1 py-0.5 text-[9px] font-medium text-[#3B82F6]">Voce</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <motion.span
                    key={s.score}
                    initial={{ scale: 1.3, y: -5 }}
                    animate={{ scale: 1, y: 0 }}
                    className={`text-xs font-bold ${isLeader ? 'text-[#F59E0B]' : isCurrent ? 'text-[#3B82F6]' : 'text-[#0F172A]'}`}
                  >
                    {s.score}
                  </motion.span>
                  <span className="text-[10px] text-[#94A3B8]">pts</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {sorted.length === 0 && (
          <div className="py-4 text-center text-xs text-[#94A3B8]">Nenhum ponto ainda</div>
        )}
      </div>
    </div>
  );
};
