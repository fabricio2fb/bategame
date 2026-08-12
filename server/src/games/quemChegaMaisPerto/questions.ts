import { Difficulty } from '../../types';

export interface NumericQuestion {
  id: string;
  text: string;
  correctValue: number;
  category: string;
  difficulty: Difficulty;
  explanation?: string;
}

export const OFFICIAL_NUMERIC_QUESTIONS: NumericQuestion[] = [
  { id: 'qcmp-001', text: 'Quantos minutos tem um dia?', correctValue: 1440, category: 'Conhecimentos Gerais', difficulty: 'easy' },
  { id: 'qcmp-002', text: 'Quantos segundos tem uma hora?', correctValue: 3600, category: 'Conhecimentos Gerais', difficulty: 'easy' },
  { id: 'qcmp-003', text: 'Quantos estados existem no Brasil?', correctValue: 26, category: 'Geografia', difficulty: 'easy' },
  { id: 'qcmp-004', text: 'Qual e a altitude aproximada do Monte Everest em metros?', correctValue: 8849, category: 'Geografia', difficulty: 'medium' },
  { id: 'qcmp-005', text: 'Quantos quilometros tem a Linha do Equador?', correctValue: 40075, category: 'Geografia', difficulty: 'hard' },
  { id: 'qcmp-006', text: 'Em que ano o Brasil foi descoberto pelos portugueses?', correctValue: 1500, category: 'Historia', difficulty: 'easy' },
  { id: 'qcmp-007', text: 'Em que ano terminou a Segunda Guerra Mundial?', correctValue: 1945, category: 'Historia', difficulty: 'easy' },
  { id: 'qcmp-008', text: 'Quantos anos durou aproximadamente o Imperio Romano do Ocidente?', correctValue: 503, category: 'Historia', difficulty: 'hard' },
  { id: 'qcmp-009', text: 'Qual e a velocidade da luz no vacuo em quilometros por segundo?', correctValue: 299792, category: 'Ciencias', difficulty: 'medium' },
  { id: 'qcmp-010', text: 'Quantos ossos tem o corpo humano adulto?', correctValue: 206, category: 'Medicina e Saude', difficulty: 'easy' },
  { id: 'qcmp-011', text: 'Qual e a temperatura de ebulicao da agua em Celsius ao nivel do mar?', correctValue: 100, category: 'Ciencias', difficulty: 'easy' },
  { id: 'qcmp-012', text: 'Quantos elementos quimicos existem oficialmente na tabela periodica?', correctValue: 118, category: 'Ciencias', difficulty: 'medium' },
  { id: 'qcmp-013', text: 'Qual e o valor aproximado de pi com duas casas decimais multiplicado por 100?', correctValue: 314, category: 'Matematica', difficulty: 'easy' },
  { id: 'qcmp-014', text: 'Quanto e 12 ao quadrado?', correctValue: 144, category: 'Matematica', difficulty: 'easy' },
  { id: 'qcmp-015', text: 'Quantos metros tem uma milha terrestre aproximadamente?', correctValue: 1609, category: 'Matematica', difficulty: 'medium' },
  { id: 'qcmp-016', text: 'Em que ano foi lancado o primeiro iPhone?', correctValue: 2007, category: 'Tecnologia', difficulty: 'easy' },
  { id: 'qcmp-017', text: 'Quantos bits tem um byte?', correctValue: 8, category: 'Tecnologia', difficulty: 'easy' },
  { id: 'qcmp-018', text: 'Em que ano a World Wide Web foi proposta por Tim Berners-Lee?', correctValue: 1989, category: 'Tecnologia', difficulty: 'medium' },
  { id: 'qcmp-019', text: 'Quantos jogadores iniciam uma partida de futebol em campo, somando os dois times?', correctValue: 22, category: 'Futebol', difficulty: 'easy' },
  { id: 'qcmp-020', text: 'Quantos minutos tem uma partida oficial de futebol sem acrescimos?', correctValue: 90, category: 'Futebol', difficulty: 'easy' },
  { id: 'qcmp-021', text: 'Em que ano aconteceu a Copa do Mundo no Brasil mais recente?', correctValue: 2014, category: 'Futebol', difficulty: 'easy' },
  { id: 'qcmp-022', text: 'Quantas casas tem um tabuleiro de xadrez?', correctValue: 64, category: 'Jogos', difficulty: 'easy' },
  { id: 'qcmp-023', text: 'Quantas pecas cada jogador comeca tendo no xadrez?', correctValue: 16, category: 'Jogos', difficulty: 'easy' },
  { id: 'qcmp-024', text: 'Em que ano foi lancado Minecraft oficialmente?', correctValue: 2011, category: 'Jogos', difficulty: 'medium' },
  { id: 'qcmp-025', text: 'Quantos episodios tem a trilogia original de Star Wars?', correctValue: 3, category: 'Filmes', difficulty: 'easy' },
  { id: 'qcmp-026', text: 'Em que ano foi lancado o filme Titanic de James Cameron?', correctValue: 1997, category: 'Filmes', difficulty: 'easy' },
  { id: 'qcmp-027', text: 'Quantos Oscars o filme O Senhor dos Aneis: O Retorno do Rei venceu?', correctValue: 11, category: 'Filmes', difficulty: 'medium' },
  { id: 'qcmp-028', text: 'Quantas temporadas tem a serie Friends?', correctValue: 10, category: 'Series', difficulty: 'easy' },
  { id: 'qcmp-029', text: 'Quantos episodios tem a serie Breaking Bad?', correctValue: 62, category: 'Series', difficulty: 'medium' },
  { id: 'qcmp-030', text: 'Em que ano estreou a serie Game of Thrones?', correctValue: 2011, category: 'Series', difficulty: 'medium' },
  { id: 'qcmp-031', text: 'Quantos volumes principais tem Dragon Ball originalmente no manga?', correctValue: 42, category: 'Animes e Mangas', difficulty: 'medium' },
  { id: 'qcmp-032', text: 'Em que ano estreou o anime Naruto no Japao?', correctValue: 2002, category: 'Animes e Mangas', difficulty: 'medium' },
  { id: 'qcmp-033', text: 'Quantas cordas tem um violao comum?', correctValue: 6, category: 'Musica', difficulty: 'easy' },
  { id: 'qcmp-034', text: 'Em que ano Michael Jackson lancou o album Thriller?', correctValue: 1982, category: 'Musica', difficulty: 'medium' },
  { id: 'qcmp-035', text: 'Quantas paginas tem aproximadamente uma edicao comum de Dom Casmurro?', correctValue: 256, category: 'Literatura', difficulty: 'hard' },
  { id: 'qcmp-036', text: 'Em que ano Machado de Assis publicou Dom Casmurro?', correctValue: 1899, category: 'Literatura', difficulty: 'medium' },
  { id: 'qcmp-037', text: 'Quantas patas tem uma aranha?', correctValue: 8, category: 'Animais', difficulty: 'easy' },
  { id: 'qcmp-038', text: 'Qual e o tempo medio de gestacao de um elefante em meses?', correctValue: 22, category: 'Animais', difficulty: 'medium' },
  { id: 'qcmp-039', text: 'Quantos litros de agua aproximadamente uma pessoa adulta deve beber por dia?', correctValue: 2, category: 'Medicina e Saude', difficulty: 'easy' },
  { id: 'qcmp-040', text: 'Quantos dias tem um ano bissexto?', correctValue: 366, category: 'Conhecimentos Gerais', difficulty: 'easy' },
];
