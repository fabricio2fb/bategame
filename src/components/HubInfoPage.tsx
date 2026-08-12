import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { GAME_REGISTRY } from '@/lib/game-registry';

interface HubInfoPageProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function hubColorBackground() {
  return {
    backgroundColor: '#F8FAFC',
    backgroundImage:
      `radial-gradient(circle at 12% 8%, ${GAME_REGISTRY.bateprimeiro.accentColor}78, transparent 25rem), ` +
      `radial-gradient(circle at 88% 12%, ${GAME_REGISTRY['tres-letras'].accentColor}66, transparent 24rem), ` +
      `radial-gradient(circle at 82% 78%, ${GAME_REGISTRY['bate-o-tempo'].accentColor}68, transparent 27rem), ` +
      `radial-gradient(circle at 18% 86%, ${GAME_REGISTRY['qual-e-a-palavra'].accentColor}68, transparent 26rem), ` +
      `radial-gradient(circle at 52% 46%, ${GAME_REGISTRY['quem-chega-mais-perto'].accentColor}52, transparent 31rem), ` +
      'linear-gradient(135deg, rgba(248,250,252,0.56) 0%, rgba(226,232,240,0.34) 52%, rgba(248,250,252,0.62) 100%), radial-gradient(rgba(15,23,42,0.045) 1px, transparent 1px)',
    backgroundSize: 'auto, auto, auto, auto, auto, auto, 22px 22px',
  };
}

export function HubInfoPage({ eyebrow, title, description, children }: HubInfoPageProps) {
  return (
    <div className="min-h-screen text-[#0F172A] flex flex-col" style={hubColorBackground()}>
      <header className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="min-w-0 shrink drop-shadow-[0_16px_28px_rgba(15,23,42,0.22)] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] rounded-xl">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/42 px-4 py-2 text-xs font-black text-[#0F172A] shadow-[0_14px_34px_rgba(15,23,42,0.14)] backdrop-blur-sm transition-colors hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 sm:px-6 lg:px-8">
        <section className="pb-8 pt-4 sm:pb-10 sm:pt-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1E40AF]">{eyebrow}</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-[#0F172A] sm:text-6xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-relaxed text-[#475569] sm:text-lg">
            {description}
          </p>
        </section>

        {children}
      </main>

      <footer className="bg-transparent px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs font-medium text-[#475569] sm:flex-row">
          <span>Tempale. Jogos rapidos para jogar com amigos.</span>
          <div className="flex items-center gap-5">
            <Link href="/blog" className="transition-colors hover:text-[#0F172A]">Blog</Link>
            <Link href="/termos" className="transition-colors hover:text-[#0F172A]">Termos</Link>
            <Link href="/privacidade" className="transition-colors hover:text-[#0F172A]">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
