'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerData } from '@/lib/types';
import { PlayerAvatar } from './PlayerAvatar';

interface GameCountdownProps {
  count: number;
  players: PlayerData[];
  accentColor?: string;
  gameIcon?: string;
  gameTitle?: string;
}

export const GameCountdown: React.FC<GameCountdownProps> = ({
  count,
  players,
  accentColor = '#3B82F6',
  gameIcon,
  gameTitle = 'BatePrimeiro',
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        backgroundColor: '#0F172A',
        backgroundImage: `radial-gradient(circle at 50% 32%, ${accentColor}66, transparent 24rem), linear-gradient(135deg, #0F172A 0%, ${accentColor} 120%)`,
      }}
    >
      <div className="text-center space-y-8">
        {gameIcon && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white/20 bg-white/90 shadow-2xl"
          >
            <img src={gameIcon} alt={`Icone do jogo ${gameTitle}`} className="h-11 w-11 object-contain" />
          </motion.div>
        )}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-lg font-semibold text-white/70">
          A partida vai começar
        </motion.p>

        <AnimatePresence mode="wait">
          <motion.div
            key={count}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="text-9xl sm:text-[10rem] font-bold text-white drop-shadow-lg"
          >
            {count}
          </motion.div>
        </AnimatePresence>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-4">
          {players.filter(p => p.isConnected).slice(0, 5).map(p => (
            <div key={p.id} className="flex flex-col items-center gap-1">
              <PlayerAvatar
                name={p.name}
                avatarUrl={p.avatarUrl}
                className="h-10 w-10 border-2 border-white/50 shadow-lg"
                textClassName="text-xs"
              />
              <span className="text-[10px] text-white/60 truncate max-w-[60px]">{p.name}</span>
            </div>
          ))}
          {players.length > 5 && (
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
              +{players.length - 5}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
