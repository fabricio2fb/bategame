'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface BigBuzzerProProps {
  state: 'locked' | 'ready' | 'pressed' | 'won' | 'lost';
  onPress: () => void;
}

export const BigBuzzerPro: React.FC<BigBuzzerProProps> = ({ state, onPress }) => {
  const [pressing, setPressing] = useState(false);
  const isReady = state === 'ready';
  const isDisabled = state !== 'ready';

  const handlePress = () => {
    if (isDisabled) return;
    setPressing(true);
    onPress();
    setTimeout(() => setPressing(false), 350);
  };

  return (
    <div className="flex flex-col items-center">
      <motion.button
        type="button"
        disabled={isDisabled}
        onClick={handlePress}
        whileTap={isReady ? { scale: 0.88, y: 6 } : undefined}
        className="relative grid h-28 w-28 place-items-center rounded-full outline-none disabled:cursor-not-allowed sm:h-40 sm:w-40"
        aria-label={isReady ? 'Aperte o botão' : 'Aguarde'}
      >
        {/* Outer rotating ring */}
        {isReady && (
          <motion.div
            className="absolute -inset-3 sm:-inset-5 rounded-full border border-cyan-100/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Outer glow */}
        <div className={`absolute -inset-3 sm:-inset-4 rounded-full ${isReady ? 'bg-cyan-200/16 blur-xl' : 'bg-slate-950/8 blur-lg'}`} />

        {/* Base layer */}
        <div className="absolute inset-0 rounded-full bg-[linear-gradient(145deg,rgba(255,255,255,0.7),rgba(148,163,184,0.2)_28%,rgba(15,23,42,0.5)_76%)] shadow-[0_26px_50px_rgba(2,6,23,0.34),inset_0_2px_8px_rgba(255,255,255,0.48)]" />

        {/* Inner ring */}
        <div className={`absolute inset-2.5 sm:inset-3.5 rounded-full border ${isReady ? 'border-cyan-100/55 bg-cyan-300/16' : 'border-white/16 bg-white/6'} shadow-[inset_0_10px_22px_rgba(255,255,255,0.2),inset_0_-18px_30px_rgba(2,6,23,0.22)]`} />

        {/* Pressable face */}
        <motion.div
          className={`absolute inset-5 sm:inset-8 rounded-full ${isReady
            ? 'bg-[radial-gradient(circle_at_42%_24%,#FFFFFF,rgba(103,232,249,0.8)_22%,rgba(14,165,233,0.65)_60%,rgba(12,74,110,0.95))]'
            : state === 'won'
              ? 'bg-[radial-gradient(circle_at_42%_24%,#FFFFFF,rgba(74,222,128,0.8)_22%,rgba(34,197,94,0.65)_60%,rgba(22,101,52,0.95))]'
              : 'bg-[radial-gradient(circle_at_42%_24%,rgba(255,255,255,0.6),rgba(148,163,184,0.42)_34%,rgba(51,65,85,0.8))]'
          }`}
          animate={isReady ? { scale: [1, 1.04, 1] } : { opacity: [0.8, 0.95, 0.8] }}
          transition={{ duration: isReady ? 1.6 : 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Specular highlight */}
        <div className="absolute left-[24%] right-[36%] top-[17%] h-[16%] rounded-full bg-white/55 blur-sm rotate-[-20deg]" />

        {/* Icon + text */}
        <div className="relative z-10 flex flex-col items-center gap-1 text-white drop-shadow-lg">
          {isReady ? (
            <Zap className="h-6 w-6 sm:h-9 sm:w-9" />
          ) : state === 'won' ? (
            <Zap className="h-6 w-6 text-emerald-200 sm:h-9 sm:w-9" />
          ) : (
            <span className="text-lg sm:text-2xl">⏳</span>
          )}
          <span className="text-xs font-black tracking-[0.14em] sm:text-lg">
            {isReady ? 'APERTE' : state === 'won' ? 'VENCEU' : state === 'lost' ? 'PERDEU' : 'AGUARDE'}
          </span>
          {!isReady && state !== 'won' && state !== 'lost' && (
            <span className="flex gap-1 pt-1">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-white/50"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.18 }}
                />
              ))}
            </span>
          )}
        </div>
      </motion.button>
    </div>
  );
};
