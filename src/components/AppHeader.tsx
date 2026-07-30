'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, Key, Plus } from 'lucide-react';
import { Logo } from './Logo';

interface AppHeaderProps {
  onOpenCreate: () => void;
  onOpenJoin: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenCreate,
  onOpenJoin,
}) => {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <header className="h-16 sm:h-18 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-4">
        {/* Left: Brand & Nav links */}
        <div className="flex items-center gap-6 sm:gap-8">
          <Link href="/" className="focus:outline-none focus:ring-2 focus:ring-[#3B82F6] rounded-xl p-1">
            <Logo />
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
            <Link
              href="/"
              className="text-black font-semibold flex items-center gap-1.5"
            >
              <span>Partidas</span>
            </Link>
            <Link
              href="/como-jogar"
              className="text-black/60 hover:text-black transition-colors"
            >
              Como jogar
            </Link>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Sound toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            aria-label={isMuted ? 'Ativar som' : 'Desativar som'}
            className="p-2.5 rounded-full bg-white text-black/60 hover:text-black border border-[#CBD5E1] hover:border-[#3B82F6]/50 transition-all cursor-pointer"
            title={isMuted ? 'Som desativado' : 'Som ativado'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-[#EF4444]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#22C55E]" />
            )}
          </button>

          {/* Join by code */}
          <button
            onClick={onOpenJoin}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-black bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] hover:border-[#3B82F6]/40 rounded-full transition-all cursor-pointer"
          >
            <Key className="w-4 h-4 text-[#94A3B8]" />
            <span>Entrar com código</span>
          </button>

          {/* Create room primary */}
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-full transition-all shadow-[0_2px_12px_rgba(59,130,246,0.25)] hover:shadow-[0_4px_16px_rgba(59,130,246,0.4)] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Criar partida</span>
          </button>
        </div>
      </div>
    </header>
  );
};
