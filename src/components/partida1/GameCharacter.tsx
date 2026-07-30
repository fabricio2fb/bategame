'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { GameTablet } from './GameTablet';

interface GameCharacterProps {
  name: string;
  color: string;
  tabletTone: 'idle' | 'active' | 'correct' | 'wrong' | 'buzzer-open';
  position: { left: string; top: string; scale: number };
  isWinner: boolean;
  isLocal: boolean;
  isLookingAtLocal: boolean;
  phase: string;
}

const EYE_COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EC4899', '#8B5CF6', '#F97316'];

function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `rgb(${r},${g},${b})`;
}

function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}

export const GameCharacter: React.FC<GameCharacterProps> = ({
  name, color, tabletTone, position, isWinner, isLocal, isLookingAtLocal, phase,
}) => {
  if (isLocal) return null;

  const celebrate = isWinner && (phase === 'you-won' || phase === 'joao-won' || phase === 'correct');
  const sad = isWinner && phase === 'wrong';
  const eyeIndex = useMemo(() => name.length % EYE_COLORS.length, [name]);
  const irisColor = EYE_COLORS[eyeIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: position.scale * 0.92 }}
      animate={{ opacity: 1, y: sad ? 10 : 0, scale: position.scale }}
      transition={{ duration: 0.36 }}
      className="absolute z-30 flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center sm:w-28"
      style={{ left: position.left, top: position.top }}
    >
      <motion.div
        className="relative flex flex-col items-center"
        animate={{ y: celebrate ? [0, -4, 0] : [0, -1.5, 0] }}
        transition={{ duration: celebrate ? 0.6 : 2.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <CharacterSVG color={color} irisColor={irisColor} celebrating={celebrate} sad={sad} looking={isLookingAtLocal} />

        <GameTablet tone={tabletTone} color={color} />

        <div className="mt-1 flex flex-col items-center leading-none">
          <span className="max-w-20 truncate rounded-full bg-slate-950/45 px-2 py-0.5 text-[9px] font-bold text-white shadow-lg backdrop-blur-md sm:text-[11px]">
            {name}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

function CharacterSVG({ color, irisColor, celebrating, sad, looking }: {
  color: string; irisColor: string; celebrating: boolean; sad: boolean; looking: boolean;
}) {
  const blinkDuration = 0.12;
  const blinkRepeatDelay = 3.5;
  const skinColor = '#FFE4C4';
  const skinShadow = '#F5D5B8';
  const mouthColor = '#D4886A';
  const blushColor = '#FFB5B5';

  return (
    <div className="relative h-24 w-20 sm:h-28 sm:w-24">
      <svg viewBox="0 0 100 130" className="h-full w-full drop-shadow-lg" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' }}>
        <defs>
          <radialGradient id="headGrad" cx="40%" cy="30%">
            <stop offset="0%" stopColor={lighten(skinColor, 30)} />
            <stop offset="100%" stopColor={skinShadow} />
          </radialGradient>
          <radialGradient id="bodyGrad" cx="40%" cy="20%">
            <stop offset="0%" stopColor={lighten(color, 40)} />
            <stop offset="100%" stopColor={darken(color, 30)} />
          </radialGradient>
          <radialGradient id="irisGrad" cx="35%" cy="35%">
            <stop offset="0%" stopColor={lighten(irisColor, 60)} />
            <stop offset="100%" stopColor={darken(irisColor, 40)} />
          </radialGradient>
        </defs>

        {/* Shadow on floor */}
        <ellipse cx="50" cy="128" rx="28" ry="4" fill="rgba(0,0,0,0.18)" />

        {/* Left leg */}
        <rect x="32" y="104" width="13" height="20" rx="6.5" fill={darken(color, 40)} />
        {/* Right leg */}
        <rect x="55" y="104" width="13" height="20" rx="6.5" fill={darken(color, 40)} />

        {/* Left foot */}
        <ellipse cx="38.5" cy="125" rx="10" ry="5" fill={darken(color, 60)} />
        {/* Right foot */}
        <ellipse cx="61.5" cy="125" rx="10" ry="5" fill={darken(color, 60)} />

        {/* Body */}
        <rect x="28" y="60" width="44" height="48" rx="14" fill="url(#bodyGrad)" />
        {/* Body highlight */}
        <rect x="34" y="63" width="14" height="20" rx="7" fill="rgba(255,255,255,0.12)" />

        {/* Left arm */}
        <g transform={celebrating ? 'rotate(-35, 30, 72)' : sad ? 'rotate(5, 30, 72)' : 'rotate(20, 30, 72)'}>
          <rect x="10" y="68" width="17" height="11" rx="5.5" fill={color} />
          <circle cx="12" cy="75" r="5.5" fill={lighten(color, 60)} />
        </g>

        {/* Right arm */}
        <g transform={celebrating ? 'rotate(35, 70, 72)' : sad ? 'rotate(-5, 70, 72)' : 'rotate(-20, 70, 72)'}>
          <rect x="73" y="68" width="17" height="11" rx="5.5" fill={color} />
          <circle cx="88" cy="75" r="5.5" fill={lighten(color, 60)} />
        </g>

        {/* Head */}
        <circle cx="50" cy="35" r="30" fill="url(#headGrad)" />
        {/* Head bottom shadow */}
        <ellipse cx="50" cy="55" rx="26" ry="8" fill="rgba(0,0,0,0.06)" />

        {/* Eyes */}
        <g>
          {/* Left eye white */}
          <motion.ellipse
            cx="39" cy="31" rx="8" ry="9" fill="white"
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ duration: blinkDuration, repeat: Infinity, repeatDelay: blinkRepeatDelay, times: [0, 0.95, 0.97, 0.99, 1] }}
          />
          {/* Right eye white */}
          <motion.ellipse
            cx="61" cy="31" rx="8" ry="9" fill="white"
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ duration: blinkDuration, repeat: Infinity, repeatDelay: blinkRepeatDelay, times: [0, 0.95, 0.97, 0.99, 1] }}
          />

          {/* Left iris */}
          <motion.circle
            cx={looking ? 41 : 40} cy="31" r="5.5" fill="url(#irisGrad)"
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ duration: blinkDuration, repeat: Infinity, repeatDelay: blinkRepeatDelay, times: [0, 0.95, 0.97, 0.99, 1] }}
          />
          {/* Right iris */}
          <motion.circle
            cx={looking ? 63 : 62} cy="31" r="5.5" fill="url(#irisGrad)"
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ duration: blinkDuration, repeat: Infinity, repeatDelay: blinkRepeatDelay, times: [0, 0.95, 0.97, 0.99, 1] }}
          />

          {/* Left pupil */}
          <motion.circle
            cx={looking ? 42 : 41} cy="30" r="2.8" fill="#1A1A2E"
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ duration: blinkDuration, repeat: Infinity, repeatDelay: blinkRepeatDelay, times: [0, 0.95, 0.97, 0.99, 1] }}
          />
          {/* Right pupil */}
          <motion.circle
            cx={looking ? 64 : 63} cy="30" r="2.8" fill="#1A1A2E"
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ duration: blinkDuration, repeat: Infinity, repeatDelay: blinkRepeatDelay, times: [0, 0.95, 0.97, 0.99, 1] }}
          />

          {/* Left highlight */}
          <circle cx="42" cy="28" r="1.8" fill="white" />
          {/* Right highlight */}
          <circle cx="64" cy="28" r="1.8" fill="white" />
        </g>

        {/* Eyebrows */}
        <path d={sad ? 'M 32 21 Q 39 23 46 21' : 'M 32 21 Q 39 19 46 21'} stroke={darken(skinColor, 80)} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d={sad ? 'M 54 21 Q 61 23 68 21' : 'M 54 21 Q 61 19 68 21'} stroke={darken(skinColor, 80)} strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Mouth */}
        {sad ? (
          <path d="M 42 46 Q 50 40 58 46" stroke={mouthColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ) : celebrating ? (
          <path d="M 40 44 Q 50 56 60 44" stroke={mouthColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M 41 45 Q 50 52 59 45" stroke={mouthColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}

        {/* Blush */}
        {!sad && (
          <>
            <ellipse cx="32" cy="40" rx="5" ry="2.5" fill={blushColor} opacity="0.35" />
            <ellipse cx="68" cy="40" rx="5" ry="2.5" fill={blushColor} opacity="0.35" />
          </>
        )}

        {/* Head top highlight */}
        <ellipse cx="50" cy="14" rx="16" ry="6" fill="rgba(255,255,255,0.2)" />
      </svg>
    </div>
  );
}
