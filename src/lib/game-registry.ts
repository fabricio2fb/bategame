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
  joinPath: string;
  howToPlayPath: string;
}

export const GAME_REGISTRY: Record<GameType, GameRegistryEntry> = {
  bateprimeiro: {
    gameType: 'bateprimeiro',
    title: 'BatePrimeiro',
    status: 'playable',
    accentColor: '#3B82F6',
    icon: '/LOGO-BATEPRIMEIRO.png',
    exampleImage: '/game-examples/BatePrimeiro.png',
    createPath: '/criar-partida',
    joinPath: '/entrar',
    howToPlayPath: '/como-jogar',
  },
  'dado-de-forca': {
    gameType: 'dado-de-forca',
    title: 'Dado de Forca',
    status: 'coming-soon',
    accentColor: '#D97706',
    icon: '/game-icons/dado-de-forca.png',
    exampleImage: '/game-examples/Dado%20de%20For%C3%A7a.png',
    createPath: '/dado-de-forca/criar',
    joinPath: '/dado-de-forca/entrar',
    howToPlayPath: '/dado-de-forca/como-jogar',
  },
  'tres-letras': {
    gameType: 'tres-letras',
    title: '3 Letras',
    status: 'coming-soon',
    accentColor: '#16A34A',
    icon: '/game-icons/tres-letras.png',
    exampleImage: '/game-examples/3LETRAS.png',
    createPath: '/tres-letras/criar',
    joinPath: '/tres-letras/entrar',
    howToPlayPath: '/tres-letras/como-jogar',
  },
  'bate-o-tempo': {
    gameType: 'bate-o-tempo',
    title: 'Bate o Tempo',
    status: 'coming-soon',
    accentColor: '#0891B2',
    icon: '/game-icons/bate-o-tempo.png',
    exampleImage: '/game-examples/Bate%20o%20Tempo.png',
    createPath: '/bate-o-tempo/criar',
    joinPath: '/bate-o-tempo/entrar',
    howToPlayPath: '/bate-o-tempo/como-jogar',
  },
  'qual-e-a-palavra': {
    gameType: 'qual-e-a-palavra',
    title: 'Qual e a Palavra',
    status: 'coming-soon',
    accentColor: '#0F766E',
    icon: '/game-icons/qual-e-a-palavra.png',
    exampleImage: '/game-examples/Qual%20%C3%A9%20a%20Palavra.png',
    createPath: '/qual-e-a-palavra/criar',
    joinPath: '/qual-e-a-palavra/entrar',
    howToPlayPath: '/qual-e-a-palavra/como-jogar',
  },
  'quem-chega-mais-perto': {
    gameType: 'quem-chega-mais-perto',
    title: 'Quem Chega Mais Perto',
    status: 'coming-soon',
    accentColor: '#1E40AF',
    icon: '/game-icons/quem-chega-mais-perto.png',
    exampleImage: '/game-examples/quem%20chega%20mais%20perto.png',
    createPath: '/quem-chega-mais-perto/criar',
    joinPath: '/quem-chega-mais-perto/entrar',
    howToPlayPath: '/quem-chega-mais-perto/como-jogar',
  },
};
