'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Home, Key, Plus } from 'lucide-react';
import type { GameRegistryEntry } from '@/lib/game-registry';
import type { CSSProperties } from 'react';

interface GamePageChromeProps {
  game: GameRegistryEntry;
}

export function GamePageHeader({ game }: GamePageChromeProps) {
  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-full max-w-7xl min-w-0 items-center justify-between gap-2 sm:gap-4">
        <Link
          href={`/${game.gameType}`}
          className="flex min-w-0 items-center gap-3 rounded-xl p-1 focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': game.accentColor } as CSSProperties}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-black/10 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.10)]">
            <Image src={game.icon} alt={`Icone do jogo ${game.title}`} width={28} height={28} className="h-7 w-7 object-contain" />
          </span>
          <span className="min-w-0 max-w-[11rem] sm:max-w-none">
            <span className="block truncate text-base font-black leading-tight text-[#0F172A]">
              {game.title}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
          <Link href="/" className="text-[#475569] transition-colors hover:text-[#0F172A]">
            Central
          </Link>
          <Link href={game.howToPlayPath} className="text-[#475569] transition-colors hover:text-[#0F172A]">
            Como jogar
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <Link
            href="/"
            aria-label="Voltar ao hub"
            className="grid h-9 w-9 place-items-center rounded-full border border-[#CBD5E1] bg-white text-[#475569] transition-all hover:border-black/20 hover:text-[#0F172A] sm:hidden"
          >
            <Home className="h-4 w-4" />
          </Link>
          <Link
            href={game.joinPath}
            className="hidden items-center gap-2 rounded-full border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-semibold text-[#475569] transition-all hover:border-black/20 hover:text-[#0F172A] sm:inline-flex"
          >
            <Key className="h-4 w-4" />
            <span>Entrar em sala</span>
          </Link>
          <Link
            href={game.createPath}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold text-white shadow-[0_2px_12px_rgba(15,23,42,0.16)] transition-transform hover:-translate-y-0.5 sm:px-4 sm:text-sm"
            style={{ backgroundColor: game.accentColor }}
            aria-label="Criar sala"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Criar sala</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function GamePageFooter({ game }: GamePageChromeProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 px-4 py-9 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 border-t border-black/10 pt-8 text-center md:flex-row md:text-left">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-black/10 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.08)]">
            <Image src={game.icon} alt={`Icone do jogo ${game.title}`} width={28} height={28} className="h-7 w-7 object-contain" />
          </span>
          <div>
            <p className="text-sm font-black text-[#0F172A]">{game.title}</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-semibold text-[#64748B]">
          <Link href="/" className="transition-colors hover:text-[#0F172A]">
            Central
          </Link>
          <Link href={game.createPath} className="transition-colors hover:text-[#0F172A]">
            Criar sala
          </Link>
          <Link href={game.howToPlayPath} className="transition-colors hover:text-[#0F172A]">
            Como jogar
          </Link>
          <Link href="/termos" className="transition-colors hover:text-[#0F172A]">
            Termos
          </Link>
          <Link href="/privacidade" className="transition-colors hover:text-[#0F172A]">
            Privacidade
          </Link>
        </nav>

        <p className="text-[11px] text-[#64748B]">
          © {currentYear} {game.title}.
        </p>
      </div>
    </footer>
  );
}
