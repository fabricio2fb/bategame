'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronUp, X } from 'lucide-react';

interface ScoreEntry {
  playerId: string;
  name: string;
  score: number;
}

interface MobileScoreboardDrawerProps {
  open: boolean;
  onClose: () => void;
  scores: ScoreEntry[];
  currentPlayerId: string | null;
}

export const MobileScoreboardDrawer: React.FC<MobileScoreboardDrawerProps> = ({ open, onClose, scores, currentPlayerId }) => {
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 sm:hidden" onClick={onClose} />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white rounded-t-2xl shadow-xl max-h-[60vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#CBD5E1]/40 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#F59E0B]" />
                <h2 className="text-sm font-bold text-[#0F172A]">Placar</h2>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#F1F5F9] cursor-pointer">
                <ChevronUp className="w-5 h-5 text-[#64748B]" />
              </button>
            </div>
            <div className="p-4 space-y-1">
              {sorted.map((s, i) => (
                <div key={s.playerId} className={`flex items-center justify-between p-3 rounded-xl ${
                  s.playerId === currentPlayerId ? 'bg-[#3B82F6]/8 ring-1 ring-[#3B82F6]/20' : ''
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-xs font-bold text-[#64748B]">{i + 1}</span>
                    <span className="text-sm font-semibold text-[#0F172A]">{s.name}</span>
                    {s.playerId === currentPlayerId && <span className="text-[10px] text-[#3B82F6] font-medium">Você</span>}
                  </div>
                  <span className="text-sm font-bold text-[#0F172A]">{s.score}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
