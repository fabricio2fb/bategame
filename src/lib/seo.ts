import type { Metadata, MetadataRoute } from 'next';
import type { GameType } from '@/lib/types';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tempale.online').replace(/\/$/, '');

export type PublicSeoGameType = 'bateprimeiro' | 'qual-e-a-palavra' | 'bate-o-tempo' | 'quem-chega-mais-perto' | 'tres-letras';

export interface GameSeoEntry {
  gameType: PublicSeoGameType;
  path: `/${string}`;
  title: string;
  metaTitle: string;
  description: string;
  keywords: string[];
  genre: string[];
  mechanics: string;
  whyPlay: string;
  relatedGame: PublicSeoGameType;
  ogImage: string;
}

export const PUBLIC_GAME_TYPES: PublicSeoGameType[] = [
  'bateprimeiro',
  'qual-e-a-palavra',
  'bate-o-tempo',
  'quem-chega-mais-perto',
  'tres-letras',
];

export const GAME_SEO: Record<PublicSeoGameType, GameSeoEntry> = {
  bateprimeiro: {
    gameType: 'bateprimeiro',
    path: '/bateprimeiro',
    title: 'BatePrimeiro',
    metaTitle: 'BatePrimeiro - Jogo de Perguntas com Buzzer Online',
    description: 'Jogo de perguntas multiplayer com buzzer: quem bater primeiro responde. Crie uma sala online e jogue com amigos agora.',
    keywords: ['jogo de perguntas multiplayer', 'jogo online com amigos', 'quiz com buzzer', 'perguntas e respostas online'],
    genre: ['Quiz', 'Trivia', 'Party game'],
    mechanics: 'Todos veem a pergunta, apertam o buzzer em tempo real e apenas quem chegar primeiro ganha a vez de responder.',
    whyPlay: 'Ideal para grupos que querem uma disputa rapida, justa e facil de abrir no navegador, sem instalar nada.',
    relatedGame: 'qual-e-a-palavra',
    ogImage: '/og-bateprimeiro.png',
  },
  'qual-e-a-palavra': {
    gameType: 'qual-e-a-palavra',
    path: '/qual-e-a-palavra',
    title: 'Qual e a Palavra',
    metaTitle: 'Qual e a Palavra - Jogo de Anagramas Online',
    description: 'Decifre letras embaralhadas em um jogo de anagramas online com amigos. Crie uma sala e teste quem acha a palavra primeiro.',
    keywords: ['jogo de anagramas online', 'jogo de palavras multiplayer', 'letras embaralhadas online', 'jogo online com amigos'],
    genre: ['Word game', 'Puzzle', 'Party game'],
    mechanics: 'Cada rodada mostra letras embaralhadas e os jogadores competem para descobrir a palavra correta antes dos outros.',
    whyPlay: 'Funciona bem para quem gosta de vocabulario, raciocinio rapido e partidas leves em grupo.',
    relatedGame: 'tres-letras',
    ogImage: '/game-examples/Qual%20%C3%A9%20a%20Palavra.png',
  },
  'bate-o-tempo': {
    gameType: 'bate-o-tempo',
    path: '/bate-o-tempo',
    title: 'Bate o Tempo',
    metaTitle: 'Bate o Tempo - Jogo Online de Cronometro com Amigos',
    description: 'Pare o cronometro mais perto do alvo em um jogo online de precisao e timing. Crie uma sala e desafie seus amigos.',
    keywords: ['jogo de cronometro online', 'jogo de timing multiplayer', 'jogo online com amigos', 'jogo de precisao'],
    genre: ['Timing game', 'Arcade', 'Party game'],
    mechanics: 'O desafio e parar o cronometro o mais perto possivel do tempo alvo, comparando os resultados em tempo real.',
    whyPlay: 'E rapido de entender, competitivo e perfeito para rodadas curtas entre amigos.',
    relatedGame: 'quem-chega-mais-perto',
    ogImage: '/game-examples/Bate%20o%20Tempo.png',
  },
  'quem-chega-mais-perto': {
    gameType: 'quem-chega-mais-perto',
    path: '/quem-chega-mais-perto',
    title: 'Quem Chega Mais Perto',
    metaTitle: 'Quem Chega Mais Perto - Jogo de Palpites Online',
    description: 'De palpites numericos e venca chegando mais perto da resposta. Crie uma sala online e jogue com amigos.',
    keywords: ['jogo de palpites online', 'jogo de estimativa multiplayer', 'jogo online com amigos', 'perguntas numericas'],
    genre: ['Guessing game', 'Trivia', 'Party game'],
    mechanics: 'A rodada pede um numero, cada jogador envia um palpite e vence quem ficar mais perto da resposta correta.',
    whyPlay: 'Mistura conhecimento, intuicao e comparacao direta sem exigir respostas exatas.',
    relatedGame: 'bate-o-tempo',
    ogImage: '/game-examples/quem%20chega%20mais%20perto.png',
  },
  'tres-letras': {
    gameType: 'tres-letras',
    path: '/tres-letras',
    title: '3 Letras',
    metaTitle: '3 Letras - Jogo de Criatividade com Palavras Online',
    description: 'Crie respostas usando tres letras sorteadas e vote nas melhores ideias. Abra uma sala e jogue online com amigos.',
    keywords: ['jogo de palavras online', 'jogo criativo multiplayer', 'jogo online com amigos', 'jogo de letras'],
    genre: ['Word game', 'Creativity game', 'Party game'],
    mechanics: 'Tres letras guiam as respostas da rodada, e os jogadores votam nas ideias que melhor combinam com o desafio.',
    whyPlay: 'Valoriza criatividade, humor e julgamento em grupo, com regras simples para qualquer pessoa entrar.',
    relatedGame: 'qual-e-a-palavra',
    ogImage: '/game-examples/3LETRAS.png',
  },
};

export const PUBLIC_ROUTES = [
  '/',
  ...PUBLIC_GAME_TYPES.map((gameType) => GAME_SEO[gameType].path),
  '/como-jogar',
  '/termos',
  '/privacidade',
  '/criar-partida',
  '/qual-e-a-palavra/como-jogar',
  '/qual-e-a-palavra/criar',
  '/bate-o-tempo/como-jogar',
  '/bate-o-tempo/criar',
  '/quem-chega-mais-perto/como-jogar',
  '/quem-chega-mais-perto/criar',
  '/tres-letras/como-jogar',
  '/tres-letras/criar',
];

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildGameMetadata(gameType: PublicSeoGameType): Metadata {
  const seo = GAME_SEO[gameType];
  const image = {
    url: seo.ogImage,
    width: 1200,
    height: 630,
    alt: `${seo.title} no Tempale`,
  };

  return {
    title: { absolute: seo.metaTitle },
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: seo.path },
    openGraph: {
      title: seo.metaTitle,
      description: seo.description,
      url: seo.path,
      siteName: 'Tempale',
      locale: 'pt_BR',
      type: 'website',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.metaTitle,
      description: seo.description,
      images: [seo.ogImage],
    },
    icons: gameType === 'bateprimeiro'
      ? {
          icon: [{ url: '/bateprimeiro/icon.png', sizes: 'any', type: 'image/png' }],
        }
      : undefined,
  };
}

export function buildGameJsonLd(gameType: PublicSeoGameType) {
  const seo = GAME_SEO[gameType];

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: seo.title,
    description: seo.description,
    genre: seo.genre,
    gamePlatform: 'Web browser',
    playMode: 'MultiPlayer',
    url: absoluteUrl(seo.path),
    image: absoluteUrl(seo.ogImage),
    publisher: {
      '@type': 'Organization',
      name: 'Tempale',
      url: absoluteUrl('/'),
    },
  };
}

export function buildBreadcrumbJsonLd(gameType: PublicSeoGameType) {
  const seo = GAME_SEO[gameType];

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: absoluteUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: seo.title,
        item: absoluteUrl(seo.path),
      },
    ],
  };
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tempale',
    url: absoluteUrl('/'),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildSitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: absoluteUrl(route),
    lastModified: now,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : route.includes('/criar') || route === '/criar-partida' ? 0.55 : 0.8,
  }));
}

export function isPublicSeoGameType(gameType: GameType): gameType is PublicSeoGameType {
  return PUBLIC_GAME_TYPES.includes(gameType as PublicSeoGameType);
}
