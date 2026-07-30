'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isCurrent: boolean;
  isBuzzerWinner: boolean;
  score: number;
}

const AVATAR_COLORS = ['#3B82F6', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

interface StagePlayersProps {
  players: Player[];
  currentPlayerId: string;
  winnerId: string | null;
  phase: string;
}

export const StagePlayers: React.FC<StagePlayersProps> = ({ players, currentPlayerId, winnerId, phase }) => {
  const showNotification = phase === 'answering' || phase === 'answer-result';

  return (
    <div className="relative w-full">
      {/* Stage arc */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/10 to-transparent rounded-[100%] mx-[-10%]" />

      {/* Players in semicircle */}
      <div className="flex items-end justify-center gap-3 sm:gap-5 px-4 pb-4">
        <AnimatePresence>
          {players.map((player, idx) => {
            const color = AVATAR_COLORS[player.name.length % AVATAR_COLORS.length];
            const isWinner = player.id === winnerId;
            const isCurrent = player.id === currentPlayerId;
            const angle = ((idx - (players.length - 1) / 2) / players.length) * 60;
            const yOffset = Math.abs(angle) * 0.3;

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
                className="flex flex-col items-center gap-1.5"
                style={{ transform: `translateY(${yOffset}px)` }}
              >
                {/* Character placeholder */}
                <motion.div
                  animate={{
                    scale: isWinner ? [1, 1.12, 1] : 1,
                    y: isWinner ? [0, -8, 0] : 0,
                  }}
                  transition={{ duration: 0.5, repeat: isWinner ? Infinity : 0, repeatDelay: 2 }}
                  className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg transition-all duration-300 ${
                    isWinner ? 'ring-2 ring-[#F59E0B] ring-offset-2 ring-offset-transparent' : ''
                  } ${isCurrent ? 'ring-2 ring-[#3B82F6]/50' : ''}`}
                  style={{
                    backgroundColor: color,
                    boxShadow: isWinner ? `0 0 20px ${color}40` : '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  {getInitials(player.name)}
                  {/* Buzzer tablet in front */}
                  {showNotification && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-sm flex items-center justify-center shadow-sm">
                      <div className="w-2.5 h-2 rounded-sm bg-[#1E293B]" />
                    </motion.div>
                  )}
                </motion.div>
                {/* Name */}
                <span className={`text-[10px] sm:text-xs font-medium text-center max-w-[60px] truncate ${
                  isWinner ? 'text-[#F59E0B]' : isCurrent ? 'text-[#3B82F6]' : 'text-white/70'
                }`}>
                  {player.name}
                  {isCurrent && <span className="ml-0.5 text-[9px]">(Você)</span>}
                </span>
                {/* Score below */}
                <span className="text-[9px] text-white/40 font-medium">{player.score} pts</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
