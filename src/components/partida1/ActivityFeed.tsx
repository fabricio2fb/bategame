'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Check, X, Eye, Mic, Clock } from 'lucide-react';

export interface FeedEvent {
  id: string;
  type: 'buzzer' | 'choosing' | 'chosen' | 'correct' | 'wrong' | 'timeout' | 'spoke';
  playerName: string;
  detail?: string;
  altLabel?: string;
  altText?: string;
}

interface ActivityFeedProps {
  events: FeedEvent[];
}

const EVENT_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  buzzer: { icon: <Zap className="w-3 h-3" />, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  choosing: { icon: <Eye className="w-3 h-3" />, color: 'text-sky-400', bg: 'bg-sky-400/10' },
  chosen: { icon: <Eye className="w-3 h-3" />, color: 'text-sky-300', bg: 'bg-sky-400/10' },
  correct: { icon: <Check className="w-3 h-3" />, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  wrong: { icon: <X className="w-3 h-3" />, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  timeout: { icon: <Clock className="w-3 h-3" />, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  spoke: { icon: <Mic className="w-3 h-3" />, color: 'text-sky-400', bg: 'bg-sky-400/10' },
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ events }) => {
  return (
    <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-lg">
      <div className="px-4 py-3 border-b border-white/5">
        <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Histórico da Rodada</span>
      </div>
      <div className="p-2 max-h-64 overflow-y-auto">
        <AnimatePresence initial={false}>
          {events.length === 0 && (
            <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-[11px] text-white/25 text-center py-4">
              Aguardando ações...
            </motion.p>
          )}
          {events.map((evt) => {
            const cfg = EVENT_CONFIG[evt.type] || EVENT_CONFIG.buzzer;
            return (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: -12, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                transition={{ duration: 0.25 }}
                className="flex items-start gap-2 px-2 py-1.5"
              >
                <div className={`mt-0.5 grid h-5 w-5 place-items-center rounded-md shrink-0 ${cfg.bg} ${cfg.color}`}>
                  {cfg.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white/70 leading-tight">
                    <span className="text-white font-bold">{evt.playerName}</span>
                    {' '}
                    {evt.type === 'buzzer' && 'apertou primeiro'}
                    {evt.type === 'choosing' && 'está escolhendo...'}
                    {evt.type === 'chosen' && <>escolheu <span className="font-bold text-sky-300">{evt.altLabel} — {evt.altText}</span></>}
                    {evt.type === 'correct' && <span className="text-emerald-400 font-bold">acertou!</span>}
                    {evt.type === 'wrong' && <span className="text-rose-400 font-bold">errou</span>}
                    {evt.type === 'timeout' && 'tempo esgotado'}
                    {evt.type === 'spoke' && 'respondeu'}
                  </p>
                  {evt.detail && (
                    <p className="text-[10px] text-white/30 mt-0.5">{evt.detail}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
