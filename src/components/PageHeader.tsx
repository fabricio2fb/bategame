'use client';

import React from 'react';
import { RotateCw } from 'lucide-react';

interface PageHeaderProps {
  onlineCount?: number;
  onRefresh?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  onlineCount = 128,
  onRefresh,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#CBD5E1]">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
          Bem-vindo ao BatePrimeiro
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Quem bater primeiro responde. Entre em uma sala aberta ou crie uma nova partida.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium bg-white border border-[#CBD5E1] px-3 py-1.5 rounded-lg text-[#64748B]">
          <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
          <span><strong className="text-[#0F172A] font-semibold">{onlineCount}</strong> jogadores online</span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 text-[#64748B] hover:text-[#0F172A] bg-white border border-[#CBD5E1] rounded-lg transition-colors"
            title="Atualizar lista de partidas"
            aria-label="Atualizar partidas"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
