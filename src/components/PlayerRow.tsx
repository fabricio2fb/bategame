'use client';

import React from 'react';
import { X } from 'lucide-react';
import { PlayerData } from '@/lib/types';

const AVATAR_COLORS = ['#3B82F6', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

interface PlayerRowProps {
  player: PlayerData;
  isCurrent: boolean;
  canRemove: boolean;
  onRemove: () => void;
}

export const PlayerRow: React.FC<PlayerRowProps> = ({ player, isCurrent, canRemove, onRemove }) => {
  const colorIdx = player.name.length % AVATAR_COLORS.length;
  return (
    <div className={`flex items-center justify-between gap-3 p-3 rounded-xl transition-colors ${
      isCurrent ? 'bg-[#3B82F6]/5 border border-[#3B82F6]/20' : 'bg-[#F8FAFC] border border-[#CBD5E1]/60'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
          style={{ backgroundColor: AVATAR_COLORS[colorIdx] }}>
          {getInitials(player.name)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-[#0F172A] truncate">{player.name}</span>
            {isCurrent && <span className="text-[11px] font-medium text-[#3B82F6]">Você</span>}
            {player.isHost && (
              <span className="text-[11px] font-semibold text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-1.5 py-0.5 rounded-md">Host</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
            {player.isReady ? (
              <><span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /><span>Pronto</span></>
            ) : (
              <><span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" /><span>Não está pronto</span></>
            )}
            {!player.isConnected && <span className="text-[#EF4444]">(desconectado)</span>}
          </div>
        </div>
      </div>
      {canRemove && !player.isHost && (
        <button onClick={onRemove} className="p-2 rounded-lg text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer" aria-label={`Remover ${player.name}`}>
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
