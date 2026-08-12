'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Globe, Lock, Plus, CheckSquare, Mic, ChevronDown, ChevronUp, AlertCircle, Users, Sofa, PenTool, Swords } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { RoomSettings, RoomPrivacy, Difficulty, AnswerType, GameMode, QuestionSource } from '@/lib/types';
import { useSocketRoom } from '@/hooks/useSocketRoom';
import { getSocketDiagnosticsLabel } from '@/lib/socket';
import { getRoomPath } from '@/lib/room-code';
import { CouchSetup } from '@/components/couch/CouchSetup';
import { saveCouchMatchConfig } from '@/lib/couch-match-storage';
import type { CouchStartOptions } from '@/hooks/useCouchGame';

const CATEGORIES = [
  'Tudo misturado',
  'Conhecimentos Gerais', 'Futebol', 'Jogos', 'Filmes', 'Séries',
  'Animes e Mangás', 'Música', 'Literatura', 'Geografia', 'História',
  'Ciências', 'Matemática', 'Engenharia', 'Tecnologia', 'Carros e Motos',
  'Animais', 'Natureza', 'Gastronomia', 'Política e Atualidades',
  'Celebridades e Famosos', 'Marcas e Empresas', 'Internet e Redes Sociais',
  'Memes e Cultura da Internet', 'Curiosidades', 'Viagens e Turismo',
  'Economia e Negócios', 'Direito', 'Medicina e Saúde',
  'Religiões e Mitologia', 'Outros Esportes',
];

const QUESTION_OPTIONS = [10, 15, 20, 30] as const;
const MAX_PLAYER_OPTIONS = [4, 6, 8, 12, 16] as const;
const ANSWER_TIME_OPTIONS = [5, 10, 15, 20, 30] as const;
const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Fácil' },
  { value: 'medium', label: 'Média' },
  { value: 'hard', label: 'Difícil' },
  { value: 'mixed', label: 'Misturada' },
];
const ANSWER_MODE_OPTIONS: { value: AnswerType; label: string; desc: string }[] = [
  { value: 'spoken', label: 'Resposta falada', desc: 'O jogador responde em voz alta e o host marca se acertou.' },
  { value: 'multiple-choice', label: 'Múltipla escolha', desc: 'O jogador escolhe uma alternativa na própria tela.' },
];

const GAME_MODE_OPTIONS: { value: GameMode; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'classic', label: 'Clássico', desc: 'Competição individual — todos apertam o botão e respondem.', icon: <Swords className="w-5 h-5" /> },
  { value: 'teams', label: 'Equipes', desc: 'Jogadores divididos em times com pontuação compartilhada.', icon: <Users className="w-5 h-5" /> },
  { value: 'couch', label: 'Sofá', desc: 'Modo colaborativo — o host seleciona quem aperta o botão.', icon: <Sofa className="w-5 h-5" /> },
];

const QUESTION_SOURCE_OPTIONS: { value: QuestionSource; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'official', label: 'Oficial', desc: 'Perguntas do banco oficial do BatePrimeiro.', icon: <Swords className="w-5 h-5" /> },
  { value: 'custom', label: 'Personalizado', desc: 'Crie suas próprias perguntas ou importe um quiz.', icon: <PenTool className="w-5 h-5" /> },
];

export default function CriarPartidaPage() {
  const router = useRouter();

  const [roomName, setRoomName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [privacy, setPrivacy] = useState<RoomPrivacy>('public');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Tudo misturado']);
  const [questionCount, setQuestionCount] = useState<15 | 20 | 30 | 10>(15);
  const [maxPlayers, setMaxPlayers] = useState<4 | 6 | 8 | 12 | 16>(8);
  const [answerTimeSeconds, setAnswerTimeSeconds] = useState<5 | 10 | 15 | 20 | 30>(15);
  const [difficulty, setDifficulty] = useState<Difficulty>('mixed');
  const [answerMode, setAnswerMode] = useState<AnswerType>('multiple-choice');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const { createRoom, createQuiz, connectionStatus, socketError } = useSocketRoom(undefined, gameMode !== 'couch');
  const [questionSource, setQuestionSource] = useState<QuestionSource>('official');
  const [teamCount, setTeamCount] = useState(2);
  const [wrongPenalty, setWrongPenalty] = useState(0);
  const [customQuizName, setCustomQuizName] = useState('');
  const [customQuizQuestions, setCustomQuizQuestions] = useState<Array<{ text: string; correctAnswer: string; alternatives: string[]; category: string }>>([]);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [quizError, setQuizError] = useState('');
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionAnswer, setNewQuestionAnswer] = useState('');
  const [newQuestionAlts, setNewQuestionAlts] = useState('');
  const [newQuestionCategory, setNewQuestionCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [isCouchMobile, setIsCouchMobile] = useState(false);

  useEffect(() => {
    if (gameMode !== 'couch') return;
    const updateCouchInputHint = () => {
      setIsCouchMobile(window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 768);
    };

    updateCouchInputHint();
    window.addEventListener('resize', updateCouchInputHint);
    return () => window.removeEventListener('resize', updateCouchInputHint);
  }, [gameMode]);

  const handleCategoryToggle = (cat: string) => {
    if (cat === 'Tudo misturado') {
      setSelectedCategories(['Tudo misturado']);
      return;
    }
    const filtered = selectedCategories.filter(c => c !== 'Tudo misturado');
    if (filtered.includes(cat)) {
      const next = filtered.filter(c => c !== cat);
      setSelectedCategories(next.length === 0 ? ['Tudo misturado'] : next);
    } else {
      setSelectedCategories([...filtered, cat]);
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestionText.trim() || !newQuestionAnswer.trim()) return;
    const alts = newQuestionAlts.split(',').map(a => a.trim()).filter(Boolean);
    setCustomQuizQuestions(prev => [...prev, {
      text: newQuestionText.trim(),
      correctAnswer: newQuestionAnswer.trim(),
      alternatives: alts.length >= 2 ? alts : [newQuestionAnswer.trim(), ...alts],
      category: newQuestionCategory.trim() || 'Personalizado',
    }]);
    setNewQuestionText('');
    setNewQuestionAnswer('');
    setNewQuestionAlts('');
    setNewQuestionCategory('');
  };

  const handleRemoveQuestion = (idx: number) => {
    setCustomQuizQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreateQuiz = async () => {
    if (!customQuizName.trim() || customQuizQuestions.length < 5) {
      setQuizError('Nome e pelo menos 5 perguntas são obrigatórios.');
      return;
    }
    setIsCreatingQuiz(true);
    setQuizError('');
    const result = await createQuiz(customQuizName.trim(), customQuizQuestions.map(q => ({
      ...q,
      type: answerMode,
      difficulty: 'medium',
    })));
    setIsCreatingQuiz(false);
    if (result.success && result.quizId) {
      setQuizId(result.quizId);
      setQuizError('');
    } else {
      setQuizError(result.error || 'Erro ao criar quiz.');
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!roomName.trim()) errs.roomName = 'Informe o nome da sala.';
    if (!playerName.trim()) errs.playerName = 'Informe seu nome.';
    if (questionSource === 'official' && selectedCategories.length === 0) errs.categories = 'Selecione pelo menos uma categoria.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gameMode === 'couch') return;
    if (!validate() || isSubmitting) return;
    if (connectionStatus !== 'connected') {
      setServerError(`Servidor não disponível. Status: ${connectionStatus}. Verifique se o servidor Socket.IO está acessível em ${getSocketDiagnosticsLabel()}.`);
      return;
    }
    if (questionSource === 'custom' && !quizId) {
      setServerError('Crie e salve o quiz personalizado antes de criar a partida.');
      return;
    }
    setServerError('');
    setIsSubmitting(true);
    const result = await createRoom(playerName.trim(), roomName.trim(), {
      privacy,
      categories: questionSource === 'official' ? selectedCategories : ['Tudo misturado'],
      questionCount,
      maxPlayers,
      answerTimeSeconds,
      difficulty: questionSource === 'custom' ? 'mixed' : difficulty,
      answerMode,
      gameMode,
      questionSource,
      customQuizId: questionSource === 'custom' ? quizId! : undefined,
      teamCount: gameMode === 'teams' ? teamCount : undefined,
      wrongAnswerPenalty: wrongPenalty,
      allowRebound: false,
    });
    setIsSubmitting(false);
    if (result.success && result.roomCode) {
      router.push(getRoomPath(result.roomCode));
    } else {
      setServerError(result.error || 'Erro ao criar sala.');
    }
  };

  const handleStartCouch = (options: CouchStartOptions) => {
    saveCouchMatchConfig(options);
    router.push('/partida-sofa');
  };

  const summary = useMemo(() => ({
    name: roomName || '...',
    privacy: privacy === 'public' ? 'Pública' : 'Privada',
    gameMode: GAME_MODE_OPTIONS.find(m => m.value === gameMode)?.label || 'Clássico',
    questionSource: QUESTION_SOURCE_OPTIONS.find(s => s.value === questionSource)?.label || 'Oficial',
    categories: questionSource === 'official' ? selectedCategories.join(', ') || '...' : 'Quiz Personalizado',
    questions: questionCount,
    players: maxPlayers,
    answerTime: `${answerTimeSeconds}s`,
    difficulty: DIFFICULTY_OPTIONS.find(d => d.value === difficulty)?.label,
    answerMode: ANSWER_MODE_OPTIONS.find(a => a.value === answerMode)?.label,
    teamCount: gameMode === 'teams' ? teamCount : undefined,
  }), [roomName, privacy, selectedCategories, questionCount, maxPlayers, answerTimeSeconds, difficulty, answerMode, gameMode, teamCount, questionSource]);

  const SummaryContent = () => (
    <div className="space-y-2.5 text-sm">
      <h4 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Resumo da configuração</h4>
      <div className="space-y-1.5">
        {[
          ['Nome', summary.name],
          ['Privacidade', summary.privacy],
          ['Modo', summary.gameMode],
          ['Fonte', summary.questionSource],
          ...(gameMode === 'teams' ? [['Times', String(summary.teamCount)]] : []),
          ...(questionSource === 'official' ? [['Categorias', summary.categories]] : []),
          ...(questionSource === 'official' ? [['Perguntas', String(summary.questions)]] : []),
          ['Tempo resposta', summary.answerTime],
          ['Máx. jogadores', String(summary.players)],
          ...(questionSource === 'official' ? [['Dificuldade', summary.difficulty ?? '']] : []),
          ['Modo resposta', summary.answerMode ?? ''],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-2">
            <span className="text-[#64748B]">{label}</span>
            <span className="text-[#0F172A] font-medium text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (gameMode === 'couch') {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="h-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto h-full flex items-center justify-between">
            <Link href="/bateprimeiro" className="flex items-center gap-2">
              <Logo src="/LOGO-BATEPRIMEIRO.png" text="BatePrimeiro" />
            </Link>
            <Link href="/bateprimeiro"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-[#64748B] hover:text-[#0F172A] bg-white border border-[#CBD5E1] rounded-lg transition-colors">
              <ArrowLeft className="w-4 h-4" /><span>Voltar</span>
            </Link>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">Criar partida</h1>
            <p className="text-sm text-[#64748B] mt-1">Crie uma partida no BatePrimeiro. Quem bater primeiro responde.</p>
          </div>

          <div className="bg-white border-2 border-black/15 rounded-2xl p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-[#0F172A]">Modo de jogo</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Sofá não cria sala, código ou lobby online.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {GAME_MODE_OPTIONS.map(mode => (
                <button key={mode.value} type="button" onClick={() => setGameMode(mode.value)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                    gameMode === mode.value
                      ? 'bg-[#3B82F6]/10 border-[#3B82F6]'
                      : 'bg-[#F8FAFC] border-[#CBD5E1] hover:border-[#94A3B8]'
                  }`}>
                  <div className={`grid h-10 w-10 place-items-center rounded-lg shrink-0 ${
                    gameMode === mode.value ? 'bg-[#3B82F6]/15 text-[#3B82F6]' : 'bg-[#F1F5F9] text-[#94A3B8]'
                  }`}>
                    {mode.icon}
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${gameMode === mode.value ? 'text-[#0F172A]' : 'text-[#64748B]'}`}>{mode.label}</div>
                    <div className="text-[11px] text-[#94A3B8] leading-tight">{mode.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <CouchSetup isMobile={isCouchMobile} onStart={handleStartCouch} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto h-full flex items-center justify-between">
          <Link href="/bateprimeiro" className="flex items-center gap-2">
            <Logo src="/LOGO-BATEPRIMEIRO.png" text="BatePrimeiro" />
          </Link>
          <Link href="/bateprimeiro"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-[#64748B] hover:text-[#0F172A] bg-white border border-[#CBD5E1] rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" /><span>Voltar</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">Criar partida</h1>
          <p className="text-sm text-[#64748B] mt-1">Crie uma partida no BatePrimeiro. Quem bater primeiro responde.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              {serverError && (
                <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-3 text-sm text-[#EF4444]" role="alert">
                  {serverError}
                </div>
              )}
              {connectionStatus !== 'connected' && (
                <div className={`rounded-xl p-3 text-sm flex items-center gap-2 ${
                  connectionStatus === 'error'
                    ? 'bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444]'
                    : 'bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B]'
                }`} role="alert">
                  {connectionStatus === 'error' ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border-2 border-[#F59E0B] border-t-transparent animate-spin shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">
                      {connectionStatus === 'error'
                        ? 'Erro de conexão com o servidor'
                        : 'Conectando ao servidor...'}
                    </p>
                    {socketError && (
                      <p className="text-xs mt-0.5 opacity-80">Detalhe: {socketError}</p>
                    )}
                    <p className="text-xs mt-0.5 opacity-70">
                      URL: {getSocketDiagnosticsLabel()}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-white border-2 border-black/15 rounded-2xl p-5 sm:p-6 space-y-5">
                <h2 className="text-sm font-bold text-[#0F172A]">Informações básicas</h2>

                <div className="space-y-1.5">
                  <label htmlFor="room-name" className="block text-xs font-semibold text-[#64748B]">
                    Nome da sala <span className="text-[#EF4444]">*</span>
                  </label>
                  <input id="room-name" type="text" maxLength={30}
                    placeholder="Ex.: Quiz da galera"
                    value={roomName} onChange={e => setRoomName(e.target.value)}
                    className={`w-full bg-[#F8FAFC] border rounded-lg px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none transition-colors ${
                      errors.roomName ? 'border-[#EF4444]' : 'border-[#CBD5E1] focus:border-[#3B82F6]'
                    }`}
                    aria-describedby={errors.roomName ? 'room-name-error' : undefined}
                    aria-invalid={!!errors.roomName}
                  />
                  {errors.roomName && (
                    <p id="room-name-error" className="text-xs text-[#EF4444]" role="alert">{errors.roomName}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="player-name" className="block text-xs font-semibold text-[#64748B]">
                    Seu nome <span className="text-[#EF4444]">*</span>
                  </label>
                  <input id="player-name" type="text" maxLength={20}
                    placeholder="Como você será chamado?"
                    value={playerName} onChange={e => setPlayerName(e.target.value)}
                    className={`w-full bg-[#F8FAFC] border rounded-lg px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none transition-colors ${
                      errors.playerName ? 'border-[#EF4444]' : 'border-[#CBD5E1] focus:border-[#3B82F6]'
                    }`}
                    aria-describedby={errors.playerName ? 'player-name-error' : undefined}
                    aria-invalid={!!errors.playerName}
                  />
                  {errors.playerName && (
                    <p id="player-name-error" className="text-xs text-[#EF4444]" role="alert">{errors.playerName}</p>
                  )}
                </div>
              </div>

              <div className="bg-white border-2 border-black/15 rounded-2xl p-5 sm:p-6 space-y-5">
                <h2 className="text-sm font-bold text-[#0F172A]">Privacidade</h2>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setPrivacy('public')}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-colors ${
                      privacy === 'public'
                        ? 'bg-[#F1F5F9] border-[#3B82F6]'
                        : 'bg-[#F8FAFC] border-[#CBD5E1] hover:border-[#94A3B8]'
                    }`}>
                    <Globe className={`w-5 h-5 shrink-0 ${privacy === 'public' ? 'text-[#3B82F6]' : 'text-[#94A3B8]'}`} />
                    <div>
                      <div className={`text-sm font-bold ${privacy === 'public' ? 'text-[#0F172A]' : 'text-[#64748B]'}`}>Pública</div>
                      <div className="text-[11px] text-[#94A3B8]">Aparece na lista de partidas.</div>
                    </div>
                  </button>
                  <button type="button" onClick={() => setPrivacy('private')}
                    className={`p-3 rounded-lg border text-left flex items-center gap-2.5 transition-colors ${
                      privacy === 'private'
                        ? 'bg-[#F1F5F9] border-[#3B82F6]'
                        : 'bg-[#F8FAFC] border-[#CBD5E1] hover:border-[#94A3B8]'
                    }`}>
                    <Lock className={`w-5 h-5 shrink-0 ${privacy === 'private' ? 'text-[#3B82F6]' : 'text-[#94A3B8]'}`} />
                    <div>
                      <div className={`text-sm font-bold ${privacy === 'private' ? 'text-[#0F172A]' : 'text-[#64748B]'}`}>Privada</div>
                      <div className="text-[11px] text-[#94A3B8]">Só entra quem tiver o código.</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-white border-2 border-black/15 rounded-2xl p-5 sm:p-6 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-[#0F172A]">Modo de jogo</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">Escolha como os jogadores vão competir.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {GAME_MODE_OPTIONS.map(mode => (
                    <button key={mode.value} type="button" onClick={() => setGameMode(mode.value)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                        gameMode === mode.value
                          ? 'bg-[#3B82F6]/10 border-[#3B82F6]'
                          : 'bg-[#F8FAFC] border-[#CBD5E1] hover:border-[#94A3B8]'
                      }`}>
                      <div className={`grid h-10 w-10 place-items-center rounded-lg shrink-0 ${
                        gameMode === mode.value ? 'bg-[#3B82F6]/15 text-[#3B82F6]' : 'bg-[#F1F5F9] text-[#94A3B8]'
                      }`}>
                        {mode.icon}
                      </div>
                      <div>
                        <div className={`text-sm font-bold ${gameMode === mode.value ? 'text-[#0F172A]' : 'text-[#64748B]'}`}>{mode.label}</div>
                        <div className="text-[11px] text-[#94A3B8] leading-tight">{mode.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>

                {gameMode === 'teams' && (
                  <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-4 space-y-2">
                    <label className="text-xs font-semibold text-[#64748B]">Número de times</label>
                    <div className="flex gap-2">
                      {[2, 3, 4].map(n => (
                        <button key={n} type="button" onClick={() => setTeamCount(n)}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                            teamCount === n ? 'bg-[#3B82F6] text-white' : 'bg-white border border-[#CBD5E1] text-[#64748B] hover:border-[#94A3B8]'
                          }`}>
                          {n} times
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white border-2 border-black/15 rounded-2xl p-5 sm:p-6 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-[#0F172A]">Fonte das perguntas</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">De onde virão as perguntas.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUESTION_SOURCE_OPTIONS.map(source => (
                    <button key={source.value} type="button" onClick={() => setQuestionSource(source.value)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                        questionSource === source.value
                          ? 'bg-[#3B82F6]/10 border-[#3B82F6]'
                          : 'bg-[#F8FAFC] border-[#CBD5E1] hover:border-[#94A3B8]'
                      }`}>
                      <div className={`grid h-10 w-10 place-items-center rounded-lg shrink-0 ${
                        questionSource === source.value ? 'bg-[#3B82F6]/15 text-[#3B82F6]' : 'bg-[#F1F5F9] text-[#94A3B8]'
                      }`}>
                        {source.icon}
                      </div>
                      <div>
                        <div className={`text-sm font-bold ${questionSource === source.value ? 'text-[#0F172A]' : 'text-[#64748B]'}`}>{source.label}</div>
                        <div className="text-[11px] text-[#94A3B8] leading-tight">{source.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {questionSource === 'official' && (
                <div className="bg-white border-2 border-black/15 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-[#0F172A]">Categorias</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">Selecione uma ou várias categorias.</p>
                  </div>
                  {errors.categories && (
                    <p className="text-xs text-[#EF4444]" role="alert">{errors.categories}</p>
                  )}
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Categorias">
                    {CATEGORIES.map(cat => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <button key={cat} type="button" onClick={() => handleCategoryToggle(cat)}
                          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                              : 'bg-[#F8FAFC] text-[#64748B] border-[#CBD5E1] hover:border-[#94A3B8]'
                          }`}
                          aria-pressed={isSelected}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {questionSource === 'custom' && (
                <div className="bg-white border-2 border-black/15 rounded-2xl p-5 sm:p-6 space-y-5">
                  <div>
                    <h2 className="text-sm font-bold text-[#0F172A]">Quiz Personalizado</h2>
                    <p className="text-xs text-[#64748B] mt-0.5">Crie suas perguntas. Mínimo 5 perguntas.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#64748B]">Nome do quiz</label>
                    <input type="text" maxLength={40} placeholder="Ex.: Quiz da firma"
                      value={customQuizName} onChange={e => setCustomQuizName(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#3B82F6]" />
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-[#64748B]">Adicionar pergunta</h3>
                    <input type="text" placeholder="Texto da pergunta" value={newQuestionText}
                      onChange={e => setNewQuestionText(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#3B82F6]" />
                    <input type="text" placeholder="Resposta correta" value={newQuestionAnswer}
                      onChange={e => setNewQuestionAnswer(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#3B82F6]" />
                    <input type="text" placeholder="Alternativas (separadas por vírgula, mínimo 3)" value={newQuestionAlts}
                      onChange={e => setNewQuestionAlts(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#3B82F6]" />
                    <input type="text" placeholder="Categoria (opcional)" value={newQuestionCategory}
                      onChange={e => setNewQuestionCategory(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#3B82F6]" />
                    <button type="button" onClick={handleAddQuestion}
                      disabled={!newQuestionText.trim() || !newQuestionAnswer.trim()}
                      className="w-full py-2.5 bg-[#F1F5F9] hover:bg-[#CBD5E1] text-[#0F172A] text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> Adicionar pergunta
                    </button>
                  </div>

                  {customQuizQuestions.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-[#64748B]">Perguntas adicionadas ({customQuizQuestions.length})</h3>
                      <div className="max-h-48 overflow-y-auto space-y-1.5">
                        {customQuizQuestions.map((q, idx) => (
                          <div key={idx} className="flex items-start gap-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm">
                            <span className="text-[#94A3B8] font-mono text-xs shrink-0 mt-0.5">{idx + 1}.</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[#0F172A] font-medium truncate">{q.text}</p>
                              <p className="text-[11px] text-[#94A3B8]">Resp: {q.correctAnswer} {q.alternatives.length > 0 && `| Alts: ${q.alternatives.join(', ')}`}</p>
                            </div>
                            <button type="button" onClick={() => handleRemoveQuestion(idx)}
                              className="text-[#EF4444] hover:text-[#DC2626] text-xs shrink-0 cursor-pointer">Remover</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {quizError && <p className="text-xs text-[#EF4444]">{quizError}</p>}

                  <button type="button" onClick={handleCreateQuiz}
                    disabled={isCreatingQuiz || customQuizQuestions.length < 5 || !customQuizName.trim()}
                    className="w-full py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
                    {isCreatingQuiz ? 'Salvando...' : quizId ? 'Quiz salvo!' : 'Salvar quiz'}
                  </button>
                </div>
              )}

              <div className="bg-white border-2 border-black/15 rounded-2xl p-5 sm:p-6 space-y-5">
                <h2 className="text-sm font-bold text-[#0F172A]">Configurações da partida</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {questionSource === 'official' && (
                    <>
                      <div className="space-y-1.5">
                        <label htmlFor="question-count" className="block text-xs font-semibold text-[#64748B]">Perguntas</label>
                        <select id="question-count" value={questionCount} onChange={e => setQuestionCount(Number(e.target.value) as any)}
                          className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] outline-none">
                          {QUESTION_OPTIONS.map(n => <option key={n} value={n} className="bg-white">{n}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="difficulty" className="block text-xs font-semibold text-[#64748B]">Dificuldade</label>
                        <select id="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}
                          className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] outline-none">
                          {DIFFICULTY_OPTIONS.map(d => <option key={d.value} value={d.value} className="bg-white">{d.label}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                  <div className="space-y-1.5">
                    <label htmlFor="max-players" className="block text-xs font-semibold text-[#64748B]">Máx. jogadores</label>
                    <select id="max-players" value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value) as any)}
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] outline-none">
                      {MAX_PLAYER_OPTIONS.map(n => <option key={n} value={n} className="bg-white">{n}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="answer-mode" className="block text-xs font-semibold text-[#64748B]">Modo resposta</label>
                    <select id="answer-mode" value={answerMode} onChange={e => setAnswerMode(e.target.value as AnswerType)}
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] outline-none">
                      {ANSWER_MODE_OPTIONS.map(a => <option key={a.value} value={a.value} className="bg-white">{a.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="answer-time" className="block text-xs font-semibold text-[#64748B]">Tempo resposta</label>
                    <select id="answer-time" value={answerTimeSeconds} onChange={e => setAnswerTimeSeconds(Number(e.target.value) as any)}
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] outline-none">
                      {ANSWER_TIME_OPTIONS.map(n => <option key={n} value={n} className="bg-white">{n}s</option>)}
                    </select>
                  </div>
                </div>

                <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-4 space-y-2">
                  {ANSWER_MODE_OPTIONS.find(a => a.value === answerMode) && (
                    <div className="flex items-start gap-2.5">
                      {answerMode === 'spoken' ? <Mic className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" /> : <CheckSquare className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />}
                      <div>
                        <div className="text-sm font-semibold text-[#0F172A]">{ANSWER_MODE_OPTIONS.find(a => a.value === answerMode)!.label}</div>
                        <p className="text-xs text-[#64748B]">{ANSWER_MODE_OPTIONS.find(a => a.value === answerMode)!.desc}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-4 space-y-2">
                  <label className="text-xs font-semibold text-[#64748B]">Penalidade por erro</label>
                  <div className="flex gap-2">
                    {[0, -1].map(n => (
                      <button key={n} type="button" onClick={() => setWrongPenalty(n)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                          wrongPenalty === n ? 'bg-[#3B82F6] text-white' : 'bg-white border border-[#CBD5E1] text-[#64748B] hover:border-[#94A3B8]'
                        }`}>
                        {n === 0 ? 'Sem penalidade' : '-1 ponto'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting}
                className="w-full py-3.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-[0_2px_12px_rgba(59,130,246,0.25)] hover:shadow-[0_4px_16px_rgba(59,130,246,0.4)] lg:hidden">
                {isSubmitting ? <span>Criando...</span> : <><Plus className="w-4 h-4" /><span>Criar partida</span></>}
              </button>

              <div className="lg:hidden">
                <button type="button" onClick={() => setShowMobileSummary(!showMobileSummary)}
                  className="w-full flex items-center justify-between py-2 text-xs font-semibold text-[#64748B]">
                  <span>Resumo da configuração</span>
                  {showMobileSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showMobileSummary && (
                  <div className="bg-white border-2 border-black/15 rounded-2xl p-5">
                    <SummaryContent />
                  </div>
                )}
              </div>
            </div>

            <div className="hidden lg:block lg:col-span-4">
              <div className="bg-white border-2 border-black/15 rounded-2xl p-6 space-y-5 sticky top-24">
                <SummaryContent />
                <button type="submit" disabled={isSubmitting}
                  className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-[0_2px_10px_rgba(59,130,246,0.25)] hover:shadow-[0_4px_14px_rgba(59,130,246,0.4)]">
                  {isSubmitting ? <span>Criando...</span> : <><Plus className="w-4 h-4" /><span>Criar partida</span></>}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
