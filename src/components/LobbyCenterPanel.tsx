'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, Globe } from 'lucide-react';
import { RoomState, RoomSettings } from '@/lib/types';
import { RoomCodeDisplay } from './RoomCodeDisplay';
import { Logo } from './Logo';

interface LobbyCenterPanelProps {
  room: RoomState;
  readyCount: number;
  nonHostCount: number;
}

export const LobbyCenterPanel: React.FC<LobbyCenterPanelProps> = ({ room, readyCount, nonHostCount }) => {
  const allReady = nonHostCount > 0 && readyCount >= nonHostCount;
  const categorySummary = room.settings.categories.slice(0, 3).join(', ');
  const extra = room.settings.categories.length > 3 ? ` +${room.settings.categories.length - 3}` : '';

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-4">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-sm tracking-tight">{room.name}</h1>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-xs text-white/70">
            {room.settings.privacy === 'private' ? (
              <><Shield className="w-3 h-3 inline mr-0.5" />Privada</>
            ) : (
              <><Globe className="w-3 h-3 inline mr-0.5" />Pública</>
            )}
          </span>
          <span className="text-white/30">·</span>
          <span className="text-xs text-white/70">{categorySummary}{extra}</span>
        </div>
      </div>

      <RoomCodeDisplay code={room.code} />

      <div className="text-center space-y-1">
        {room.status === 'lobby' && (
          <AnimatePresence mode="wait">
            {allReady ? (
              <motion.div key="ready" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#22C55E]/15 backdrop-blur-sm rounded-full border border-[#22C55E]/25">
                  <Users className="w-4 h-4 text-[#22C55E]" />
                  <span className="text-sm font-bold text-white">Todos prontos! Vamos começar?</span>
                </div>
              </motion.div>
            ) : (
              <motion.p key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-white/60">
                {nonHostCount === 0
                  ? 'Compartilhe o código com seus amigos'
                  : `Aguardando ${nonHostCount - readyCount} jogador${nonHostCount - readyCount !== 1 ? 'es' : ''} ficar${nonHostCount - readyCount !== 1 ? 'em' : ''} pronto${nonHostCount - readyCount !== 1 ? 's' : ''}...`
                }
              </motion.p>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
