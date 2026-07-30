'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ArenaFloorProps {
  showRipple: boolean;
}

export const ArenaFloor: React.FC<ArenaFloorProps> = ({ showRipple }) => {
  return (
    <div className="absolute inset-[4%_3%_8%] sm:inset-[2%_3%_6%] rounded-[50%] [transform:rotateX(58deg)]" style={{ transformOrigin: 'center bottom' }}>
      {/* Main floor gradient */}
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.35),rgba(20,184,166,0.12)_32%,rgba(15,23,42,0.42)_65%,rgba(2,6,23,0.72))] shadow-[0_40px_100px_rgba(15,23,42,0.4)]" />

      {/* Outer ring */}
      <div className="absolute inset-[1.5%] rounded-full border border-white/30 shadow-[inset_0_1px_18px_rgba(255,255,255,0.22),0_0_30px_rgba(125,211,252,0.18)]" />

      {/* Second ring */}
      <div className="absolute inset-[6%] rounded-full border border-cyan-100/18" />

      {/* Inner glow ring */}
      <div className="absolute inset-[16%] rounded-full bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.24),rgba(255,255,255,0.07)_30%,rgba(15,23,42,0.14)_72%)] border border-white/12" />

      {/* Top highlight strip */}
      <div className="absolute left-[18%] right-[18%] top-[16%] h-[14%] rounded-full bg-white/16 blur-md" />

      {/* Bottom shadow strip */}
      <div className="absolute left-[20%] right-[20%] bottom-[8%] h-[12%] rounded-full bg-black/20 blur-lg" />

      {/* Center decoration rings */}
      <div className="absolute left-[28%] right-[28%] top-[28%] bottom-[28%] rounded-full border border-white/6" />
      <div className="absolute left-[38%] right-[38%] top-[38%] bottom-[38%] rounded-full border border-white/4" />

      {/* Ripple on win */}
      <AnimatePresence>
        {showRipple && (
          <motion.div
            key="ripple"
            initial={{ scale: 0.2, opacity: 0.7 }}
            animate={{ scale: 2.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-200/50"
          />
        )}
      </AnimatePresence>
    </div>
  );
};
