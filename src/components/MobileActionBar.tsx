'use client';

import React from 'react';
import { Plus, Key } from 'lucide-react';

interface MobileActionBarProps {
  onOpenCreate: () => void;
  onOpenJoin: () => void;
}

export const MobileActionBar: React.FC<MobileActionBarProps> = ({
  onOpenCreate,
  onOpenJoin,
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-2 gap-2.5">
        <button
          onClick={onOpenJoin}
          className="py-3 px-3 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#0F172A] font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Key className="w-4 h-4 text-[#64748B]" />
          <span>Entrar com código</span>
        </button>

        <button
          onClick={onOpenCreate}
          className="py-3 px-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Criar partida</span>
        </button>
      </div>
    </div>
  );
};
