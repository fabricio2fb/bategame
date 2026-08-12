'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, Home, Users, Zap, CheckCircle, XCircle } from 'lucide-react';
import { Podium } from './Podium';

interface FinalScore {
  playerId: string;
  name: string;
  avatarUrl?: string;
  score: number;
}

interface FinalResultsProps {
  scores: FinalScore[];
  currentPlayerId: string | null;
  isHost: boolean;
  accentColor?: string;
  onRematch: () => void;
  onLeave: () => void;
}

export const FinalResults: React.FC<FinalResultsProps> = ({ scores, currentPlayerId, isHost, accentColor, onRematch, onLeave }) => {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const topScore = sorted[0]?.score ?? 0;
  const winners = sorted.filter(s => s.score === topScore);
  const isTie = winners.length > 1;
  const isWinner = winners.some(w => w.playerId === currentPlayerId);

  const pageBackground = accentColor
    ? `radial-gradient(circle at 50% 12%, ${accentColor}66, transparent 28rem), linear-gradient(135deg, #0F172A 0%, ${accentColor} 100%)`
    : undefined;

  return (
    <div
      className={`min-h-screen flex flex-col ${accentColor ? '' : 'bg-gradient-to-br from-[#38BDF8] to-[#4ADE80]'}`}
      style={accentColor ? { backgroundColor: '#0F172A', backgroundImage: pageBackground } : undefined}
    >
      <div className="flex-1 max-w-3xl mx-auto px-4 w-full py-6 sm:py-10 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/15 flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8 text-[#F59E0B]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-sm">
            {isTie ? 'Empate!' : `${winners[0].name} venceu!`}
          </h1>
          {isWinner && !isTie && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="text-lg font-semibold text-white/80">
              Parabéns! Você é o(a) grande vencedor(a)!
            </motion.p>
          )}
          {isTie && (
            <p className="text-sm text-white/70">Vários jogadores empataram na liderança!</p>
          )}
        </motion.div>

        {/* Podium */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-sm border-2 border-black/15 rounded-2xl p-6 shadow-lg">
          <Podium winners={sorted} currentPlayerId={currentPlayerId} isTie={isTie} isWinner={isWinner} />
        </motion.div>

        {/* Full ranking */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white/90 backdrop-blur-sm border-2 border-black/15 rounded-2xl p-4 sm:p-6 shadow-lg">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#64748B]" />
            Classificação completa
          </h2>
          <div className="space-y-1">
            <AnimatePresence>
              {sorted.map((s, i) => (
                <motion.div
                  key={s.playerId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.05 }}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    s.playerId === currentPlayerId ? 'bg-[#3B82F6]/8 ring-1 ring-[#3B82F6]/20' : 'hover:bg-[#F8FAFC]'
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-[#F59E0B] text-white' : i === 1 ? 'bg-[#94A3B8] text-white' : i === 2 ? 'bg-[#D97706] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}>
                      {i + 1}
                    </div>
                    <span className="text-sm font-semibold text-[#0F172A]">{s.name}</span>
                    {s.playerId === currentPlayerId && (
                      <span className="text-[10px] font-medium text-[#3B82F6] bg-[#3B82F6]/10 px-1.5 py-0.5 rounded">Você</span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-[#0F172A]">{s.score} <span className="text-[10px] font-normal text-[#64748B]">pts</span></span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-3">
          {isHost && (
            <button onClick={onRematch}
              className="flex-1 py-3.5 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              style={{ backgroundColor: accentColor || '#3B82F6', boxShadow: `0 4px 16px ${accentColor || '#3B82F6'}55` }}>
              <RefreshCw className="w-4 h-4" /><span>Revanche</span>
            </button>
          )}
          <button onClick={onLeave}
            className={`${isHost ? 'flex-1' : 'w-full'} py-3.5 bg-white/80 hover:bg-white text-[#0F172A] font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#CBD5E1]/60 hover:border-[#CBD5E1]`}>
            <Home className="w-4 h-4" /><span>Sair</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};
