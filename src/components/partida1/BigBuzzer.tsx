'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

type BuzzerStyle = 'blue' | 'glass' | 'metallic' | 'illuminated' | 'futuristic';

interface BigBuzzerProps {
  style: BuzzerStyle;
  state: 'locked' | 'ready' | 'pressed' | 'won' | 'lost';
  winnerName?: string;
  onPress: () => void;
}

export const BigBuzzer: React.FC<BigBuzzerProps> = ({ style, state, winnerName, onPress }) => {
  const [pressing, setPressing] = useState(false);

  const handlePress = () => {
    if (state !== 'ready') return;
    setPressing(true);
    onPress();
    setTimeout(() => setPressing(false), 300);
  };

  const isDisabled = state !== 'ready';

  const getStyle = () => {
    switch (style) {
      case 'blue': return <BlueBuzzer state={state} pressing={pressing} isDisabled={isDisabled} />;
      case 'glass': return <GlassBuzzer state={state} pressing={pressing} isDisabled={isDisabled} />;
      case 'metallic': return <MetallicBuzzer state={state} pressing={pressing} isDisabled={isDisabled} />;
      case 'illuminated': return <IlluminatedBuzzer state={state} pressing={pressing} isDisabled={isDisabled} />;
      case 'futuristic': return <FuturisticBuzzer state={state} pressing={pressing} isDisabled={isDisabled} />;
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.button
        onClick={handlePress}
        disabled={isDisabled}
        whileTap={state === 'ready' ? { scale: 0.92 } : undefined}
        className="relative w-44 h-44 rounded-full outline-none cursor-pointer disabled:cursor-not-allowed select-none"
        style={{ perspective: 400 }}
      >
        {getStyle()}
      </motion.button>
      <span className="text-xs font-medium text-white/50">
        {state === 'locked' ? 'Aguarde' : state === 'ready' ? 'Aperte para responder' : state === 'pressed' ? 'Enviado' : state === 'won' ? 'Você venceu!' : `${winnerName || 'Alguém'} venceu`}
      </span>
    </div>
  );
};

function BlueBuzzer({ state, pressing, isDisabled }: { state: string; pressing: boolean; isDisabled: boolean }) {
  return (
    <div className="relative w-full h-full">
      {/* Outer ring glow */}
      {state === 'ready' && (
        <motion.div className="absolute inset-[-10px] rounded-full bg-[#3B82F6]/20 blur-xl"
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }} />
      )}
      {/* Ring */}
      <div className={`absolute inset-[-4px] rounded-full border-4 transition-all duration-300 ${
        state === 'ready' ? 'border-[#3B82F6]/50' : state === 'won' ? 'border-[#22C55E]/50' : 'border-[#CBD5E1]/30'
      }`} />
      {/* Button surface */}
      <div className={`w-full h-full rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
        isDisabled ? 'bg-[#E2E8F0] text-[#94A3B8]' : 'bg-[#3B82F6] text-white shadow-[0_8px_32px_rgba(59,130,246,0.5)]'
      } ${pressing ? 'scale-90 shadow-[0_2px_8px_rgba(59,130,246,0.3)]' : ''}`}>
        <Zap className={`w-8 h-8 ${state === 'won' ? 'text-[#22C55E]' : ''}`} />
        <span className="text-sm font-bold">{state === 'won' ? '🏆' : state === 'ready' ? 'APERTE!' : state === 'locked' ? '⏳' : '✓'}</span>
      </div>
    </div>
  );
}

function GlassBuzzer({ state, pressing, isDisabled }: { state: string; pressing: boolean; isDisabled: boolean }) {
  return (
    <div className="relative w-full h-full">
      {state === 'ready' && (
        <motion.div className="absolute inset-[-10px] rounded-full bg-white/10 blur-xl"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }} />
      )}
      <div className="absolute inset-[-3px] rounded-full border border-white/20" />
      <div className={`w-full h-full rounded-full relative overflow-hidden backdrop-blur-md transition-all duration-200 ${
        isDisabled ? 'bg-white/10' : 'bg-white/20'
      } ${pressing ? 'scale-90' : ''}`}>
        {/* Glass reflections */}
        <div className="absolute top-2 left-4 right-16 h-8 bg-gradient-to-b from-white/40 to-transparent rounded-full rotate-[-20deg]" />
        <div className="absolute bottom-6 left-6 right-6 h-12 bg-gradient-to-t from-white/5 to-transparent rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-1 h-12 bg-white/10 rounded-full rotate-12" />
        <div className="flex flex-col items-center justify-center h-full gap-1 relative z-10">
          <Zap className={`w-8 h-8 ${state === 'ready' ? 'text-white' : 'text-white/50'}`} />
          <span className="text-sm font-bold text-white drop-shadow-sm">
            {state === 'won' ? '🏆' : state === 'ready' ? 'APERTE!' : state === 'locked' ? '⏳' : '✓'}
          </span>
        </div>
      </div>
    </div>
  );
}

function MetallicBuzzer({ state, pressing, isDisabled }: { state: string; pressing: boolean; isDisabled: boolean }) {
  return (
    <div className="relative w-full h-full">
      {state === 'ready' && (
        <motion.div className="absolute inset-[-8px] rounded-full bg-gradient-to-br from-[#94A3B8]/20 to-[#64748B]/20 blur-lg"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5 }} />
      )}
      <div className={`w-full h-full rounded-full transition-all duration-200 ${
        pressing ? 'scale-90' : ''
      }`} style={{
        background: isDisabled
          ? 'linear-gradient(145deg, #CBD5E1, #E2E8F0)'
          : 'linear-gradient(145deg, #94A3B8, #64748B)',
        boxShadow: isDisabled
          ? 'inset 0 2px 4px rgba(0,0,0,0.1)'
          : `inset 0 -4px 8px rgba(0,0,0,0.3), inset 0 4px 8px rgba(255,255,255,0.3), 0 8px 24px rgba(100,116,139,0.5)`,
      }}>
        {/* Metallic sheen */}
        <div className="absolute top-0 left-4 right-4 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
        <div className="absolute bottom-4 left-8 right-8 h-6 bg-gradient-to-t from-white/10 to-transparent rounded-full" />
        <div className="flex flex-col items-center justify-center h-full gap-1">
          <Zap className={`w-8 h-8 ${isDisabled ? 'text-[#94A3B8]' : 'text-white'}`} />
          <span className={`text-sm font-bold ${isDisabled ? 'text-[#94A3B8]' : 'text-white'}`}>
            {state === 'won' ? '🏆' : state === 'ready' ? 'APERTE!' : state === 'locked' ? '⏳' : '✓'}
          </span>
        </div>
      </div>
    </div>
  );
}

function IlluminatedBuzzer({ state, pressing, isDisabled }: { state: string; pressing: boolean; isDisabled: boolean }) {
  return (
    <div className="relative w-full h-full">
      {/* Intense glow */}
      {state === 'ready' && (
        <>
          <motion.div className="absolute inset-[-16px] rounded-full bg-[#3B82F6]/30 blur-2xl"
            animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5 }} />
          <motion.div className="absolute inset-[-8px] rounded-full bg-[#60A5FA]/20 blur-xl"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }} />
        </>
      )}
      {state === 'won' && (
        <div className="absolute inset-[-16px] rounded-full bg-[#22C55E]/30 blur-2xl animate-pulse" />
      )}
      {/* Multi-layer button */}
      <div className="absolute inset-[-2px] rounded-full bg-gradient-to-br from-[#3B82F6] to-[#1D4ED8]" />
      <div className={`absolute inset-[3px] rounded-full bg-gradient-to-br from-[#60A5FA] to-[#2563EB] transition-all duration-200 ${
        pressing ? 'inset-[6px]' : ''
      }`} />
      <div className={`absolute inset-[6px] rounded-full bg-gradient-to-br from-[#93C5FD]/40 to-[#3B82F6]/40 backdrop-blur-sm transition-all duration-200 ${
        pressing ? 'inset-[10px]' : ''
      }`} />
      {/* Inner glow */}
      {state === 'ready' && (
        <motion.div className="absolute inset-[15px] rounded-full bg-[#BFDBFE]/30 blur-sm"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }} />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 z-10">
        <Zap className={`w-8 h-8 ${isDisabled ? 'text-[#94A3B8]' : 'text-white'} drop-shadow-lg`} />
        <span className="text-sm font-bold text-white drop-shadow-lg">
          {state === 'won' ? '🏆' : state === 'ready' ? 'APERTE!' : state === 'locked' ? '⏳' : '✓'}
        </span>
      </div>
    </div>
  );
}

function FuturisticBuzzer({ state, pressing, isDisabled }: { state: string; pressing: boolean; isDisabled: boolean }) {
  return (
    <div className="relative w-full h-full">
      {/* Hex grid background */}
      {state === 'ready' && (
        <motion.div className="absolute inset-[-12px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }} />
      )}
      {/* Outer tech ring */}
      <div className={`absolute inset-[-6px] rounded-full border-2 transition-all duration-500 ${
        state === 'ready' ? 'border-[#3B82F6]/60' : state === 'won' ? 'border-[#22C55E]/60' : 'border-[#CBD5E1]/20'
      }`} style={{
        boxShadow: state === 'ready' ? '0 0 20px rgba(59,130,246,0.3), inset 0 0 20px rgba(59,130,246,0.1)' : 'none',
      }}>
        {/* Rotating dash array */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1"
            className={state === 'ready' ? 'text-[#3B82F6]/30' : state === 'won' ? 'text-[#22C55E]/30' : 'text-transparent'}
            strokeDasharray={state === 'ready' ? '8 4' : '0'} strokeLinecap="round">
            {state === 'ready' && <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="4s" repeatCount="indefinite" />}
          </circle>
        </svg>
      </div>
      {/* Button body */}
      <div className={`w-full h-full rounded-full transition-all duration-200 relative overflow-hidden ${
        pressing ? 'scale-85' : ''
      }`} style={{
        background: isDisabled
          ? 'linear-gradient(135deg, #1E293B, #334155)'
          : 'linear-gradient(135deg, #1E3A5F, #0F172A)',
        boxShadow: isDisabled
          ? 'none'
          : '0 0 30px rgba(59,130,246,0.3), inset 0 1px 0 rgba(147,197,253,0.2)',
        border: '1px solid rgba(59,130,246,0.2)',
      }}>
        {/* Circuit lines */}
        <div className="absolute top-3 left-3 w-6 h-px bg-[#3B82F6]/40" />
        <div className="absolute top-3 left-3 h-6 w-px bg-[#3B82F6]/40" />
        <div className="absolute bottom-3 right-3 w-6 h-px bg-[#3B82F6]/40" />
        <div className="absolute bottom-3 right-3 h-6 w-px bg-[#3B82F6]/40" />
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-12 h-12 rounded-full transition-all duration-300 ${
            state === 'ready' ? 'bg-[#3B82F6] shadow-[0_0_20px_rgba(59,130,246,0.5)]' : state === 'won' ? 'bg-[#22C55E]' : 'bg-[#334155]'
          }`} />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <Zap className={`w-6 h-6 ${isDisabled ? 'text-[#64748B]' : 'text-white'}`} />
          <span className="text-xs font-bold text-white drop-shadow-md">
            {state === 'won' ? '🏆' : state === 'ready' ? 'APERTE!' : state === 'locked' ? '⏳' : '✓'}
          </span>
        </div>
      </div>
    </div>
  );
}
