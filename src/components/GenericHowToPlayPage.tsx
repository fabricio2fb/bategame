import Link from 'next/link';
import { GamePageFooter, GamePageHeader } from '@/components/GamePageChrome';
import { GAME_HOW_TO_PLAY } from '@/lib/game-content';
import { GAME_REGISTRY } from '@/lib/game-registry';
import type { GameType } from '@/lib/types';

interface GenericHowToPlayPageProps {
  gameType: Exclude<GameType, 'bateprimeiro'>;
}

export function GenericHowToPlayPage({ gameType }: GenericHowToPlayPageProps) {
  const game = GAME_REGISTRY[gameType];
  const content = GAME_HOW_TO_PLAY[gameType];

  return (
    <div
      className="min-h-screen flex flex-col text-[#0F172A]"
      style={{
        backgroundColor: '#F8FAFC',
        backgroundImage: `linear-gradient(135deg, ${game.accentColor}33 0%, rgba(34,197,94,0.18) 100%), radial-gradient(circle at 74% 18%, rgba(255,255,255,0.42), transparent 26rem)`,
      }}
    >
      <GamePageHeader game={game} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid grid-cols-1 items-center gap-8 py-8 lg:grid-cols-12 lg:py-12">
          <div className="lg:col-span-7">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: game.accentColor }}>
              Como jogar
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[#0F172A] sm:text-6xl">
              {game.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg font-semibold leading-relaxed text-[#334155]">
              {content.tagline}
            </p>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#64748B]">
              {content.intro}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={game.createPath}
                className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold text-white shadow-[0_2px_12px_rgba(15,23,42,0.18)]"
                style={{ backgroundColor: game.accentColor }}
              >
                Criar sala
              </Link>
              <Link
                href={`/${game.gameType}`}
                className="inline-flex items-center justify-center rounded-full border border-[#CBD5E1] bg-white px-6 py-3 text-sm font-bold text-[#475569] transition-colors hover:text-[#0F172A]"
              >
                Voltar ao jogo
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="grid aspect-square place-items-center rounded-3xl border-2 border-black/15 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
              <img src={game.icon} alt={`Icone do jogo ${game.title}`} className="h-full max-h-80 w-full max-w-80 object-contain" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 pb-10 sm:grid-cols-2 lg:grid-cols-4">
          {content.steps.map((step) => (
            <article key={step.title} className="rounded-2xl border-2 border-black/15 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
              <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: game.accentColor }} />
              <h2 className="mt-5 text-base font-black text-[#0F172A]">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{step.text}</p>
            </article>
          ))}
        </section>
      </main>

      <GamePageFooter game={game} />
    </div>
  );
}
