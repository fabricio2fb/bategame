'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, X, Shield } from 'lucide-react';
import { PlayerData, Team } from '@/lib/types';

const AVATAR_COLORS = ['#3B82F6', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
const TEAM_COLORS = ['#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
const TEAM_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

interface LobbyPlayerPanelProps {
  players: PlayerData[];
  currentPlayerId: string | null;
  isHost: boolean;
  maxPlayers: number;
  onRemovePlayer: (playerId: string) => void;
  showTeams?: boolean;
  teams?: Team[];
}

export const LobbyPlayerPanel: React.FC<LobbyPlayerPanelProps> = ({ players, currentPlayerId, isHost, maxPlayers, onRemovePlayer, showTeams, teams }) => {
  const readyCount = players.filter(p => p.isReady && !p.isHost).length;
  const nonHostCount = players.filter(p => !p.isHost).length;
  const getTeamById = (id?: string) => teams?.find(t => t.id === id);

  return (
    <div className="bg-white/90 backdrop-blur-sm border-2 border-black/15 rounded-2xl overflow-hidden shadow-lg">
      <div className="p-4 border-b border-[#CBD5E1]/40">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0F172A]">Jogadores</h2>
          <span className="text-xs font-medium text-[#64748B]">{players.length}/{maxPlayers}</span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div className="h-full bg-[#3B82F6] rounded-full transition-all duration-500" style={{ width: `${(players.length / maxPlayers) * 100}%` }} />
          </div>
          <span className="text-[11px] text-[#64748B] font-medium">
            {readyCount}/{nonHostCount} prontos
          </span>
        </div>
      </div>
      <div className="p-3 space-y-1.5 max-h-[360px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {players.map((player, idx) => {
            const colorIdx = player.name.length % AVATAR_COLORS.length;
            const isCurrent = player.id === currentPlayerId;
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className={`flex items-center justify-between gap-2 p-2.5 rounded-xl transition-all ${
                  isCurrent ? 'bg-[#3B82F6]/8 ring-1 ring-[#3B82F6]/25' : player.isHost ? 'bg-[#F59E0B]/5 ring-1 ring-[#F59E0B]/15' : 'hover:bg-[#F8FAFC]'
                }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                      style={{ backgroundColor: AVATAR_COLORS[colorIdx] }}>
                      {getInitials(player.name)}
                    </div>
                    {player.isHost && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#F59E0B] rounded-full flex items-center justify-center shadow-sm">
                        <Crown className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <div className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-2 border-white ${
                      player.isConnected ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-[#0F172A] truncate">{player.name}</span>
                      {isCurrent && <span className="text-[10px] font-medium text-[#3B82F6] bg-[#3B82F6]/10 px-1.5 py-0.5 rounded">Você</span>}
                      {showTeams && player.teamId && (() => {
                        const team = getTeamById(player.teamId);
                        const color = team?.color || TEAM_COLORS[0];
                        return (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{
                            backgroundColor: `${color}20`,
                            color,
                          }}>
                            {team?.name || player.teamId}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {player.isReady && !player.isHost && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-2 py-0.5 bg-[#22C55E]/10 text-[#22C55E] text-[10px] font-bold rounded-md">
                      Pronto
                    </motion.div>
                  )}
                  {!player.isConnected && (
                    <span className="text-[10px] text-[#EF4444] font-medium">Offline</span>
                  )}
                  {isHost && !player.isHost && (
                    <button onClick={() => onRemovePlayer(player.id)}
                      className="p-1 rounded-md text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {players.length === 0 && (
          <div className="text-center py-6 text-sm text-[#94A3B8]">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>Aguardando jogadores...</p>
          </div>
        )}
      </div>
    </div>
  );
};
