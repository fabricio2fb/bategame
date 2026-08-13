'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Medal, Award } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';

interface PodiumEntry {
  playerId: string;
  name: string;
  avatarUrl?: string;
  score: number;
}

interface PodiumProps {
  winners: PodiumEntry[];
  currentPlayerId: string | null;
  isTie: boolean;
  isWinner: boolean;
}

export const Podium: React.FC<PodiumProps> = ({ winners, currentPlayerId, isTie, isWinner }) => {
  const sorted = [...winners].sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);
  const topScore = sorted[0]?.score ?? 0;

  const podiumPositions = [
    { height: 'h-32', playerIndex: 1, delay: 0.2, label: '2º' },
    { height: 'h-40', playerIndex: 0, delay: 0, label: '1º' },
    { height: 'h-24', playerIndex: 2, delay: 0.4, label: '3º' },
  ];

  return (
    <div className="flex items-end justify-center gap-4 sm:gap-6 pt-4">
      {podiumPositions.map((pos, idx) => {
        const player = top3[pos.playerIndex];
        if (!player) {
          return <div key={pos.label} className={`w-24 sm:w-28 ${pos.height} flex items-end justify-center pb-3`}>
            <span className="text-xs text-[#94A3B8]">-</span>
          </div>;
        }

        const isCurrent = player.playerId === currentPlayerId;
        const isFirst = pos.playerIndex === 0;

        return (
          <motion.div
            key={player.playerId}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: pos.delay, duration: 0.5, type: 'spring' }}
            className={`relative w-24 sm:w-28 ${pos.height} flex flex-col items-center justify-end`}>
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: pos.delay + 0.3, type: 'spring' }}
              className={`absolute -top-12 sm:-top-14 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg border-4 ${
                isFirst ? 'border-[#F59E0B]' : 'border-white'
              }`}
            >
              <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} className="h-full w-full" textClassName="text-lg" />
            </motion.div>
            {/* Crown for 1st */}
            {isFirst && (
              <motion.div initial={{ y: -20 }} animate={{ y: 0 }} transition={{ delay: 0.6 }}
                className="absolute -top-20 sm:-top-24">
                <Crown className="w-6 h-6 text-[#F59E0B]" />
              </motion.div>
            )}
            {/* Name */}
            <div className="text-center mt-2">
              <p className={`text-xs font-bold truncate max-w-[80px] ${isCurrent ? 'text-[#3B82F6]' : 'text-[#0F172A]'}`}>
                {player.name}
              </p>
              <p className="text-sm font-bold text-[#F59E0B]">{player.score}</p>
              <p className="text-[10px] text-[#64748B]">pontos</p>
            </div>
            {/* Podium block */}
            <div className={`w-full rounded-t-xl mt-2 flex items-center justify-center ${
              isFirst ? 'bg-[#F59E0B]/20 h-20' : idx === 0 ? 'bg-[#94A3B8]/20 h-16' : 'bg-[#D97706]/15 h-12'
            }`}>
              <span className="text-xs font-bold text-[#64748B]">{pos.label}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
