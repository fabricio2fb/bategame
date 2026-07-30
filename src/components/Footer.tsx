'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
        <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
          <Logo />
          <p className="text-xs text-black/60 max-w-sm">
            Quem bater primeiro responde.
          </p>
        </div>

        <nav
          aria-label="Links do rodape"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-black/60 font-medium"
        >
          <Link href="/" className="hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] rounded">
            Partidas
          </Link>
          <Link href="/como-jogar" className="hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] rounded">
            Como jogar
          </Link>
          <Link href="/termos" className="hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] rounded">
            Termos
          </Link>
          <Link href="/privacidade" className="hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] rounded">
            Privacidade
          </Link>
        </nav>

        <div className="text-center md:text-right">
          <p className="text-[11px] text-black/60">
            © {currentYear} BatePrimeiro. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
