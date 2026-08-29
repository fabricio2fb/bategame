'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, BookOpen, ChevronDown, ChevronUp, Clock, Gamepad2, Globe, Lock, PenTool, Plus, Sofa, Swords, Trash2, Users } from 'lucide-react';
import { GamePageFooter, GamePageHeader } from '@/components/GamePageChrome';
import { GAME_REGISTRY } from '@/lib/game-registry';
import { useSocketRoom } from '@/hooks/useSocketRoom';
import type { BoardSize, Difficulty, GameMode, GameType, QuestionSource, RoomPrivacy, RoomSettings, ScoringMode, TeamAssignmentMode } from '@/lib/types';

type GenericGameType = Exclude<GameType, 'bateprimeiro'>;
type MaxPlayersOption = (typeof maxPlayerOptions)[number];

interface GenericCreateRoomPageProps {
  gameType: GenericGameType;
}

interface GenericCreateFormState {
  roomName: string;
  hostName: string;
  privacy: RoomPrivacy;
  maxPlayers: MaxPlayersOption;
  roundCount: number;
  gameMode: GameMode;
  teamCount: number;
  teamAssignmentMode: TeamAssignmentMode;
  scoringMode: ScoringMode;
  useManualTargetTime: boolean;
  targetTimeSeconds: number;
  targetTimeMinSeconds: number;
  targetTimeMaxSeconds: number;
  targetTimeRoundSeconds: string[];
  category: string;
  difficulty: Difficulty;
  roundTimeSeconds: number;
  endRoundOnFirstSubmit: boolean;
  contentSource: QuestionSource;
  customContentId: string;
  customContentTitle: string;
  boardSize: BoardSize;
  maxChargeSeconds: number;
}

type GenericCreateFormErrors = Partial<Record<keyof GenericCreateFormState, string>>;

const maxPlayerOptions = [4, 6, 8, 12, 16] as const;
const categoryOptions = [
  'Tudo misturado',
  'Conhecimentos Gerais', 'Futebol', 'Jogos', 'Filmes', 'Series',
  'Animes e Mangas', 'Musica', 'Literatura', 'Geografia', 'Historia',
  'Ciencias', 'Matematica', 'Engenharia', 'Tecnologia', 'Carros e Motos',
  'Animais', 'Natureza', 'Gastronomia', 'Politica e Atualidades',
  'Celebridades e Famosos', 'Marcas e Empresas', 'Internet e Redes Sociais',
  'Memes e Cultura da Internet', 'Curiosidades', 'Viagens e Turismo',
  'Economia e Negocios', 'Direito', 'Medicina e Saude',
  'Religioes e Mitologia', 'Outros Esportes',
];
const difficultyOptions: Array<{ value: Difficulty; label: string }> = [
  { value: 'mixed', label: 'Misturada' },
  { value: 'easy', label: 'Facil' },
  { value: 'medium', label: 'Media' },
  { value: 'hard', label: 'Dificil' },
];
const contentSourceOptions: Array<{ value: QuestionSource; label: string; description: string; Icon: typeof BookOpen }> = [
  {
    value: 'official',
    label: 'Oficial',
    description: 'Usa o banco padrao do jogo.',
    Icon: BookOpen,
  },
  {
    value: 'custom',
    label: 'Personalizado',
    description: 'Crie sua propria lista para esta sala.',
    Icon: PenTool,
  },
];
const boardSizeOptions: Array<{ value: BoardSize; label: string; description: string }> = [
  { value: 'small', label: 'Pequeno', description: 'Rodadas mais curtas e tabuleiro compacto.' },
  { value: 'medium', label: 'Medio', description: 'Equilibrado para a maioria das salas.' },
  { value: 'large', label: 'Grande', description: 'Mais casas para partidas longas.' },
];
const teamCountOptions = [2, 3, 4] as const;
const teamAssignmentOptions: Array<{ value: TeamAssignmentMode; label: string; description: string }> = [
  {
    value: 'random',
    label: 'Sortear automaticamente',
    description: 'O jogo distribui a galera entre os times.',
  },
  {
    value: 'manual',
    label: 'Jogadores escolhem o time',
    description: 'Cada jogador entra no time que preferir no lobby.',
  },
];
const gameModeOptions: Array<{ value: GameMode; label: string; description: string; Icon: typeof Swords }> = [
  {
    value: 'classic',
    label: 'Individual',
    description: 'Cada jogador disputa por conta propria.',
    Icon: Swords,
  },
  {
    value: 'teams',
    label: 'Equipes',
    description: 'Jogadores divididos em times com pontuacao compartilhada.',
    Icon: Users,
  },
  {
    value: 'couch',
    label: 'Sofa',
    description: 'Modo local para jogar todo mundo perto do host.',
    Icon: Sofa,
  },
];

function getGameModeOptions(gameType: GenericGameType) {
  if (gameType === 'quem-chega-mais-perto' || gameType === 'qual-e-a-palavra' || gameType === 'bate-o-tempo' || gameType === 'tres-letras') {
    return gameModeOptions.filter((option) => option.value !== 'couch');
  }
  return gameModeOptions;
}

const carouselSlides: Record<GenericGameType, string[]> = {
  'dado-de-forca': [
    '/game-examples/Dado%20de%20For%C3%A7a.png',
    '/game-icons/dado-de-forca.png',
  ],
  'tres-letras': [
    '/game-icons/tres-letras.png',
  ],
  'bate-o-tempo': [
    '/game-previews/bate-o-tempo-carousel/01-lobby.png',
    '/game-previews/bate-o-tempo-carousel/02-cronometro.png',
    '/game-previews/bate-o-tempo-carousel/03-parar.png',
    '/game-previews/bate-o-tempo-carousel/04-comparacao.png',
    '/game-previews/bate-o-tempo-carousel/05-placar.png',
  ],
  'qual-e-a-palavra': [
    '/game-examples/Qual%20%C3%A9%20a%20Palavra.png',
    '/game-icons/qual-e-a-palavra.png',
  ],
  'quem-chega-mais-perto': [
    '/game-examples/quem%20chega%20mais%20perto.png',
    '/game-icons/quem-chega-mais-perto.png',
  ],
};

export function buildGenericRoomSettings(gameType: GenericGameType, formState: GenericCreateFormState): RoomSettings {
  const isBateOTempo = gameType === 'bate-o-tempo';
  const hasCategoryRoundConfig = gameType === 'qual-e-a-palavra' || gameType === 'quem-chega-mais-perto';
  const hasCustomContent = hasCategoryRoundConfig || gameType === 'tres-letras';
  const isDadoDeForca = gameType === 'dado-de-forca';
  const usesScoringMode = gameType !== 'qual-e-a-palavra' && gameType !== 'tres-letras';
  const targetTimeRoundSeconds = formState.targetTimeRoundSeconds
    .slice(0, formState.roundCount)
    .map((value) => Number(value));

  return {
    gameType,
    scoringMode: usesScoringMode ? formState.scoringMode : undefined,
    targetTimeMode: isBateOTempo ? (formState.useManualTargetTime ? 'manual' : 'system') : undefined,
    targetTimeSeconds: isBateOTempo && formState.useManualTargetTime ? targetTimeRoundSeconds[0] : undefined,
    targetTimeMinSeconds: isBateOTempo && !formState.useManualTargetTime ? formState.targetTimeMinSeconds : undefined,
    targetTimeMaxSeconds: isBateOTempo && !formState.useManualTargetTime ? formState.targetTimeMaxSeconds : undefined,
    targetTimeRoundSeconds: isBateOTempo && formState.useManualTargetTime ? targetTimeRoundSeconds : undefined,
    gameMode: formState.gameMode,
    questionSource: hasCustomContent ? formState.contentSource : 'official',
    answerMode: 'multiple-choice',
    questionCount: 10,
    roundCount: formState.roundCount,
    category: hasCategoryRoundConfig && formState.contentSource === 'official' ? formState.category : undefined,
    difficulty: 'mixed',
    categories: hasCategoryRoundConfig
      ? [formState.contentSource === 'official' ? formState.category : 'Personalizado']
      : ['Tudo misturado'],
    maxPlayers: formState.maxPlayers,
    answerTimeSeconds: hasCategoryRoundConfig ? formState.roundTimeSeconds : 15,
    roundTimeSeconds: hasCategoryRoundConfig || isBateOTempo ? formState.roundTimeSeconds : undefined,
    endRoundOnFirstSubmit: gameType === 'tres-letras' ? formState.endRoundOnFirstSubmit : undefined,
    boardSize: isDadoDeForca ? formState.boardSize : undefined,
    maxChargeSeconds: isDadoDeForca ? formState.maxChargeSeconds : undefined,
    privacy: formState.privacy,
    wrongAnswerPenalty: 0,
    allowRebound: true,
    customContentId: hasCustomContent && formState.contentSource === 'custom' ? formState.customContentId : undefined,
    customContentTitle: hasCustomContent && formState.contentSource === 'custom' ? formState.customContentTitle : undefined,
    teamCount: formState.gameMode === 'teams' ? formState.teamCount : undefined,
    teamAssignmentMode: formState.gameMode === 'teams' ? formState.teamAssignmentMode : undefined,
  };
}

export function validateGenericCreateForm(
  formState: GenericCreateFormState,
  gameType: GenericGameType
): GenericCreateFormErrors {
  const errors: GenericCreateFormErrors = {};
  const roomName = formState.roomName.trim().replace(/\s+/g, ' ');
  const hostName = formState.hostName.trim().replace(/\s+/g, ' ');

  if (roomName.length < 3) {
    errors.roomName = 'Informe um nome de sala com pelo menos 3 caracteres.';
  }

  if (hostName.length < 2) {
    errors.hostName = 'Informe seu nome com pelo menos 2 caracteres.';
  }

  if (!Number.isInteger(formState.roundCount) || formState.roundCount < 1 || formState.roundCount > 20) {
    errors.roundCount = 'Use uma quantidade de rodadas entre 1 e 20.';
  }

  if ((gameType === 'quem-chega-mais-perto' || gameType === 'qual-e-a-palavra' || gameType === 'bate-o-tempo' || gameType === 'tres-letras') && formState.gameMode === 'couch') {
    const gameLabel =
      gameType === 'qual-e-a-palavra'
        ? 'Qual e a Palavra'
        : gameType === 'bate-o-tempo'
          ? 'Bate o Tempo'
          : gameType === 'tres-letras'
            ? '3 Letras'
            : 'Quem Chega Mais Perto';
    errors.gameMode = `${gameLabel} aceita apenas Individual ou Equipes.`;
  }

  if (gameType === 'bate-o-tempo') {
    if (formState.useManualTargetTime) {
      const expectedRounds = Number.isInteger(formState.roundCount) ? Math.max(0, formState.roundCount) : 0;
      const invalidManualTimes = formState.targetTimeRoundSeconds
        .slice(0, expectedRounds)
        .some((value) => {
          const parsed = Number(value);
          return value.trim() === '' || !Number.isFinite(parsed) || parsed < 1 || parsed > 300;
        });

      if (invalidManualTimes || formState.targetTimeRoundSeconds.length < expectedRounds) {
        errors.targetTimeRoundSeconds = 'Informe um tempo entre 1 e 300 segundos para cada rodada.';
      }
    } else {
      const min = formState.targetTimeMinSeconds;
      const max = formState.targetTimeMaxSeconds;
      if (!Number.isFinite(min) || min < 1 || min > 300) {
        errors.targetTimeMinSeconds = 'Use um minimo entre 1 e 300 segundos.';
      }
      if (!Number.isFinite(max) || max < 1 || max > 300) {
        errors.targetTimeMaxSeconds = 'Use um maximo entre 1 e 300 segundos.';
      }
      if (!errors.targetTimeMinSeconds && !errors.targetTimeMaxSeconds && min >= max) {
        errors.targetTimeMaxSeconds = 'O maximo precisa ser maior que o minimo.';
      }
    }
  }

  if (gameType === 'qual-e-a-palavra' || gameType === 'quem-chega-mais-perto') {
    if (formState.contentSource === 'official' && (!formState.category || !categoryOptions.includes(formState.category))) {
      errors.category = 'Selecione uma categoria valida.';
    }
    if (formState.contentSource === 'official' && !difficultyOptions.some((option) => option.value === formState.difficulty)) {
      errors.difficulty = 'Selecione uma dificuldade valida.';
    }
    if (formState.contentSource === 'custom' && !formState.customContentId) {
      errors.customContentId = 'Salve o conteudo personalizado antes de criar a sala.';
    }
    if (
      !Number.isInteger(formState.roundTimeSeconds) ||
      formState.roundTimeSeconds < 5 ||
      formState.roundTimeSeconds > 180
    ) {
      errors.roundTimeSeconds = 'Use um tempo por rodada entre 5 e 180 segundos.';
    }
  }

  if (gameType === 'bate-o-tempo') {
    if (
      !Number.isInteger(formState.roundTimeSeconds) ||
      formState.roundTimeSeconds < 5 ||
      formState.roundTimeSeconds > 60
    ) {
      errors.roundTimeSeconds = 'Use um tempo por rodada entre 5 e 60 segundos.';
    }
  }

  if (gameType === 'tres-letras') {
    if (formState.contentSource === 'custom' && !formState.customContentId) {
      errors.customContentId = 'Salve as combinacoes personalizadas antes de criar a sala.';
    }
  }

  if (gameType === 'dado-de-forca') {
    if (!boardSizeOptions.some((option) => option.value === formState.boardSize)) {
      errors.boardSize = 'Selecione um tamanho de tabuleiro valido.';
    }
    if (
      !Number.isInteger(formState.maxChargeSeconds) ||
      formState.maxChargeSeconds < 1 ||
      formState.maxChargeSeconds > 10
    ) {
      errors.maxChargeSeconds = 'Use um tempo de carga entre 1 e 10 segundos.';
    }
  }

  return errors;
}

function getConnectionMessage(connectionStatus: string): string | null {
  if (connectionStatus === 'connected') return null;
  if (connectionStatus === 'connecting') return 'Conectando ao servidor de salas...';
  return 'Nao foi possivel conectar agora. Tentando novamente...';
}

export function GenericCreateRoomPage({ gameType }: GenericCreateRoomPageProps) {
  const router = useRouter();
  const game = GAME_REGISTRY[gameType];
  const { createRoom, createCustomContent, connectionStatus } = useSocketRoom();
  const [formState, setFormState] = useState<GenericCreateFormState>({
    roomName: `${game.title} da galera`,
    hostName: '',
    privacy: 'public',
    maxPlayers: 8,
    roundCount: 8,
    gameMode: 'classic',
    teamCount: 2,
    teamAssignmentMode: 'random',
    scoringMode: 'approximate',
    useManualTargetTime: false,
    targetTimeSeconds: 10,
    targetTimeMinSeconds: 5,
    targetTimeMaxSeconds: 30,
    targetTimeRoundSeconds: Array.from({ length: 8 }, () => ''),
    category: 'Tudo misturado',
    difficulty: 'mixed',
    roundTimeSeconds: 30,
    endRoundOnFirstSubmit: false,
    contentSource: 'official',
    customContentId: '',
    customContentTitle: '',
    boardSize: 'medium',
    maxChargeSeconds: 4,
  });
  const [errors, setErrors] = useState<GenericCreateFormErrors>({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [customItems, setCustomItems] = useState<Array<Record<string, string>>>([]);
  const [customDraft, setCustomDraft] = useState({
    word: '',
    wordCategory: '',
    question: '',
    answer: '',
    questionCategory: '',
    combination: '',
  });
  const [customContentError, setCustomContentError] = useState('');
  const [isSavingCustomContent, setIsSavingCustomContent] = useState(false);

  const isBateOTempo = gameType === 'bate-o-tempo';
  const hasCategoryRoundConfig = gameType === 'qual-e-a-palavra' || gameType === 'quem-chega-mais-perto';
  const hasCustomContent = hasCategoryRoundConfig || gameType === 'tres-letras';
  const isDadoDeForca = gameType === 'dado-de-forca';
  const usesScoringMode = gameType !== 'qual-e-a-palavra' && gameType !== 'tres-letras';
  const slides = carouselSlides[gameType];
  const connectionMessage = getConnectionMessage(connectionStatus);
  const availableGameModeOptions = useMemo(() => getGameModeOptions(gameType), [gameType]);
  const summaryRows = useMemo(
    () => [
      ['Sala', formState.roomName.trim() || '...'],
      ['Privacidade', formState.privacy === 'public' ? 'Publica' : 'Privada'],
      ['Modo', availableGameModeOptions.find((option) => option.value === formState.gameMode)?.label || 'Individual'],
      ...(formState.gameMode === 'teams' ? [['Times', `${formState.teamCount}`]] : []),
      ...(formState.gameMode === 'teams'
        ? [['Formacao', formState.teamAssignmentMode === 'manual' ? 'Jogadores escolhem' : 'Sorteio automatico']]
        : []),
      ['Jogadores', `${formState.maxPlayers}`],
      ['Rodadas', `${formState.roundCount || '...'}`],
      ...(usesScoringMode ? [['Pontuacao', formState.scoringMode === 'exact' ? 'Exato' : 'Aproximado']] : []),
      ...(isBateOTempo
        ? [
            [
              'Tempo alvo',
              formState.useManualTargetTime
                ? `${formState.targetTimeRoundSeconds.filter((value) => value.trim()).length}/${formState.roundCount} manuais`
                : `${formState.targetTimeMinSeconds}-${formState.targetTimeMaxSeconds}s`,
            ],
          ]
        : []),
      ...(hasCategoryRoundConfig
        ? [
            ['Fonte', formState.contentSource === 'custom' ? `Personalizado${formState.customContentTitle ? `: ${formState.customContentTitle}` : ''}` : 'Oficial'],
            ...(formState.contentSource === 'official'
              ? [
                  ['Categoria', formState.category],
                  ['Dificuldade', difficultyOptions.find((option) => option.value === formState.difficulty)?.label || 'Misturada'],
                ]
              : []),
            ['Tempo/rodada', `${formState.roundTimeSeconds || '...'}s`],
          ]
        : []),
      ...(gameType === 'tres-letras'
        ? [
            ['Fonte', formState.contentSource === 'custom' ? `Personalizado${formState.customContentTitle ? `: ${formState.customContentTitle}` : ''}` : 'Oficial'],
            ['Encerramento', formState.endRoundOnFirstSubmit ? 'Primeiro envio' : 'Tempo completo'],
          ]
        : []),
      ...(isDadoDeForca
        ? [
            ['Tabuleiro', boardSizeOptions.find((option) => option.value === formState.boardSize)?.label || 'Medio'],
            ['Carga maxima', `${formState.maxChargeSeconds || '...'}s`],
          ]
        : []),
    ],
    [availableGameModeOptions, formState, gameType, hasCategoryRoundConfig, isBateOTempo, isDadoDeForca, usesScoringMode]
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 3800);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    if (!isBateOTempo) return;
    setFormState((current) => {
      const nextRoundCount = Number.isInteger(current.roundCount) ? Math.max(0, Math.min(20, current.roundCount)) : 0;
      const currentTimes = current.targetTimeRoundSeconds || [];
      if (currentTimes.length === nextRoundCount) return current;
      return {
        ...current,
        targetTimeRoundSeconds: Array.from({ length: nextRoundCount }, (_, index) => currentTimes[index] ?? ''),
      };
    });
  }, [formState.roundCount, isBateOTempo]);

  function updateForm<K extends keyof GenericCreateFormState>(key: K, value: GenericCreateFormState[K]) {
    setFormState((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setServerError('');
  }

  function updateTargetTimeForRound(index: number, value: string) {
    setFormState((current) => {
      const nextTimes = [...current.targetTimeRoundSeconds];
      nextTimes[index] = value;
      return { ...current, targetTimeRoundSeconds: nextTimes };
    });
    setErrors((current) => ({ ...current, targetTimeRoundSeconds: undefined }));
    setServerError('');
  }

  function resetSavedCustomContent() {
    setFormState((current) => ({ ...current, customContentId: '', customContentTitle: '' }));
  }

  function normalizeLetterCombination(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^\p{L}]/gu, '');
  }

  function validateLetterCombination(value: string): string | null {
    const combination = normalizeLetterCombination(value);
    const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
    const rare = new Set(['K', 'W', 'Y', 'X', 'Z', 'J']);
    if (combination.length !== 3) return 'Digite exatamente 3 letras.';
    if (new Set(combination.split('')).size !== 3) return 'Nao repita letras na mesma combinacao.';
    if (!combination.split('').some((letter) => vowels.has(letter))) return 'Inclua pelo menos uma vogal.';
    if (combination.split('').filter((letter) => rare.has(letter)).length > 1) return 'Evite mais de uma consoante rara.';
    if (customItems.some((item) => item.combination === combination)) return 'Essa combinacao ja foi adicionada.';
    return null;
  }

  function addCustomItem() {
    setCustomContentError('');
    resetSavedCustomContent();

    if (gameType === 'qual-e-a-palavra') {
      const word = customDraft.word.trim();
      if (word.length < 2) {
        setCustomContentError('Informe uma palavra com pelo menos 2 caracteres.');
        return;
      }
      setCustomItems((current) => [
        ...current,
        { word, category: customDraft.wordCategory.trim() || 'Personalizado' },
      ]);
      setCustomDraft((current) => ({ ...current, word: '', wordCategory: '' }));
      return;
    }

    if (gameType === 'tres-letras') {
      const combination = normalizeLetterCombination(customDraft.combination);
      const validationError = validateLetterCombination(combination);
      if (validationError) {
        setCustomContentError(validationError);
        return;
      }
      setCustomItems((current) => [...current, { combination }]);
      setCustomDraft((current) => ({ ...current, combination: '' }));
      return;
    }

    const question = customDraft.question.trim();
    const answer = Number(customDraft.answer);
    if (question.length < 5) {
      setCustomContentError('Informe uma pergunta com pelo menos 5 caracteres.');
      return;
    }
    if (!Number.isFinite(answer)) {
      setCustomContentError('A resposta correta precisa ser um numero.');
      return;
    }
    setCustomItems((current) => [
      ...current,
      { question, answer: String(answer), category: customDraft.questionCategory.trim() || 'Personalizado' },
    ]);
    setCustomDraft((current) => ({ ...current, question: '', answer: '', questionCategory: '' }));
  }

  function removeCustomItem(index: number) {
    setCustomItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    resetSavedCustomContent();
  }

  async function saveCustomContent() {
    setCustomContentError('');
    setErrors((current) => ({ ...current, customContentId: undefined }));
    if (formState.customContentTitle.trim().length < 3) {
      setCustomContentError('Informe um nome com pelo menos 3 caracteres.');
      return;
    }
    if (customItems.length < 5) {
      setCustomContentError('Adicione pelo menos 5 itens antes de salvar.');
      return;
    }
    if (connectionStatus !== 'connected') {
      setCustomContentError('Ainda estamos conectando ao servidor de salas. Tente novamente em alguns segundos.');
      return;
    }

    setIsSavingCustomContent(true);
    const result = await createCustomContent({
      gameType,
      title: formState.customContentTitle.trim(),
      items: customItems,
    });
    setIsSavingCustomContent(false);

    if (!result.success || !result.contentId) {
      setCustomContentError(result.error || 'Nao foi possivel salvar o conteudo.');
      return;
    }

    setFormState((current) => ({
      ...current,
      customContentId: result.contentId || '',
      customContentTitle: result.title || current.customContentTitle,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validateGenericCreateForm(formState, gameType);
    setErrors(nextErrors);
    setServerError('');

    if (Object.keys(nextErrors).length > 0) return;

    if (connectionStatus !== 'connected') {
      setServerError('Ainda estamos conectando ao servidor de salas. Tente novamente em alguns segundos.');
      return;
    }

    setIsSubmitting(true);
    const result = await createRoom(
      formState.hostName.trim().replace(/\s+/g, ' '),
      formState.roomName.trim().replace(/\s+/g, ' '),
      buildGenericRoomSettings(gameType, formState)
    );
    setIsSubmitting(false);

    if (!result.success || !result.roomCode) {
      setServerError(result.error || 'Nao foi possivel criar a sala.');
      return;
    }

    router.push(`/sala/${result.roomCode}`);
  }

  const SummaryContent = () => (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#64748B]">Resumo</p>
        <h2 className="mt-1 text-lg font-black text-[#0F172A]">Sala pronta para convidar</h2>
      </div>
      <div className="space-y-2">
        {summaryRows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 text-sm">
            <span className="font-semibold text-[#64748B]">{label}</span>
            <span className="max-w-[13rem] truncate text-right font-black text-[#0F172A]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen flex flex-col text-[#0F172A]"
      style={{
        backgroundColor: '#F8FAFC',
        backgroundImage: `linear-gradient(135deg, ${game.accentColor}2E 0%, rgba(255,255,255,0.18) 52%, rgba(15,23,42,0.06) 100%), radial-gradient(circle at 78% 14%, ${game.accentColor}2E, transparent 25rem)`,
      }}
    >
      <GamePageHeader game={game} />

      <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section
          className="grid w-full min-w-0 grid-cols-1 overflow-hidden rounded-[2rem] border shadow-[0_28px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:grid-cols-2"
          style={{
            backgroundColor: 'rgba(248,250,252,0.58)',
            borderColor: 'rgba(255,255,255,0.76)',
          }}
        >
          <form onSubmit={handleSubmit} className="min-w-0 space-y-5 p-5 sm:p-7 lg:p-8">
            <div className="flex items-start gap-4">
              <span
                className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/70 bg-white/75 shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
                style={{ color: game.accentColor }}
              >
                <img src={game.icon} alt="" className="h-9 w-9 object-contain" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: game.accentColor }}>
                  Criar sala
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-[#0F172A] sm:text-3xl">
                  Crie sua propria sala
                </h1>
                <p className="mt-1 max-w-xl text-sm font-semibold leading-relaxed text-[#64748B]">
                  Configure a sala, convide a galera e comece quando todos entrarem.
                </p>
              </div>
            </div>

            {(serverError || connectionMessage) && (
              <div
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${
                  serverError
                    ? 'border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]'
                    : 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]'
                }`}
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{serverError || connectionMessage}</span>
              </div>
            )}

            <section className="rounded-3xl border-2 border-black/10 bg-white/86 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
              <div className="mb-4 flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" style={{ color: game.accentColor }} />
                <h2 className="text-sm font-black text-[#0F172A]">Informacoes basicas</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2" htmlFor={`${gameType}-room-name`}>
                  <span className="text-xs font-bold text-[#64748B]">Nome da sala *</span>
                  <input
                    id={`${gameType}-room-name`}
                    value={formState.roomName}
                    onChange={(event) => updateForm('roomName', event.target.value)}
                    maxLength={40}
                    aria-invalid={!!errors.roomName}
                    aria-describedby={errors.roomName ? `${gameType}-room-name-error` : undefined}
                    className={`mt-1.5 w-full rounded-2xl border-2 bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] ${
                      errors.roomName ? 'border-[#EF4444]' : 'border-[#CBD5E1]'
                    }`}
                    style={{ borderColor: errors.roomName ? '#EF4444' : undefined }}
                  />
                  {errors.roomName && (
                    <p id={`${gameType}-room-name-error`} className="mt-1.5 text-xs font-bold text-[#B91C1C]" role="alert">
                      {errors.roomName}
                    </p>
                  )}
                </label>

                <label htmlFor={`${gameType}-host-name`}>
                  <span className="text-xs font-bold text-[#64748B]">Nome do host *</span>
                  <input
                    id={`${gameType}-host-name`}
                    value={formState.hostName}
                    onChange={(event) => updateForm('hostName', event.target.value)}
                    maxLength={20}
                    placeholder="Seu nome"
                    aria-invalid={!!errors.hostName}
                    aria-describedby={errors.hostName ? `${gameType}-host-name-error` : undefined}
                    className={`mt-1.5 w-full rounded-2xl border-2 bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] ${
                      errors.hostName ? 'border-[#EF4444]' : 'border-[#CBD5E1]'
                    }`}
                  />
                  {errors.hostName && (
                    <p id={`${gameType}-host-name-error`} className="mt-1.5 text-xs font-bold text-[#B91C1C]" role="alert">
                      {errors.hostName}
                    </p>
                  )}
                </label>

                <label htmlFor={`${gameType}-max-players`}>
                  <span className="text-xs font-bold text-[#64748B]">Maximo de jogadores</span>
                  <select
                    id={`${gameType}-max-players`}
                    value={formState.maxPlayers}
                    onChange={(event) => updateForm('maxPlayers', Number(event.target.value) as MaxPlayersOption)}
                    className="mt-1.5 w-full rounded-2xl border-2 border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#0F172A] outline-none transition-colors"
                  >
                    {maxPlayerOptions.map((option) => (
                      <option key={option} value={option}>
                        {option} jogadores
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-3xl border-2 border-black/10 bg-white/86 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
              <h2 className="text-sm font-black text-[#0F172A]">Privacidade</h2>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {([
                  ['public', 'Publica', 'Aparece no feed de salas.', Globe],
                  ['private', 'Privada', 'So entra quem tiver o codigo.', Lock],
                ] as const).map(([value, label, description, Icon]) => {
                  const selected = formState.privacy === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateForm('privacy', value)}
                      className="rounded-2xl border-2 p-4 text-left transition-colors"
                      style={{
                        borderColor: selected ? game.accentColor : '#CBD5E1',
                        backgroundColor: selected ? `${game.accentColor}14` : '#F8FAFC',
                      }}
                    >
                      <span className="flex items-start gap-3">
                        <span
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                          style={{ backgroundColor: selected ? `${game.accentColor}18` : '#F1F5F9', color: selected ? game.accentColor : '#94A3B8' }}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="block text-sm font-black text-[#0F172A]">{label}</span>
                          <span className="mt-1 block text-xs font-semibold leading-relaxed text-[#64748B]">{description}</span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border-2 border-black/10 bg-white/86 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
              <h2 className="text-sm font-black text-[#0F172A]">Configuracoes da partida</h2>

              <fieldset className="mt-3">
                <legend className="text-xs font-bold text-[#64748B]">Modo de jogo</legend>
                <div className={`mt-2 grid grid-cols-1 gap-3 ${availableGameModeOptions.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                  {availableGameModeOptions.map(({ value, label, description, Icon }) => {
                    const selected = formState.gameMode === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateForm('gameMode', value)}
                        className="rounded-2xl border-2 p-3 text-left transition-colors"
                        style={{
                          borderColor: selected ? game.accentColor : '#CBD5E1',
                          backgroundColor: selected ? `${game.accentColor}14` : '#F8FAFC',
                        }}
                      >
                        <span
                          className="mb-3 grid h-10 w-10 place-items-center rounded-xl"
                          style={{
                            backgroundColor: selected ? `${game.accentColor}18` : '#F1F5F9',
                            color: selected ? game.accentColor : '#94A3B8',
                          }}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="block text-sm font-black text-[#0F172A]">{label}</span>
                        <span className="mt-1 block text-[11px] font-semibold leading-tight text-[#64748B]">{description}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {formState.gameMode === 'teams' && (
                <div className="mt-4 rounded-2xl border-2 border-[#CBD5E1] bg-[#F8FAFC] p-4">
                  <label className="text-xs font-bold text-[#64748B]">Quantidade de times</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {teamCountOptions.map((option) => {
                      const selected = formState.teamCount === option;

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => updateForm('teamCount', option)}
                          className="rounded-xl border px-4 py-2 text-sm font-black transition-colors"
                          style={{
                            borderColor: selected ? game.accentColor : '#CBD5E1',
                            backgroundColor: selected ? game.accentColor : '#FFFFFF',
                            color: selected ? '#FFFFFF' : '#64748B',
                          }}
                        >
                          {option} times
                        </button>
                      );
                    })}
                  </div>

                  <fieldset className="mt-4">
                    <legend className="text-xs font-bold text-[#64748B]">Como formar os times?</legend>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {teamAssignmentOptions.map((option) => {
                        const selected = formState.teamAssignmentMode === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateForm('teamAssignmentMode', option.value)}
                            className="rounded-2xl border-2 p-3 text-left transition-colors"
                            style={{
                              borderColor: selected ? game.accentColor : '#CBD5E1',
                              backgroundColor: selected ? `${game.accentColor}14` : '#FFFFFF',
                            }}
                          >
                            <span className="block text-sm font-black text-[#0F172A]">{option.label}</span>
                            <span className="mt-1 block text-[11px] font-semibold leading-relaxed text-[#64748B]">
                              {option.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                </div>
              )}

              <label className="mt-4 block" htmlFor={`${gameType}-round-count`}>
                <span className="text-xs font-bold text-[#64748B]">Quantidade de rodadas</span>
                <input
                  id={`${gameType}-round-count`}
                  type="number"
                  min={1}
                  max={20}
                  value={formState.roundCount}
                  onChange={(event) => updateForm('roundCount', Number(event.target.value))}
                  aria-invalid={!!errors.roundCount}
                  aria-describedby={errors.roundCount ? `${gameType}-round-count-error` : undefined}
                  className={`mt-1.5 w-full rounded-2xl border-2 bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] ${
                    errors.roundCount ? 'border-[#EF4444]' : 'border-[#CBD5E1]'
                  }`}
                />
                {errors.roundCount && (
                  <p id={`${gameType}-round-count-error`} className="mt-1.5 text-xs font-bold text-[#B91C1C]" role="alert">
                    {errors.roundCount}
                  </p>
                )}
              </label>

              {gameType === 'tres-letras' && (
                <fieldset className="mt-4 rounded-2xl border-2 border-[#CBD5E1] bg-[#F8FAFC] p-4">
                  <legend className="text-xs font-bold text-[#64748B]">Encerramento da escrita</legend>
                  <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {([
                      [false, 'Desligado', 'Todos tem os 30 segundos completos para responder.'],
                      [true, 'Ligado', 'Quem enviar primeiro encerra a escrita para todos. Se errar, perde 1 ponto.'],
                    ] as const).map(([value, label, description]) => {
                      const selected = formState.endRoundOnFirstSubmit === value;

                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => updateForm('endRoundOnFirstSubmit', value)}
                          className="rounded-2xl border-2 p-4 text-left transition-colors"
                          style={{
                            borderColor: selected ? game.accentColor : '#CBD5E1',
                            backgroundColor: selected ? `${game.accentColor}14` : '#FFFFFF',
                          }}
                        >
                          <span className="block text-sm font-black text-[#0F172A]">{label}</span>
                          <span className="mt-1 block text-xs font-semibold leading-relaxed text-[#64748B]">
                            {description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {usesScoringMode && (
                <fieldset className="mt-3">
                  <legend className="text-xs font-bold text-[#64748B]">Modo de pontuacao</legend>
                  <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {([
                      ['approximate', 'Aproximado', 'Vence quem chegar mais perto.'],
                      ['exact', 'Exato', 'Pontua quem acertar exatamente.'],
                    ] as const).map(([value, label, description]) => {
                      const selected = formState.scoringMode === value;

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => updateForm('scoringMode', value)}
                          className="rounded-2xl border-2 p-4 text-left transition-colors"
                          style={{
                            borderColor: selected ? game.accentColor : '#CBD5E1',
                            backgroundColor: selected ? `${game.accentColor}14` : '#F8FAFC',
                          }}
                        >
                          <span className="block text-sm font-black text-[#0F172A]">{label}</span>
                          <span className="mt-1 block text-xs font-semibold leading-relaxed text-[#64748B]">{description}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {isBateOTempo && (
                <fieldset className="mt-4 rounded-2xl border-2 border-[#CBD5E1] bg-[#F8FAFC] p-4">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={formState.useManualTargetTime}
                      onChange={(event) => updateForm('useManualTargetTime', event.target.checked)}
                      className="mt-1 h-4 w-4"
                      style={{ accentColor: game.accentColor }}
                    />
                    <span>
                      <span className="block text-sm font-black text-[#0F172A]">Definir tempo alvo manualmente</span>
                      <span className="mt-1 block text-xs font-semibold leading-relaxed text-[#64748B]">
                        Por padrao, o jogo escolhe o tempo alvo automaticamente.
                      </span>
                    </span>
                  </label>

                  {!formState.useManualTargetTime && (
                    <div className="mt-4">
                      <p className="text-xs font-bold text-[#64748B]">Faixa de tempo para sorteio</p>
                      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label htmlFor={`${gameType}-target-time-min`}>
                          <span className="text-[11px] font-bold text-[#64748B]">Minimo em segundos</span>
                          <input
                            id={`${gameType}-target-time-min`}
                            type="number"
                            min={1}
                            max={300}
                            value={formState.targetTimeMinSeconds}
                            onChange={(event) => updateForm('targetTimeMinSeconds', Number(event.target.value))}
                            aria-invalid={!!errors.targetTimeMinSeconds}
                            aria-describedby={errors.targetTimeMinSeconds ? `${gameType}-target-time-min-error` : undefined}
                            className={`mt-1.5 w-full rounded-2xl border-2 bg-white px-4 py-3 text-sm font-bold outline-none transition-colors ${
                              errors.targetTimeMinSeconds ? 'border-[#EF4444]' : 'border-[#CBD5E1]'
                            }`}
                          />
                          {errors.targetTimeMinSeconds && (
                            <p id={`${gameType}-target-time-min-error`} className="mt-1.5 text-xs font-bold text-[#B91C1C]" role="alert">
                              {errors.targetTimeMinSeconds}
                            </p>
                          )}
                        </label>

                        <label htmlFor={`${gameType}-target-time-max`}>
                          <span className="text-[11px] font-bold text-[#64748B]">Maximo em segundos</span>
                          <input
                            id={`${gameType}-target-time-max`}
                            type="number"
                            min={1}
                            max={300}
                            value={formState.targetTimeMaxSeconds}
                            onChange={(event) => updateForm('targetTimeMaxSeconds', Number(event.target.value))}
                            aria-invalid={!!errors.targetTimeMaxSeconds}
                            aria-describedby={errors.targetTimeMaxSeconds ? `${gameType}-target-time-max-error` : undefined}
                            className={`mt-1.5 w-full rounded-2xl border-2 bg-white px-4 py-3 text-sm font-bold outline-none transition-colors ${
                              errors.targetTimeMaxSeconds ? 'border-[#EF4444]' : 'border-[#CBD5E1]'
                            }`}
                          />
                          {errors.targetTimeMaxSeconds && (
                            <p id={`${gameType}-target-time-max-error`} className="mt-1.5 text-xs font-bold text-[#B91C1C]" role="alert">
                              {errors.targetTimeMaxSeconds}
                            </p>
                          )}
                        </label>
                      </div>
                    </div>
                  )}

                  {formState.useManualTargetTime && (
                    <div className="mt-4">
                      <p className="text-xs font-bold text-[#64748B]">Tempo alvo por rodada</p>
                      <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[#64748B]">
                        A lista acompanha a quantidade de rodadas configurada acima.
                      </p>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {formState.targetTimeRoundSeconds.map((value, index) => (
                          <label key={index} htmlFor={`${gameType}-target-time-round-${index}`}>
                            <span className="text-[11px] font-bold text-[#64748B]">Rodada {index + 1}</span>
                            <input
                              id={`${gameType}-target-time-round-${index}`}
                              type="number"
                              min={1}
                              max={300}
                              value={value}
                              onChange={(event) => updateTargetTimeForRound(index, event.target.value)}
                              aria-invalid={!!errors.targetTimeRoundSeconds}
                              aria-describedby={errors.targetTimeRoundSeconds ? `${gameType}-target-time-rounds-error` : undefined}
                              className={`mt-1.5 w-full rounded-2xl border-2 bg-white px-4 py-3 text-sm font-bold outline-none transition-colors ${
                                errors.targetTimeRoundSeconds ? 'border-[#EF4444]' : 'border-[#CBD5E1]'
                              }`}
                              placeholder="10"
                            />
                          </label>
                        ))}
                      </div>
                      {errors.targetTimeRoundSeconds && (
                        <p id={`${gameType}-target-time-rounds-error`} className="mt-2 text-xs font-bold text-[#B91C1C]" role="alert">
                          {errors.targetTimeRoundSeconds}
                        </p>
                      )}
                    </div>
                  )}
                </fieldset>
              )}

              {hasCustomContent && (
                <fieldset className="mt-4 rounded-2xl border-2 border-[#CBD5E1] bg-[#F8FAFC] p-4">
                  <legend className="text-xs font-bold text-[#64748B]">Banco da partida</legend>
                  <div className="mt-3 space-y-4">
                    <div>
                      <p className="text-[11px] font-bold text-[#64748B]">Fonte de conteudo</p>
                      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {contentSourceOptions.map(({ value, label, description, Icon }) => {
                          const selected = formState.contentSource === value;

                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => {
                                updateForm('contentSource', value);
                                setCustomContentError('');
                              }}
                              className="rounded-2xl border-2 p-4 text-left transition-colors"
                              style={{
                                borderColor: selected ? game.accentColor : '#CBD5E1',
                                backgroundColor: selected ? `${game.accentColor}14` : '#FFFFFF',
                              }}
                            >
                              <span
                                className="mb-3 grid h-10 w-10 place-items-center rounded-xl"
                                style={{
                                  backgroundColor: selected ? `${game.accentColor}18` : '#F1F5F9',
                                  color: selected ? game.accentColor : '#94A3B8',
                                }}
                              >
                                <Icon className="h-5 w-5" />
                              </span>
                              <span className="block text-sm font-black text-[#0F172A]">{label}</span>
                              <span className="mt-1 block text-xs font-semibold leading-relaxed text-[#64748B]">{description}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {formState.contentSource === 'official' && hasCategoryRoundConfig && (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label htmlFor={`${gameType}-category`} className="sm:col-span-2">
                          <span className="text-[11px] font-bold text-[#64748B]">Categoria</span>
                          <select
                            id={`${gameType}-category`}
                            value={formState.category}
                            onChange={(event) => updateForm('category', event.target.value)}
                            aria-invalid={!!errors.category}
                            aria-describedby={errors.category ? `${gameType}-category-error` : undefined}
                            className={`mt-1.5 w-full rounded-2xl border-2 bg-white px-4 py-3 text-sm font-bold text-[#0F172A] outline-none transition-colors ${
                              errors.category ? 'border-[#EF4444]' : 'border-[#CBD5E1]'
                            }`}
                          >
                            {categoryOptions.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                          {errors.category && (
                            <p id={`${gameType}-category-error`} className="mt-1.5 text-xs font-bold text-[#B91C1C]" role="alert">
                              {errors.category}
                            </p>
                          )}
                        </label>

                        <div className="rounded-2xl border-2 border-[#CBD5E1] bg-white px-4 py-3">
                          <span className="text-[11px] font-bold text-[#64748B]">Selecao de perguntas</span>
                          <p className="mt-1.5 text-sm font-black text-[#0F172A]">Tudo misturado</p>
                          <p className="mt-1 text-xs font-semibold text-[#64748B]">As perguntas serao sorteadas entre todas as categorias.</p>
                        </div>
                      </div>
                    )}

                    {formState.contentSource === 'custom' && (
                      <div className="rounded-2xl border-2 border-[#CBD5E1] bg-white p-4">
                        <label htmlFor={`${gameType}-custom-title`}>
                          <span className="text-[11px] font-bold text-[#64748B]">
                            {gameType === 'qual-e-a-palavra'
                              ? 'Nome da lista personalizada'
                              : gameType === 'tres-letras'
                                ? 'Nome da lista de combinacoes'
                                : 'Nome do conjunto personalizado'}
                          </span>
                          <input
                            id={`${gameType}-custom-title`}
                            value={formState.customContentTitle}
                            onChange={(event) => {
                              updateForm('customContentTitle', event.target.value);
                              resetSavedCustomContent();
                            }}
                            placeholder={gameType === 'qual-e-a-palavra'
                              ? 'Palavras da festa'
                              : gameType === 'tres-letras'
                                ? 'Letras da resenha'
                                : 'Perguntas sobre o Fulano'}
                            className="mt-1.5 w-full rounded-2xl border-2 border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#0F172A] outline-none transition-colors"
                          />
                        </label>

                        {gameType === 'qual-e-a-palavra' ? (
                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_0.8fr_auto]">
                            <input
                              value={customDraft.word}
                              onChange={(event) => setCustomDraft((current) => ({ ...current, word: event.target.value }))}
                              placeholder="Adicionar palavra"
                              className="rounded-2xl border-2 border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#0F172A] outline-none"
                            />
                            <input
                              value={customDraft.wordCategory}
                              onChange={(event) => setCustomDraft((current) => ({ ...current, wordCategory: event.target.value }))}
                              placeholder="Categoria opcional"
                              className="rounded-2xl border-2 border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#0F172A] outline-none"
                            />
                            <button
                              type="button"
                              onClick={addCustomItem}
                              className="rounded-2xl px-4 py-3 text-sm font-black text-white"
                              style={{ backgroundColor: game.accentColor }}
                            >
                              Adicionar palavra
                            </button>
                          </div>
                        ) : gameType === 'tres-letras' ? (
                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                            <input
                              value={customDraft.combination}
                              onChange={(event) => {
                                setCustomDraft((current) => ({ ...current, combination: normalizeLetterCombination(event.target.value).slice(0, 3) }));
                                setCustomContentError('');
                              }}
                              placeholder="ABC"
                              maxLength={3}
                              className="rounded-2xl border-2 border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-sm font-black uppercase tracking-[0.28em] text-[#0F172A] outline-none"
                            />
                            <button
                              type="button"
                              onClick={addCustomItem}
                              className="rounded-2xl px-4 py-3 text-sm font-black text-white"
                              style={{ backgroundColor: game.accentColor }}
                            >
                              Adicionar combinacao
                            </button>
                          </div>
                        ) : (
                          <div className="mt-3 grid grid-cols-1 gap-3">
                            <input
                              value={customDraft.question}
                              onChange={(event) => setCustomDraft((current) => ({ ...current, question: event.target.value }))}
                              placeholder="Pergunta"
                              className="rounded-2xl border-2 border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#0F172A] outline-none"
                            />
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[0.7fr_1fr_auto]">
                              <input
                                type="number"
                                value={customDraft.answer}
                                onChange={(event) => setCustomDraft((current) => ({ ...current, answer: event.target.value }))}
                                placeholder="Resposta correta"
                                className="rounded-2xl border-2 border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#0F172A] outline-none"
                              />
                              <input
                                value={customDraft.questionCategory}
                                onChange={(event) => setCustomDraft((current) => ({ ...current, questionCategory: event.target.value }))}
                                placeholder="Categoria opcional"
                                className="rounded-2xl border-2 border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#0F172A] outline-none"
                              />
                              <button
                                type="button"
                                onClick={addCustomItem}
                                className="rounded-2xl px-4 py-3 text-sm font-black text-white"
                                style={{ backgroundColor: game.accentColor }}
                              >
                                Adicionar pergunta
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 rounded-2xl bg-[#F8FAFC] p-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-black text-[#0F172A]">
                              Itens adicionados ({customItems.length}/5 minimo)
                            </span>
                            {formState.customContentId && (
                              <span className="text-[11px] font-black text-[#22C55E]">Salvo</span>
                            )}
                          </div>
                          {customItems.length > 0 && (
                            <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                              {customItems.map((item, index) => (
                                <div key={`${item.word || item.question || item.combination}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#475569]">
                                  <span className="min-w-0 truncate">
                                    {gameType === 'qual-e-a-palavra'
                                      ? item.word
                                      : gameType === 'tres-letras'
                                        ? item.combination?.split('').join(' - ')
                                        : `${item.question} = ${item.answer}`}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeCustomItem(index)}
                                    className="shrink-0 rounded-lg p-1 text-[#94A3B8] transition-colors hover:bg-[#EF4444]/10 hover:text-[#EF4444]"
                                    aria-label="Remover item"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {(customContentError || errors.customContentId) && (
                          <p className="mt-3 text-xs font-bold text-[#B91C1C]" role="alert">
                            {customContentError || errors.customContentId}
                          </p>
                        )}

                        <button
                          type="button"
                          disabled={isSavingCustomContent || customItems.length < 5 || formState.customContentTitle.trim().length < 3}
                          onClick={saveCustomContent}
                          className="mt-3 w-full rounded-2xl px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                          style={{ backgroundColor: game.accentColor }}
                        >
                          {isSavingCustomContent
                            ? 'Salvando...'
                            : gameType === 'qual-e-a-palavra'
                              ? 'Salvar lista'
                              : gameType === 'tres-letras'
                                ? 'Salvar combinacoes'
                              : 'Salvar conjunto'}
                        </button>
                      </div>
                    )}

                    {(hasCategoryRoundConfig || isBateOTempo) && (
                      <label htmlFor={`${gameType}-round-time`}>
                        <span className="text-[11px] font-bold text-[#64748B]">Tempo por rodada</span>
                        <input
                          id={`${gameType}-round-time`}
                          type="number"
                          min={5}
                          max={isBateOTempo ? 60 : 180}
                          value={formState.roundTimeSeconds}
                          onChange={(event) => updateForm('roundTimeSeconds', Number(event.target.value))}
                          aria-invalid={!!errors.roundTimeSeconds}
                          aria-describedby={errors.roundTimeSeconds ? `${gameType}-round-time-error` : undefined}
                          className={`mt-1.5 w-full rounded-2xl border-2 bg-white px-4 py-3 text-sm font-bold text-[#0F172A] outline-none transition-colors ${
                            errors.roundTimeSeconds ? 'border-[#EF4444]' : 'border-[#CBD5E1]'
                          }`}
                        />
                        {errors.roundTimeSeconds && (
                          <p id={`${gameType}-round-time-error`} className="mt-1.5 text-xs font-bold text-[#B91C1C]" role="alert">
                            {errors.roundTimeSeconds}
                          </p>
                        )}
                      </label>
                    )}
                  </div>
                </fieldset>
              )}

              {isDadoDeForca && (
                <fieldset className="mt-4 rounded-2xl border-2 border-[#CBD5E1] bg-[#F8FAFC] p-4">
                  <legend className="text-xs font-bold text-[#64748B]">Tabuleiro e carga</legend>
                  <div className="mt-3">
                    <p className="text-[11px] font-bold text-[#64748B]">Tamanho do tabuleiro</p>
                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {boardSizeOptions.map((option) => {
                        const selected = formState.boardSize === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateForm('boardSize', option.value)}
                            className="rounded-2xl border-2 p-3 text-left transition-colors"
                            style={{
                              borderColor: selected ? game.accentColor : '#CBD5E1',
                              backgroundColor: selected ? `${game.accentColor}14` : '#FFFFFF',
                            }}
                          >
                            <span className="block text-sm font-black text-[#0F172A]">{option.label}</span>
                            <span className="mt-1 block text-[11px] font-semibold leading-relaxed text-[#64748B]">
                              {option.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.boardSize && (
                      <p className="mt-2 text-xs font-bold text-[#B91C1C]" role="alert">
                        {errors.boardSize}
                      </p>
                    )}
                  </div>

                  <label className="mt-4 block" htmlFor={`${gameType}-max-charge`}>
                    <span className="text-[11px] font-bold text-[#64748B]">Tempo maximo de carga do botao</span>
                    <input
                      id={`${gameType}-max-charge`}
                      type="number"
                      min={1}
                      max={10}
                      value={formState.maxChargeSeconds}
                      onChange={(event) => updateForm('maxChargeSeconds', Number(event.target.value))}
                      aria-invalid={!!errors.maxChargeSeconds}
                      aria-describedby={errors.maxChargeSeconds ? `${gameType}-max-charge-error` : undefined}
                      className={`mt-1.5 w-full rounded-2xl border-2 bg-white px-4 py-3 text-sm font-bold text-[#0F172A] outline-none transition-colors ${
                        errors.maxChargeSeconds ? 'border-[#EF4444]' : 'border-[#CBD5E1]'
                      }`}
                    />
                    {errors.maxChargeSeconds && (
                      <p id={`${gameType}-max-charge-error`} className="mt-1.5 text-xs font-bold text-[#B91C1C]" role="alert">
                        {errors.maxChargeSeconds}
                      </p>
                    )}
                  </label>
                </fieldset>
              )}
            </section>

            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setShowMobileSummary((current) => !current)}
                className="flex w-full items-center justify-between rounded-2xl border border-[#CBD5E1] bg-white/75 px-4 py-3 text-left text-sm font-black text-[#0F172A]"
              >
                Resumo da sala
                {showMobileSummary ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showMobileSummary && (
                <div className="mt-3 rounded-3xl border-2 border-black/10 bg-white/86 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
                  <SummaryContent />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-black text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] transition-all disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: game.accentColor }}
              >
                <Plus className="h-4 w-4" />
                {isSubmitting ? 'Criando...' : 'Criar sala'}
              </button>
              <Link
                href={`/${gameType}`}
                className="inline-flex items-center justify-center rounded-full border border-[#CBD5E1] bg-white/75 px-6 py-3.5 text-sm font-black text-[#475569] transition-colors hover:text-[#0F172A]"
              >
                Voltar ao jogo
              </Link>
            </div>
          </form>

          <aside className="min-w-0 p-4 sm:p-5 lg:p-6">
            <div className="sticky top-6 space-y-5">
              <div
                className="relative min-h-[460px] overflow-hidden rounded-[2rem] border border-white/45 shadow-[0_22px_60px_rgba(15,23,42,0.22)]"
                style={{ backgroundColor: game.accentColor }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,rgba(255,255,255,0.28),transparent_18rem),linear-gradient(180deg,rgba(255,255,255,0.12),rgba(15,23,42,0.12))]" />
                {slides.map((slide, index) => (
                  <img
                    key={slide}
                    src={slide}
                    alt={`Preview ${index + 1} do jogo ${game.title}`}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                      index === activeSlide ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0F172A]/55 to-transparent p-5">
                  <div className="flex items-center justify-center gap-2">
                    {slides.map((slide, index) => (
                      <button
                        key={slide}
                        type="button"
                        onClick={() => setActiveSlide(index)}
                        className={`h-2 rounded-full transition-all ${index === activeSlide ? 'w-7 bg-white' : 'w-2 bg-white/45'}`}
                        aria-label={`Mostrar preview ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="hidden rounded-3xl border-2 border-black/10 bg-white/86 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)] lg:block">
                <SummaryContent />
              </div>

              <div className="hidden items-start gap-3 rounded-3xl border border-[#CBD5E1] bg-white/70 p-4 text-sm font-semibold text-[#64748B] lg:flex">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" style={{ color: game.accentColor }} />
                <p>
                  Salas publicas aparecem no feed. Salas privadas ficam acessiveis apenas por codigo.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </main>

      <GamePageFooter game={game} />
    </div>
  );
}
