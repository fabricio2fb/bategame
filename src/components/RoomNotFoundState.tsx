'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { GAME_REGISTRY } from '@/lib/game-registry';
import type { GameType } from '@/lib/types';

interface RoomNotFoundStateProps {
  gameType?: GameType;
  message?: string;
}

function getGameHomePath(gameType: GameType): string {
  return gameType === 'bateprimeiro' ? '/bateprimeiro' : `/${gameType}`;
}

export function RoomNotFoundState({
  gameType = 'bateprimeiro',
  message = 'Confira o codigo e tente novamente.',
}: RoomNotFoundStateProps) {
  const game = GAME_REGISTRY[gameType] || GAME_REGISTRY.bateprimeiro;
  const homePath = getGameHomePath(game.gameType);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: '#0F172A',
        backgroundImage:
          game.gameType === 'bateprimeiro'
            ? 'linear-gradient(to bottom right, #38BDF8, #4ADE80)'
            : `radial-gradient(circle at 50% 18%, ${game.accentColor}55, transparent 28rem), linear-gradient(to bottom right, #0F172A, #1E293B)`,
      }}
    >
      <header className="h-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/90 shadow-sm">
              <img src={game.icon} alt="" className="h-7 w-7 object-contain" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-black text-white">{game.title}</span>
              {game.gameType === 'bateprimeiro' && (
                <span className="block text-[10px] font-bold uppercase tracking-wider text-white/55">BatePrimeiro</span>
              )}
            </span>
          </Link>
          <Link href="/" className="text-xs font-bold text-white/65 transition-colors hover:text-white sm:text-sm">
            Hub
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl border-2 border-black/15 bg-white p-8 text-center shadow-[0_18px_55px_rgba(15,23,42,0.25)] sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: `${game.accentColor}18` }}>
            <LogOut className="h-7 w-7" style={{ color: game.accentColor }} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: game.accentColor }}>
              {game.title}
            </p>
            <h1 className="mt-1 text-xl font-bold text-[#0F172A]">Sala nao encontrada</h1>
          </div>
          <p className="text-sm text-[#64748B]">{message}</p>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href={game.joinPath}
              className="w-full rounded-lg bg-[#F1F5F9] py-2.5 text-center text-sm font-semibold text-[#0F172A] transition-all hover:bg-[#CBD5E1]"
            >
              Tentar outro codigo
            </Link>
            <Link
              href={homePath}
              className="w-full rounded-lg py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: game.accentColor }}
            >
              Voltar ao jogo
            </Link>
            <Link href="/" className="pt-1 text-xs font-semibold text-[#64748B] transition-colors hover:text-[#0F172A]">
              Voltar ao hub
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
