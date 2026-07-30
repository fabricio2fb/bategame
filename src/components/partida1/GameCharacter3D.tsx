'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface GameCharacter3DProps {
  name: string;
  color: string;
  tabletColor?: string;
  isWinner: boolean;
  isLocal: boolean;
  isLookingAtLocal: boolean;
  phase: string;
  position?: { left: string; top: string; scale: number };
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function darken(hex: string, amt: number): string {
  const c = hexToRgb(hex);
  return `rgb(${Math.max(0, c.r - amt)},${Math.max(0, c.g - amt)},${Math.max(0, c.b - amt)})`;
}

function lighten(hex: string, amt: number): string {
  const c = hexToRgb(hex);
  return `rgb(${Math.min(255, c.r + amt)},${Math.min(255, c.g + amt)},${Math.min(255, c.b + amt)})`;
}

const SKIN = '#FFD5A8';
const SKIN_SHADOW = '#F0C090';
const MOUTH_COLOR = '#D4886A';
const BLUSH = '#FFB5B5';

export const GameCharacter3D: React.FC<GameCharacter3DProps> = ({
  name, color, isWinner, isLocal, isLookingAtLocal, phase,
}) => {
  if (isLocal) return null;

  const celebrate = isWinner && (phase === 'you-won' || phase === 'joao-won' || phase === 'correct');
  const sad = isWinner && phase === 'wrong';
  const lookAt = isLookingAtLocal;

  const irisColor = useMemo(() => {
    const palette = ['#3B82F6', '#22C55E', '#F59E0B', '#EC4899', '#8B5CF6', '#F97316'];
    return palette[name.length % palette.length];
  }, [name]);

  return (
    <motion.div
      className="absolute z-30 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: '50%', top: '50%' }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="relative flex flex-col items-center"
        animate={{
          y: celebrate ? [0, -6, 0] : [0, -1.5, 0],
        }}
        transition={{
          duration: celebrate ? 0.8 : 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <CharacterSVG
          color={color}
          irisColor={irisColor}
          celebrating={celebrate}
          sad={sad}
          looking={lookAt}
        />
      </motion.div>
    </motion.div>
  );
};

function CharacterSVG({ color, irisColor, celebrating, sad, looking }: {
  color: string;
  irisColor: string;
  celebrating: boolean;
  sad: boolean;
  looking: boolean;
}) {
  return (
    <svg viewBox="0 0 100 150" className="h-28 w-24 sm:h-36 sm:w-32 drop-shadow-lg" style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.3))' }}>
      <defs>
        <radialGradient id="head3d" cx="38%" cy="28%">
          <stop offset="0%" stopColor={lighten(SKIN, 40)} />
          <stop offset="100%" stopColor={SKIN_SHADOW} />
        </radialGradient>
        <radialGradient id="body3d" cx="38%" cy="18%">
          <stop offset="0%" stopColor={lighten(color, 50)} />
          <stop offset="100%" stopColor={darken(color, 35)} />
        </radialGradient>
        <radialGradient id="iris3d" cx="32%" cy="32%">
          <stop offset="0%" stopColor={lighten(irisColor, 70)} />
          <stop offset="100%" stopColor={darken(irisColor, 45)} />
        </radialGradient>
        <filter id="innerShadow">
          <feOffset dx="0" dy="2" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite operator="out" in="SourceGraphic" />
          <feComponentTransfer><feFuncA type="linear" slope="0.15" /></feComponentTransfer>
          <feBlend in="SourceGraphic" />
        </filter>
      </defs>

      {/* Shadow on ground */}
      <ellipse cx="50" cy="146" rx="26" ry="4" fill="rgba(0,0,0,0.2)" />

      {/* Left leg */}
      <rect x="33" y="118" width="14" height="22" rx="7" fill={darken(color, 45)} />
      {/* Right leg */}
      <rect x="53" y="118" width="14" height="22" rx="7" fill={darken(color, 45)} />

      {/* Left foot */}
      <ellipse cx="40" cy="139" rx="11" ry="6" fill={darken(color, 65)} />
      {/* Right foot */}
      <ellipse cx="60" cy="139" rx="11" ry="6" fill={darken(color, 65)} />

      {/* Body */}
      <rect x="26" y="78" width="48" height="46" rx="16" fill="url(#body3d)" filter="url(#innerShadow)" />
      <rect x="32" y="82" width="14" height="18" rx="7" fill="rgba(255,255,255,0.14)" />

      {/* Left arm */}
      <motion.g
        animate={celebrating ? { rotate: -40 } : sad ? { rotate: 5 } : { rotate: 18 }}
        transition={{ duration: 0.3 }}
        style={{ originX: '28px', originY: '90px' }}
      >
        <rect x="8" y="86" width="20" height="12" rx="6" fill={color} />
        <circle cx="10" cy="93" r="6" fill={lighten(color, 70)} />
      </motion.g>

      {/* Right arm */}
      <motion.g
        animate={celebrating ? { rotate: 40 } : sad ? { rotate: -5 } : { rotate: -18 }}
        transition={{ duration: 0.3 }}
        style={{ originX: '72px', originY: '90px' }}
      >
        <rect x="72" y="86" width="20" height="12" rx="6" fill={color} />
        <circle cx="90" cy="93" r="6" fill={lighten(color, 70)} />
      </motion.g>

      {/* Head */}
      <circle cx="50" cy="40" r="34" fill="url(#head3d)" />
      <ellipse cx="50" cy="62" rx="28" ry="9" fill="rgba(0,0,0,0.06)" />

      {/* Eyes - left */}
      <g>
        <motion.ellipse cx="38" cy="36" rx="10" ry="11" fill="white"
          animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
          transition={{ duration: 0.12, repeat: Infinity, repeatDelay: 3.2, times: [0, 0.94, 0.97, 1, 1] }}
        />
        <motion.ellipse cx={looking ? 40 : 39} cy="36" rx="6.5" ry="7" fill="url(#iris3d)"
          animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
          transition={{ duration: 0.12, repeat: Infinity, repeatDelay: 3.2, times: [0, 0.94, 0.97, 1, 1] }}
        />
        <motion.circle cx={looking ? 41 : 40} cy="35" r="3.2" fill="#1A1A2E"
          animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
          transition={{ duration: 0.12, repeat: Infinity, repeatDelay: 3.2, times: [0, 0.94, 0.97, 1, 1] }}
        />
        <circle cx="41" cy="32" r="2" fill="white" />
      </g>

      {/* Eyes - right */}
      <g>
        <motion.ellipse cx="62" cy="36" rx="10" ry="11" fill="white"
          animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
          transition={{ duration: 0.12, repeat: Infinity, repeatDelay: 3.2, times: [0, 0.94, 0.97, 1, 1] }}
        />
        <motion.ellipse cx={looking ? 64 : 63} cy="36" rx="6.5" ry="7" fill="url(#iris3d)"
          animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
          transition={{ duration: 0.12, repeat: Infinity, repeatDelay: 3.2, times: [0, 0.94, 0.97, 1, 1] }}
        />
        <motion.circle cx={looking ? 65 : 64} cy="35" r="3.2" fill="#1A1A2E"
          animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
          transition={{ duration: 0.12, repeat: Infinity, repeatDelay: 3.2, times: [0, 0.94, 0.97, 1, 1] }}
        />
        <circle cx="65" cy="32" r="2" fill="white" />
      </g>

      {/* Eyebrows */}
      <path d={sad ? 'M 28 24 Q 38 27 48 24' : 'M 28 24 Q 38 21 48 24'} stroke={darken(SKIN, 90)} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d={sad ? 'M 52 24 Q 62 27 72 24' : 'M 52 24 Q 62 21 72 24'} stroke={darken(SKIN, 90)} strokeWidth="2.2" fill="none" strokeLinecap="round" />

      {/* Mouth */}
      {sad ? (
        <path d="M 40 52 Q 50 46 60 52" stroke={MOUTH_COLOR} strokeWidth="2.8" fill="none" strokeLinecap="round" />
      ) : celebrating ? (
        <>
          <path d="M 38 50 Q 50 64 62 50" stroke={MOUTH_COLOR} strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d="M 40 50 Q 50 58 60 50" fill={lighten(MOUTH_COLOR, 30)} />
        </>
      ) : (
        <path d="M 39 51 Q 50 59 61 51" stroke={MOUTH_COLOR} strokeWidth="2.8" fill="none" strokeLinecap="round" />
      )}

      {/* Blush */}
      {!sad && (
        <>
          <ellipse cx="28" cy="46" rx="6" ry="3" fill={BLUSH} opacity="0.3" />
          <ellipse cx="72" cy="46" rx="6" ry="3" fill={BLUSH} opacity="0.3" />
        </>
      )}

      {/* Head highlight */}
      <ellipse cx="50" cy="16" rx="18" ry="7" fill="rgba(255,255,255,0.22)" />
    </svg>
  );
}
