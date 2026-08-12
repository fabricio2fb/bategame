import { Difficulty } from '../../types';

export interface WordQuestion {
  id: string;
  word: string;
  category: string;
  difficulty: Difficulty;
  hint?: string;
}

export const OFFICIAL_WORD_QUESTIONS: WordQuestion[] = [
  { id: 'qep-001', word: 'BRASIL', category: 'Geografia', difficulty: 'easy', hint: 'Pais da America do Sul' },
  { id: 'qep-002', word: 'AMAZONIA', category: 'Natureza', difficulty: 'medium', hint: 'Maior floresta tropical do mundo' },
  { id: 'qep-003', word: 'EVEREST', category: 'Geografia', difficulty: 'medium', hint: 'Montanha famosa' },
  { id: 'qep-004', word: 'OCEANO', category: 'Geografia', difficulty: 'easy', hint: 'Grande massa de agua salgada' },
  { id: 'qep-005', word: 'DINOSSAURO', category: 'Animais', difficulty: 'medium', hint: 'Animal pre-historico' },
  { id: 'qep-006', word: 'ARANHA', category: 'Animais', difficulty: 'easy', hint: 'Animal de oito patas' },
  { id: 'qep-007', word: 'ELEFANTE', category: 'Animais', difficulty: 'easy', hint: 'Mamifero grande' },
  { id: 'qep-008', word: 'CAMALEAO', category: 'Animais', difficulty: 'medium', hint: 'Muda de cor' },
  { id: 'qep-009', word: 'FUTEBOL', category: 'Futebol', difficulty: 'easy', hint: 'Esporte popular no Brasil' },
  { id: 'qep-010', word: 'GOLEIRO', category: 'Futebol', difficulty: 'easy', hint: 'Defende o gol' },
  { id: 'qep-011', word: 'ESCANTEIO', category: 'Futebol', difficulty: 'medium', hint: 'Cobranca perto da bandeira' },
  { id: 'qep-012', word: 'LIBERTADORES', category: 'Futebol', difficulty: 'hard', hint: 'Torneio sul-americano' },
  { id: 'qep-013', word: 'XADREZ', category: 'Jogos', difficulty: 'easy', hint: 'Jogo de tabuleiro com rei' },
  { id: 'qep-014', word: 'TABULEIRO', category: 'Jogos', difficulty: 'medium', hint: 'Onde as pecas ficam' },
  { id: 'qep-015', word: 'CONTROLE', category: 'Jogos', difficulty: 'medium', hint: 'Usado para jogar videogame' },
  { id: 'qep-016', word: 'MINECRAFT', category: 'Jogos', difficulty: 'medium', hint: 'Jogo de blocos' },
  { id: 'qep-017', word: 'CINEMA', category: 'Filmes', difficulty: 'easy', hint: 'Lugar de ver filmes' },
  { id: 'qep-018', word: 'ROTEIRO', category: 'Filmes', difficulty: 'medium', hint: 'Texto base de um filme' },
  { id: 'qep-019', word: 'DIRETOR', category: 'Filmes', difficulty: 'easy', hint: 'Comanda a filmagem' },
  { id: 'qep-020', word: 'TRILOGIA', category: 'Filmes', difficulty: 'medium', hint: 'Conjunto de tres obras' },
  { id: 'qep-021', word: 'SERIE', category: 'Series', difficulty: 'easy', hint: 'Historia em episodios' },
  { id: 'qep-022', word: 'EPISODIO', category: 'Series', difficulty: 'easy', hint: 'Parte de uma temporada' },
  { id: 'qep-023', word: 'TEMPORADA', category: 'Series', difficulty: 'medium', hint: 'Conjunto de episodios' },
  { id: 'qep-024', word: 'PERSONAGEM', category: 'Series', difficulty: 'medium', hint: 'Figura da historia' },
  { id: 'qep-025', word: 'MANGA', category: 'Animes e Mangas', difficulty: 'easy', hint: 'Quadrinho japones' },
  { id: 'qep-026', word: 'NINJA', category: 'Animes e Mangas', difficulty: 'easy', hint: 'Guerreiro furtivo' },
  { id: 'qep-027', word: 'DRAGAO', category: 'Animes e Mangas', difficulty: 'easy', hint: 'Criatura lendaria' },
  { id: 'qep-028', word: 'PROTAGONISTA', category: 'Animes e Mangas', difficulty: 'hard', hint: 'Personagem principal' },
  { id: 'qep-029', word: 'GUITARRA', category: 'Musica', difficulty: 'easy', hint: 'Instrumento de cordas' },
  { id: 'qep-030', word: 'BATERIA', category: 'Musica', difficulty: 'easy', hint: 'Instrumento de percussao' },
  { id: 'qep-031', word: 'MELODIA', category: 'Musica', difficulty: 'medium', hint: 'Sequencia de notas' },
  { id: 'qep-032', word: 'SINFONIA', category: 'Musica', difficulty: 'medium', hint: 'Obra para orquestra' },
  { id: 'qep-033', word: 'ROMANCE', category: 'Literatura', difficulty: 'easy', hint: 'Genero ou obra narrativa' },
  { id: 'qep-034', word: 'POESIA', category: 'Literatura', difficulty: 'easy', hint: 'Texto em versos' },
  { id: 'qep-035', word: 'CAPITULO', category: 'Literatura', difficulty: 'medium', hint: 'Parte de um livro' },
  { id: 'qep-036', word: 'BIBLIOTECA', category: 'Literatura', difficulty: 'medium', hint: 'Lugar com muitos livros' },
  { id: 'qep-037', word: 'INTERNET', category: 'Tecnologia', difficulty: 'easy', hint: 'Rede mundial' },
  { id: 'qep-038', word: 'ALGORITMO', category: 'Tecnologia', difficulty: 'medium', hint: 'Sequencia de instrucoes' },
  { id: 'qep-039', word: 'PROCESSADOR', category: 'Tecnologia', difficulty: 'medium', hint: 'Componente do computador' },
  { id: 'qep-040', word: 'CRIPTOGRAFIA', category: 'Tecnologia', difficulty: 'hard', hint: 'Protecao de informacao' },
  { id: 'qep-041', word: 'PLANETA', category: 'Ciencias', difficulty: 'easy', hint: 'Corpo que orbita estrela' },
  { id: 'qep-042', word: 'ATOMO', category: 'Ciencias', difficulty: 'easy', hint: 'Unidade basica da materia' },
  { id: 'qep-043', word: 'GRAVIDADE', category: 'Ciencias', difficulty: 'medium', hint: 'Forca que atrai corpos' },
  { id: 'qep-044', word: 'FOTOSSINTESE', category: 'Ciencias', difficulty: 'hard', hint: 'Processo das plantas' },
  { id: 'qep-045', word: 'PIRAMIDE', category: 'Historia', difficulty: 'medium', hint: 'Construcao do Egito antigo' },
  { id: 'qep-046', word: 'IMPERIO', category: 'Historia', difficulty: 'medium', hint: 'Forma de dominio politico' },
  { id: 'qep-047', word: 'REVOLUCAO', category: 'Historia', difficulty: 'hard', hint: 'Mudanca politica intensa' },
  { id: 'qep-048', word: 'DEMOCRACIA', category: 'Politica e Atualidades', difficulty: 'medium', hint: 'Sistema com participacao popular' },
  { id: 'qep-049', word: 'PIZZA', category: 'Gastronomia', difficulty: 'easy', hint: 'Prato redondo italiano' },
  { id: 'qep-050', word: 'CHOCOLATE', category: 'Gastronomia', difficulty: 'easy', hint: 'Doce feito de cacau' },
];
