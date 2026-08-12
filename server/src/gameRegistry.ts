import type { GameType } from './types';

export type GameStatus = 'playable' | 'coming-soon';

export interface GameRegistryEntry {
  gameType: GameType;
  title: string;
  status: GameStatus;
  accentColor: string;
  icon: string;
  exampleImage: string;
  createPath: string;
}

export const GAME_REGISTRY: Record<GameType, GameRegistryEntry> = {
  bateprimeiro: {
    gameType: 'bateprimeiro',
    title: 'BatePrimeiro',
    status: 'playable',
    accentColor: '#3B82F6',
    icon: '/LOGO-BATEPRIMEIRO.png',
    exampleImage: '/LOGO-BATEPRIMEIRO.png',
    createPath: '/criar-partida',
  },
  'dado-de-forca': {
    gameType: 'dado-de-forca',
    title: 'Dado de Forca',
    status: 'coming-soon',
    accentColor: '#D97706',
    icon: '/game-icons/dado-de-forca.png',
    exampleImage: '/game-examples/dado-de-forca.png',
    createPath: '/dado-de-forca/criar',
  },
  'tres-letras': {
    gameType: 'tres-letras',
    title: '3 Letras',
    status: 'coming-soon',
    accentColor: '#16A34A',
    icon: '/game-icons/tres-letras.png',
    exampleImage: '/game-examples/3LETRAS.png',
    createPath: '/tres-letras/criar',
  },
  'bate-o-tempo': {
    gameType: 'bate-o-tempo',
    title: 'Bate o Tempo',
    status: 'coming-soon',
    accentColor: '#0891B2',
    icon: '/game-icons/bate-o-tempo.png',
    exampleImage: '/game-examples/bate-o-tempo.png',
    createPath: '/bate-o-tempo/criar',
  },
  'qual-e-a-palavra': {
    gameType: 'qual-e-a-palavra',
    title: 'Qual e a Palavra',
    status: 'coming-soon',
    accentColor: '#0F766E',
    icon: '/game-icons/qual-e-a-palavra.png',
    exampleImage: '/game-examples/qual-e-a-palavra.png',
    createPath: '/qual-e-a-palavra/criar',
  },
  'quem-chega-mais-perto': {
    gameType: 'quem-chega-mais-perto',
    title: 'Quem Chega Mais Perto',
    status: 'coming-soon',
    accentColor: '#1E40AF',
    icon: '/game-icons/quem-chega-mais-perto.png',
    exampleImage: '/game-examples/quem-chega-mais-perto.png',
    createPath: '/quem-chega-mais-perto/criar',
  },
};
