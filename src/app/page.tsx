import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { BookOpenText } from 'lucide-react';
import { JsonLd } from '@/components/JsonLd';
import { Logo } from '@/components/Logo';
import { GAME_REGISTRY } from '@/lib/game-registry';
import { buildWebsiteJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: {
    absolute: 'Tempale - Jogos Online Multiplayer para Amigos',
  },
  description: 'Hub de jogos online com amigos: quiz com buzzer, anagramas, palpites e desafios rapidos. Escolha um jogo e crie sua sala.',
  keywords: ['jogos online com amigos', 'jogos multiplayer no navegador', 'jogo de perguntas multiplayer', 'jogos de palavras online'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Tempale - Jogos Online Multiplayer para Amigos',
    description: 'Escolha entre jogos de perguntas, palavras, palpites e timing. Crie uma sala online e chame seus amigos.',
    url: '/',
    siteName: 'Tempale',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/og-tempale.png',
        width: 1200,
        height: 630,
        alt: 'Tempale - hub de jogos online multiplayer.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tempale - Jogos Online Multiplayer para Amigos',
    description: 'Hub de jogos online para criar salas e jogar com amigos direto no navegador.',
    images: ['/og-tempale.png'],
  },
};

interface GameCard {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  accentColor: string;
  href?: string;
}

const upcomingGames: GameCard[] = [
  {
    title: GAME_REGISTRY['tres-letras'].title,
    description: 'Use as letras sorteadas e dispute no voto.',
    image: GAME_REGISTRY['tres-letras'].icon,
    imageAlt: 'Icone de letras do jogo 3 Letras',
    accentColor: GAME_REGISTRY['tres-letras'].accentColor,
    href: '/tres-letras',
  },
  {
    title: GAME_REGISTRY['bate-o-tempo'].title,
    description: 'Responda antes que o relogio domine a partida.',
    image: GAME_REGISTRY['bate-o-tempo'].icon,
    imageAlt: 'Icone de cronometro do jogo Bate o Tempo',
    accentColor: GAME_REGISTRY['bate-o-tempo'].accentColor,
    href: '/bate-o-tempo',
  },
  {
    title: GAME_REGISTRY['qual-e-a-palavra'].title,
    description: 'Letras embaralhadas, palpites certeiros e pressao.',
    image: GAME_REGISTRY['qual-e-a-palavra'].icon,
    imageAlt: 'Icone de letras embaralhadas do jogo Qual e a Palavra',
    accentColor: GAME_REGISTRY['qual-e-a-palavra'].accentColor,
    href: '/qual-e-a-palavra',
  },
  {
    title: GAME_REGISTRY['quem-chega-mais-perto'].title,
    description: 'Mire no palpite mais preciso sem passar do ponto.',
    image: GAME_REGISTRY['quem-chega-mais-perto'].icon,
    imageAlt: 'Icone de alvo do jogo Quem Chega Mais Perto',
    accentColor: GAME_REGISTRY['quem-chega-mais-perto'].accentColor,
    href: '/quem-chega-mais-perto',
  },
];

export default function Home() {
  return (
    <div
      className="min-h-screen text-[#0F172A] flex flex-col"
      style={{
        backgroundColor: '#F8FAFC',
        backgroundImage:
          `radial-gradient(circle at 12% 8%, ${GAME_REGISTRY.bateprimeiro.accentColor}78, transparent 25rem), ` +
          `radial-gradient(circle at 88% 12%, ${GAME_REGISTRY['tres-letras'].accentColor}66, transparent 24rem), ` +
          `radial-gradient(circle at 82% 78%, ${GAME_REGISTRY['bate-o-tempo'].accentColor}68, transparent 27rem), ` +
          `radial-gradient(circle at 18% 86%, ${GAME_REGISTRY['qual-e-a-palavra'].accentColor}68, transparent 26rem), ` +
          `radial-gradient(circle at 52% 46%, ${GAME_REGISTRY['quem-chega-mais-perto'].accentColor}52, transparent 31rem), ` +
          'linear-gradient(135deg, rgba(248,250,252,0.56) 0%, rgba(226,232,240,0.34) 52%, rgba(248,250,252,0.62) 100%), radial-gradient(rgba(15,23,42,0.045) 1px, transparent 1px)',
        backgroundSize: 'auto, auto, auto, auto, auto, auto, 22px 22px',
      }}
    >
      <JsonLd data={buildWebsiteJsonLd()} />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="border-b border-[#CBD5E1] pb-7 sm:pb-9">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 shrink drop-shadow-[0_16px_28px_rgba(15,23,42,0.22)]">
              <Logo />
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <Link
                href="https://www.instagram.com/tempale.app"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid h-10 w-10 place-items-center rounded-full border border-[#CBD5E1] bg-white/55 text-[#0F172A] shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:border-[#3B82F6]/50 hover:bg-white sm:h-11 sm:w-11"
              >
                <InstagramIcon />
              </Link>
              <Link
                href="https://www.tiktok.com/@tempale.app"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="grid h-10 w-10 place-items-center rounded-full border border-[#CBD5E1] bg-white/55 text-[#0F172A] shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:border-[#3B82F6]/50 hover:bg-white sm:h-11 sm:w-11"
              >
                <TikTokIcon />
              </Link>
              <Link
                href="/blog"
                aria-label="Blog"
                className="grid h-10 w-10 place-items-center rounded-full border border-[#CBD5E1] bg-white/55 text-[#0F172A] shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:border-[#3B82F6]/50 hover:bg-white sm:h-11 sm:w-11"
              >
                <BookOpenText className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid flex-1 grid-cols-1 items-start gap-5 pt-12 lg:grid-cols-12 lg:pt-16">
          <div className="lg:col-span-12">
            <h1 className="max-w-4xl text-3xl font-black tracking-tight text-[#0F172A] sm:text-5xl">
              Tempale: jogos online multiplayer para amigos
            </h1>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-relaxed text-[#475569] sm:text-base">
              Escolha um jogo de perguntas, palavras, palpites ou precisao, crie uma sala no navegador e compartilhe o link com a galera.
            </p>
          </div>
          <Link
            href="/bateprimeiro"
            className="group block rounded-3xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] sm:max-w-[520px] lg:col-span-5 lg:max-w-none"
          >
            <article
              className="min-h-[430px] overflow-hidden rounded-3xl border-2 shadow-[0_28px_86px_rgba(59,130,246,0.34),0_16px_42px_rgba(15,23,42,0.24),0_0_0_1px_rgba(255,255,255,0.42)] transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_36px_110px_rgba(59,130,246,0.40),0_18px_52px_rgba(15,23,42,0.28),0_0_0_1px_rgba(255,255,255,0.54)] sm:aspect-square sm:min-h-0"
              style={{
                borderColor: `${GAME_REGISTRY.bateprimeiro.accentColor}AA`,
                backgroundColor: '#F8FAFC',
                backgroundImage: `linear-gradient(135deg, ${GAME_REGISTRY.bateprimeiro.accentColor}38 0%, rgba(34,197,94,0.20) 100%), radial-gradient(circle at 74% 18%, rgba(255,255,255,0.48), transparent 17rem)`,
              }}
            >
              <div className="flex h-full min-h-[430px] flex-col items-center justify-center gap-3 p-5 text-center sm:min-h-0 sm:gap-5 sm:p-7">
                <div className="flex justify-center">
                  <Image
                    src="/LOGO-BATEPRIMEIRO.png"
                    alt="Icone de buzzer do BatePrimeiro"
                    width={176}
                    height={176}
                    className="h-24 w-24 object-contain sm:h-40 sm:w-40 lg:h-44 lg:w-44"
                    priority
                  />
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-3 py-1 text-xs font-bold text-[#15803D]">
                      ATIVO
                    </span>
                    <span className="rounded-full border border-[#3B82F6]/35 bg-[#3B82F6]/10 px-3 py-1 text-xs font-bold text-[#2563EB]">
                      Modo Buzzer
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-2xl font-black tracking-tight text-[#0F172A] sm:text-3xl">
                      BatePrimeiro
                    </h2>
                    <p className="mx-auto max-w-sm text-xs font-semibold leading-relaxed text-[#475569] sm:text-sm">
                      Jogo de perguntas multiplayer com buzzer. Crie uma sala, chame os amigos e dispute em tempo real.
                    </p>
                  </div>

                  <div className="flex flex-col justify-center gap-3 sm:flex-row">
                    <span className="inline-flex items-center justify-center rounded-full bg-[#3B82F6] px-5 py-2.5 text-sm font-bold text-white shadow-[0_2px_12px_rgba(59,130,246,0.25)] transition-colors group-hover:bg-[#2563EB] sm:py-3">
                      Jogar agora
                    </span>
                    <span className="inline-flex items-center justify-center rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-5 py-2.5 text-sm font-bold text-[#475569] sm:py-3">
                      Ver partidas
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </Link>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-7">
            {upcomingGames.map((game) => (
              <UpcomingGameCard key={game.title} game={game} />
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-transparent px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs font-medium text-[#64748B] sm:flex-row">
          <span>Tempale. Jogos rapidos para jogar com amigos.</span>
          <div className="flex items-center gap-5">
            <Link href="/termos" className="transition-colors hover:text-[#0F172A]">
              Termos
            </Link>
            <Link href="/privacidade" className="transition-colors hover:text-[#0F172A]">
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17" cy="7" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      <path d="M15.3 3c.3 2.3 1.6 3.8 3.7 4.2v3.1c-1.3 0-2.6-.4-3.7-1.1v5.7c0 3.5-2.2 5.9-5.6 5.9-3 0-5.2-2.1-5.2-5s2.2-5 5.2-5c.4 0 .8 0 1.1.1v3.2c-.3-.1-.6-.2-1-.2-1.2 0-2 .8-2 1.9s.8 1.9 1.9 1.9c1.3 0 2.1-.8 2.1-2.6V3h3.5Z" />
    </svg>
  );
}

function UpcomingGameCard({ game }: { game: GameCard }) {
  const content = (
    <article
      aria-disabled={game.href ? undefined : 'true'}
      className={`relative min-h-[220px] overflow-hidden rounded-2xl border-2 p-3 shadow-[0_18px_48px_rgba(15,23,42,0.14)] transition-all sm:min-h-[285px] sm:rounded-3xl sm:p-5 lg:min-h-[300px] ${
        game.href ? 'hover:-translate-y-1 hover:shadow-[0_24px_64px_rgba(15,23,42,0.18)]' : 'cursor-not-allowed'
      }`}
      style={{
        borderColor: `${game.accentColor}AA`,
        backgroundColor: '#F8FAFC',
        backgroundImage: `linear-gradient(135deg, ${game.accentColor}E6 0%, ${game.accentColor}B8 46%, rgba(34,197,94,0.62) 100%), radial-gradient(circle at 74% 16%, rgba(255,255,255,0.38), transparent 10rem)`,
        boxShadow: `0 26px 76px rgba(15,23,42,0.26), 0 16px 36px rgba(15,23,42,0.20), 0 0 0 1px rgba(255,255,255,0.42), 0 0 58px ${game.accentColor}66`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-5 top-0 h-1.5 rounded-b-full"
        style={{ backgroundColor: game.accentColor }}
      />
      <div className="flex h-full flex-col justify-between gap-3 sm:gap-5">
        <div className="mx-auto flex h-32 w-32 items-center justify-center pt-1 sm:mt-3 sm:h-44 sm:w-44 lg:h-48 lg:w-48">
          <Image
            src={game.image}
            alt={game.imageAlt}
            width={160}
            height={160}
            className="h-24 w-24 object-contain drop-shadow-[0_14px_22px_rgba(15,23,42,0.26)] sm:h-36 sm:w-36 lg:h-40 lg:w-40"
          />
        </div>

        <div>
          <h2 className="text-center text-sm font-black leading-tight tracking-tight text-white sm:text-lg">
            {game.title}
          </h2>
          <p className="mt-1.5 hidden text-center text-sm font-semibold leading-relaxed text-white/82 sm:block">
            {game.description}
          </p>
        </div>
      </div>
    </article>
  );

  if (game.href) {
    return (
      <Link href={game.href} className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] sm:rounded-3xl">
        {content}
      </Link>
    );
  }

  return content;
}
