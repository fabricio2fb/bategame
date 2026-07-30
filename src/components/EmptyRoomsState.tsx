'use client';

import React from 'react';
import { Gamepad2, Plus } from 'lucide-react';

interface EmptyRoomsStateProps {
  onOpenCreate: () => void;
}

export const EmptyRoomsState: React.FC<EmptyRoomsStateProps> = ({ onOpenCreate }) => {
  return (
    <div className="bg-white/90 border-2 border-black/15 rounded-2xl p-10 text-center space-y-4 my-4">
      <div className="w-12 h-12 rounded-full bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center text-[#64748B] mx-auto">
        <Gamepad2 className="w-6 h-6" />
      </div>

      <div className="max-w-md mx-auto space-y-1">
        <h3 className="text-lg font-bold text-[#0F172A]">
          Nenhuma partida disponível agora
        </h3>
        <p className="text-xs sm:text-sm text-[#64748B]">
          Crie uma nova sala e convide seus amigos para começar a jogar imediatamente.
        </p>
      </div>

      <button
        onClick={onOpenCreate}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-sm rounded-lg transition-colors shadow-sm cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Criar primeira partida</span>
      </button>
    </div>
  );
};
