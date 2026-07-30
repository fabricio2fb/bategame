'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import { PlayerData } from '@/lib/types';

interface GameCountdownProps {
  count: number;
  players: PlayerData[];
}

export const GameCountdown: React.FC<GameCountdownProps> = ({ count, players }) => {
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#38BDF8] to-[#4ADE80] flex flex-col items-center justify-center">
      <div className="text-center space-y-8">
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
          {players.filter(p => p.isConnected).slice(0, 5).map(p => {
            const colors = ['#3B82F6', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6'];
            const color = colors[p.name.length % colors.length];
            return (
              <div key={p.id} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white/50 shadow-lg"
                  style={{ backgroundColor: color }}>
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-[10px] text-white/60 truncate max-w-[60px]">{p.name}</span>
              </div>
            );
          })}
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
