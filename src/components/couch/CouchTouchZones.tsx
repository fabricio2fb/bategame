'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CouchPlayer } from '@/hooks/useCouchGame';

interface CouchTouchZonesProps {
  players: CouchPlayer[];
  onPress: (playerId: string) => void;
  disabled: boolean;
  winnerId: string | null;
}

export const CouchTouchZones: React.FC<CouchTouchZonesProps> = ({ players, onPress, disabled, winnerId }) => {
  const count = players.length;

  const getGridClass = () => {
    if (count === 2) return 'grid-cols-1 grid-rows-2';
    if (count === 3) return 'grid-cols-1 grid-rows-3';
    return 'grid-cols-2 grid-rows-2';
  };

  const consumeEvent = (event: React.SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      className={`grid ${getGridClass()} flex-1 min-h-0 w-full gap-2 sm:gap-4`}
      style={{
        height: '100%',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        overscrollBehavior: 'none',
      }}
    >
      {players.map((player) => {
        const isWinner = player.id === winnerId;
        const isDimmed = disabled && !isWinner;

        return (
          <motion.button
            key={player.id}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!disabled) onPress(player.id);
            }}
            onPointerUp={consumeEvent}
            onTouchEnd={consumeEvent}
            onClick={consumeEvent}
            disabled={disabled}
            animate={isWinner ? { scale: [1, 1.03, 1] } : undefined}
            transition={isWinner ? { repeat: Infinity, duration: 0.6 } : undefined}
            className={`relative h-full min-h-[112px] rounded-3xl flex flex-col items-center justify-center gap-2 sm:gap-3 transition-all overflow-hidden ${
              isDimmed ? 'opacity-25' : ''
            } ${isWinner ? 'ring-4 ring-white shadow-[0_0_40px_rgba(255,255,255,0.3)]' : 'active:scale-95'}`}
            style={{
              backgroundColor: `${player.control.color}25`,
              border: `3px solid ${isWinner ? player.control.color : `${player.control.color}40`}`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
            <div
              className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white text-2xl sm:text-4xl font-black shadow-lg"
              style={{ backgroundColor: player.control.color }}
            >
              {player.name.charAt(0).toUpperCase()}
            </div>
            <span className="relative text-lg sm:text-2xl font-bold text-white">{player.name}</span>
            {!disabled && !isWinner && (
              <span className="relative text-base sm:text-xl font-black text-white/80 animate-pulse">TOQUE!</span>
            )}
            {isWinner && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 px-4 py-1.5 bg-white/25 rounded-full backdrop-blur-sm"
              >
                <span className="text-sm font-bold text-white">APERTOU!</span>
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
