import type { GameType } from './types';

export interface GameHowToPlayContent {
  tagline: string;
  intro: string;
  steps: Array<{
    title: string;
    text: string;
  }>;
}

export const GAME_HOW_TO_PLAY: Record<Exclude<GameType, 'bateprimeiro'>, GameHowToPlayContent> = {
  'dado-de-forca': {
    tagline: 'Controle potencia, risco e movimento.',
    intro: 'Dado de Forca e uma disputa de precisao: o jogador segura para carregar, solta no ponto certo e tenta converter potencia em avanco no tabuleiro.',
    steps: [
      { title: 'Crie a sala', text: 'O host define privacidade, limite de jogadores e modo de pontuacao.' },
      { title: 'Compartilhe o codigo', text: 'A galera entra na mesma sala pelo codigo da partida.' },
      { title: 'Fique pronto', text: 'Cada jogador confirma que esta pronto no lobby antes do inicio.' },
      { title: 'Carregue a forca', text: 'Na sua vez, segure o botao para acumular potencia.' },
      { title: 'Solte no ponto certo', text: 'A distancia do dado depende do tempo segurado e da precisao.' },
      { title: 'Avance no tabuleiro', text: 'Quem transformar melhor cada jogada em progresso soma mais pontos.' },
    ],
  },
  'tres-letras': {
    tagline: 'Crie respostas com tres letras sorteadas.',
    intro: '3 Letras e uma disputa criativa: o jogo sorteia tres letras, cada jogador escreve uma resposta e a rodada vai para votacao coletiva.',
    steps: [
      { title: 'Crie a sala', text: 'O host define limite de jogadores, rodadas e tempo de escrita.' },
      { title: 'Compartilhe o codigo', text: 'A galera entra na mesma sala pelo codigo da partida.' },
      { title: 'Veja as letras', text: 'A cada rodada, o sistema mostra tres letras sorteadas.' },
      { title: 'Escreva uma resposta', text: 'Digite uma palavra ou expressao que use as letras da rodada.' },
      { title: 'Vote nas respostas', text: 'Todos avaliam cada resposta como certa ou errada.' },
      { title: 'Pontue pela criatividade', text: 'Respostas aprovadas e unicas valem mais; repetidas valem menos.' },
    ],
  },
  'bate-o-tempo': {
    tagline: 'Pare o relogio no ponto certo.',
    intro: 'Bate o Tempo mede controle e nervos: todos tentam parar um cronometro o mais perto possivel do tempo alvo.',
    steps: [
      { title: 'Crie a sala', text: 'O host escolhe se a pontuacao sera exata ou aproximada.' },
      { title: 'Defina o alvo', text: 'O jogo pode sortear o tempo ou o host pode fixar um alvo manual.' },
      { title: 'Chame os jogadores', text: 'Todos entram pelo codigo e aguardam no lobby.' },
      { title: 'Inicie a rodada', text: 'O cronometro aparece para todos com o mesmo tempo alvo.' },
      { title: 'Pare o relogio', text: 'Cada jogador tenta travar o tempo no ponto ideal.' },
      { title: 'Compare as marcas', text: 'Vence quem parar exatamente ou chegar mais perto do alvo.' },
    ],
  },
  'qual-e-a-palavra': {
    tagline: 'Decifre antes dos outros.',
    intro: 'Qual e a Palavra coloca letras embaralhadas na tela e recompensa quem encontra a palavra correta com rapidez.',
    steps: [
      { title: 'Crie a sala', text: 'O host monta a partida e define o modo de pontuacao.' },
      { title: 'Entre pelo codigo', text: 'Jogadores usam o codigo da sala para participar.' },
      { title: 'Observe as letras', text: 'A rodada mostra letras embaralhadas para todos.' },
      { title: 'Forme a palavra', text: 'Reorganize as letras mentalmente e prepare seu palpite.' },
      { title: 'Envie a resposta', text: 'Digite a palavra assim que descobrir a solucao.' },
      { title: 'Some pontos', text: 'Quem acertar conforme a regra da sala vence a rodada.' },
    ],
  },
  'quem-chega-mais-perto': {
    tagline: 'Ganhe pelo palpite mais preciso.',
    intro: 'Quem Chega Mais Perto e uma disputa de estimativas: todos respondem com numeros e vence quem ficar mais perto do valor real.',
    steps: [
      { title: 'Crie a sala', text: 'O host define o tamanho da sala e o modo de pontuacao.' },
      { title: 'Compartilhe o codigo', text: 'Cada jogador entra pelo codigo e fica pronto no lobby.' },
      { title: 'Leia a pergunta', text: 'A rodada apresenta uma pergunta com resposta numerica.' },
      { title: 'Dê seu palpite', text: 'Cada jogador envia um numero tentando se aproximar do valor real.' },
      { title: 'Compare a distancia', text: 'O jogo mede quanto cada palpite ficou longe da resposta correta.' },
      { title: 'Ganhe pela precisao', text: 'O palpite mais perto vence a rodada e soma pontos.' },
    ],
  },
};
