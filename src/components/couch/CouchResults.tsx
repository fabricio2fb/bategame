'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, RefreshCw, Users, Home, Zap, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { CouchPlayer } from '@/hooks/useCouchGame';

const AVATAR_COLORS = ['#3B82F6', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

interface CouchResultsProps {
  players: CouchPlayer[];
  onRematch: () => void;
  onChangePlayers: () => void;
  onExit: () => void;
}

export const CouchResults: React.FC<CouchResultsProps> = ({ players, onRematch, onChangePlayers, onExit }) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);

  const podiumPositions = [
    { height: 'h-28 sm:h-36', order: 2, delay: 0.2, label: '2º', medal: 'bg-[#94A3B8]' },
    { height: 'h-36 sm:h-44', order: 1, delay: 0, label: '1º', medal: 'bg-[#F59E0B]' },
    { height: 'h-24 sm:h-28', order: 3, delay: 0.4, label: '3º', medal: 'bg-[#D97706]' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c1929] via-[#0f2744] to-[#0a1628] flex flex-col">
      <div className="flex-1 max-w-3xl mx-auto px-4 w-full py-6 sm:py-10 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/15 flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8 text-[#F59E0B]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {sorted.length > 1 && sorted[0].score === sorted[1]?.score ? 'Empate!' : `${sorted[0].name} venceu!`}
          </h1>
        </motion.div>

        {/* Podium */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6">
          <div className="flex items-end justify-center gap-3 sm:gap-5">
            {podiumPositions.map((pos, idx) => {
              const player = top3[idx];
              return (
                <motion.div key={pos.label}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: pos.delay, duration: 0.5, type: 'spring' }}
                  className={`relative w-24 sm:w-28 ${pos.height} flex flex-col items-center justify-end`}>
                  {player && (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: pos.delay + 0.3, type: 'spring' }}
                        className={`absolute -top-12 sm:-top-14 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg border-4 ${
                          idx === 1 ? 'border-[#F59E0B]' : 'border-white/20'
                        }`}
                        style={{ backgroundColor: AVATAR_COLORS[player.name.length % AVATAR_COLORS.length] }}>
                        {getInitials(player.name)}
                      </motion.div>
                      {idx === 1 && (
                        <motion.div initial={{ y: -20 }} animate={{ y: 0 }} transition={{ delay: 0.6 }}
                          className="absolute -top-20 sm:-top-24">
                          <Crown className="w-6 h-6 text-[#F59E0B]" />
                        </motion.div>
                      )}
                      <div className="text-center mt-2">
                        <p className="text-xs font-bold text-white truncate max-w-[80px]">{player.name}</p>
                        <p className="text-sm font-bold text-[#F59E0B]">{player.score}</p>
                      </div>
                      <div className={`w-full rounded-t-xl mt-2 flex items-center justify-center ${pos.medal}/20 ${idx === 1 ? 'h-16' : idx === 0 ? 'h-12' : 'h-10'}`}>
                        <span className="text-xs font-bold text-white/60">{pos.label}</span>
                      </div>
                    </>
                  )}
                  {!player && (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-xs text-white/20">-</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Full scoreboard */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 sm:p-5">
          <h2 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5" /> Classificação completa
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-white/40 uppercase tracking-wider border-b border-white/5">
                  <th className="text-left py-2 px-2 font-semibold">#</th>
                  <th className="text-left py-2 px-2 font-semibold">Jogador</th>
                  <th className="text-center py-2 px-2 font-semibold">Pts</th>
                  <th className="text-center py-2 px-2 font-semibold"><CheckCircle className="w-3 h-3 inline" /></th>
                  <th className="text-center py-2 px-2 font-semibold"><XCircle className="w-3 h-3 inline" /></th>
                  <th className="text-center py-2 px-2 font-semibold"><Clock className="w-3 h-3 inline" /></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => {
                  const avgReaction = p.buzzCount > 0 ? Math.round(p.totalReactionTime / p.buzzCount) : 0;
                  return (
                    <motion.tr key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.04 }}
                      className="border-b border-white/5 last:border-0">
                      <td className="py-2.5 px-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                          i === 0 ? 'bg-[#F59E0B] text-white' : i === 1 ? 'bg-[#94A3B8] text-white' : i === 2 ? 'bg-[#D97706] text-white' : 'bg-white/10 text-white/40'
                        }`}>
                          {i < 3 ? (i === 0 ? <Crown className="w-3 h-3" /> : <Medal className="w-3 h-3" />) : i + 1}
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                            style={{ backgroundColor: AVATAR_COLORS[p.name.length % AVATAR_COLORS.length] }}>
                            {getInitials(p.name)}
                          </div>
                          <span className="text-xs font-semibold text-white/80 truncate">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="text-sm font-bold text-[#F59E0B]">{p.score}</span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="text-xs font-semibold text-[#22C55E]">{p.correctCount}</span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="text-xs font-semibold text-[#EF4444]">{p.wrongCount}</span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="text-xs font-semibold text-white/40 flex items-center justify-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" />
                          {avgReaction > 0 ? `${avgReaction}ms` : '-'}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={onRematch}
            className="flex-1 py-3.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-[0_2px_12px_rgba(59,130,246,0.25)]">
            <RefreshCw className="w-4 h-4" /> Jogar novamente
          </button>
          <button type="button" onClick={onChangePlayers}
            className="flex-1 py-3.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/10">
            <Users className="w-4 h-4" /> Trocar jogadores
          </button>
          <Link href="/"
            className="flex-1 py-3.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10">
            <Home className="w-4 h-4" /> Voltar ao início
          </Link>
        </motion.div>
      </div>
    </div>
  );
};
