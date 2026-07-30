'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Medal } from 'lucide-react';

interface ScoreEntry {
  playerId: string;
  name: string;
  score: number;
}

interface ScoreboardProps {
  scores: ScoreEntry[];
  currentPlayerId: string | null;
  compact?: boolean;
}

const AVATAR_COLORS = ['#3B82F6', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ scores, currentPlayerId, compact }) => {
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto py-1 px-1">
        {sorted.slice(0, 4).map((s, i) => (
          <div key={s.playerId} className={`flex items-center gap-1.5 text-xs whitespace-nowrap px-2 py-1 rounded-lg ${
            s.playerId === currentPlayerId ? 'bg-[#3B82F6]/10 text-[#3B82F6] font-bold' : 'text-[#64748B]'
          }`}>
            <span className="text-[10px] font-bold opacity-50">{i + 1}º</span>
            <span className="max-w-[50px] truncate">{s.name}</span>
            <span className="font-bold">{s.score}</span>
          </div>
        ))}
        {sorted.length > 4 && <span className="text-xs text-[#94A3B8] self-center">+{sorted.length - 4}</span>}
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm border-2 border-black/15 rounded-2xl overflow-hidden shadow-lg">
      <div className="p-3 border-b border-[#CBD5E1]/40 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-[#F59E0B]" />
        <h2 className="text-xs font-bold text-[#0F172A]">Placar</h2>
      </div>
      <div className="p-2 space-y-0.5">
        <AnimatePresence>
          {sorted.map((s, i) => {
            const colorIdx = s.name.length % AVATAR_COLORS.length;
            const isCurrent = s.playerId === currentPlayerId;
            const isLeader = i === 0;
            return (
              <motion.div
                key={s.playerId}
                layout
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className={`flex items-center justify-between gap-2 p-2 rounded-xl transition-all ${
                  isCurrent ? 'bg-[#3B82F6]/8 ring-1 ring-[#3B82F6]/20' : 'hover:bg-[#F8FAFC]'
                }`}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${
                    i === 0 ? 'bg-[#F59E0B]' : i === 1 ? 'bg-[#94A3B8]' : i === 2 ? 'bg-[#D97706]' : ''
                  }`} style={{ backgroundColor: i > 2 ? AVATAR_COLORS[colorIdx] : undefined }}>
                    {i < 3 ? (i === 0 ? <Crown className="w-3 h-3" /> : <Medal className="w-3 h-3" />) : getInitials(s.name)}
                  </div>
                  <span className={`text-xs truncate max-w-[80px] ${isCurrent ? 'font-bold text-[#3B82F6]' : 'font-medium text-[#0F172A]'}`}>
                    {s.name}
                  </span>
                  {isCurrent && <span className="text-[9px] text-[#3B82F6] font-medium bg-[#3B82F6]/10 px-1 py-0.5 rounded">Você</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  <motion.span key={s.score} initial={{ scale: 1.3, y: -5 }} animate={{ scale: 1, y: 0 }}
                    className={`text-xs font-bold ${isLeader ? 'text-[#F59E0B]' : isCurrent ? 'text-[#3B82F6]' : 'text-[#0F172A]'}`}>
                    {s.score}
                  </motion.span>
                  <span className="text-[10px] text-[#94A3B8]">pts</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {sorted.length === 0 && (
          <div className="text-center py-4 text-xs text-[#94A3B8]">Nenhum ponto ainda</div>
        )}
      </div>
    </div>
  );
};
