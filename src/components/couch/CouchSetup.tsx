'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronRight, Keyboard, Smartphone } from 'lucide-react';
import { CouchPlayer } from '@/hooks/useCouchGame';
import { Difficulty } from '@/lib/types';

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

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Fácil' },
  { value: 'medium', label: 'Média' },
  { value: 'hard', label: 'Difícil' },
  { value: 'mixed', label: 'Misturada' },
];

const QUESTION_OPTIONS = [10, 15, 20, 30] as const;
const ANSWER_TIME_OPTIONS = [5, 10, 15, 20, 30] as const;
const DEFAULT_KEYS = ['KeyA', 'KeyL', 'KeyQ', 'KeyP', 'KeyZ', 'KeyM', 'Space', 'Enter'];
const TOUCH_COLORS = ['#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export type CouchInputMode = 'keyboard' | 'touch-zones';

interface CouchSetupProps {
  isMobile: boolean;
  onStart: (options: {
    players: CouchPlayer[];
    source: 'official' | 'custom';
    categories?: string[];
    difficulty?: Difficulty;
    questionCount?: number;
    answerTimeSeconds?: number;
    inputMode: CouchInputMode;
  }) => void;
}

function formatKey(code: string): string {
  if (!code) return '-';
  if (code === 'Space') return 'Espaço';
  if (code === 'Enter') return 'Enter';
  if (code.startsWith('Key')) return code.replace('Key', '').toUpperCase();
  if (code.startsWith('Digit')) return code.replace('Digit', '');
  return code.replace(/^(Arrow|Numpad)/, '');
}

export const CouchSetup: React.FC<CouchSetupProps> = ({ isMobile, onStart }) => {
  const [inputMode, setInputMode] = useState<CouchInputMode>(isMobile ? 'touch-zones' : 'keyboard');
  const maxPlayers = inputMode === 'touch-zones' ? 4 : 8;
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState<string[]>(Array.from({ length: 8 }, (_, i) => `Jogador ${i + 1}`));
  const [playerKeys, setPlayerKeys] = useState<string[]>(DEFAULT_KEYS);
  const [capturingKeyFor, setCapturingKeyFor] = useState<number | null>(null);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [source, setSource] = useState<'official' | 'custom'>('official');
  const [categories, setCategories] = useState<string[]>(['Tudo misturado']);
  const [difficulty, setDifficulty] = useState<Difficulty>('mixed');
  const [questionCount, setQuestionCount] = useState<10 | 15 | 20 | 30>(15);
  const [answerTimeSeconds, setAnswerTimeSeconds] = useState<5 | 10 | 15 | 20 | 30>(15);
  const [error, setError] = useState('');

  const activeKeys = useMemo(() => playerKeys.slice(0, playerCount), [playerCount, playerKeys]);

  const handleCategoryToggle = (cat: string) => {
    if (cat === 'Tudo misturado') {
      setCategories(['Tudo misturado']);
      return;
    }
    const filtered = categories.filter(c => c !== 'Tudo misturado');
    if (filtered.includes(cat)) {
      const next = filtered.filter(c => c !== cat);
      setCategories(next.length === 0 ? ['Tudo misturado'] : next);
    } else {
      setCategories([...filtered, cat]);
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (capturingKeyFor !== null || e.repeat) return;
    const idx = activeKeys.indexOf(e.code);
    if (idx >= 0) {
      setTestingKey(e.code);
      setTimeout(() => setTestingKey(null), 800);
    }
  }, [activeKeys, capturingKeyFor]);

  useEffect(() => {
    if (inputMode !== 'keyboard') return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, inputMode]);

  useEffect(() => {
    if (capturingKeyFor === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      if (event.code === 'Escape') {
        setCapturingKeyFor(null);
        return;
      }
      if (event.code === 'Backspace') {
        setPlayerKeys(prev => prev.map((key, idx) => idx === capturingKeyFor ? '' : key));
        setCapturingKeyFor(null);
        setError('');
        return;
      }
      if (playerKeys.some((key, idx) => idx !== capturingKeyFor && key === event.code)) {
        setError('Esta tecla já está em uso por outro jogador.');
        return;
      }
      setPlayerKeys(prev => prev.map((key, idx) => idx === capturingKeyFor ? event.code : key));
      setCapturingKeyFor(null);
      setError('');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [capturingKeyFor, playerKeys]);

  const validate = (): string | null => {
    if (playerCount < 2) return 'Mínimo de 2 jogadores.';
    for (let i = 0; i < playerCount; i++) {
      if (!names[i]?.trim()) return `Nome do Jogador ${i + 1} é obrigatório.`;
    }
    if (inputMode === 'keyboard') {
      const keys = playerKeys.slice(0, playerCount);
      if (keys.some(key => !key)) return 'Todos os jogadores precisam ter uma tecla.';
      if (new Set(keys).size !== keys.length) return 'Teclas duplicadas detectadas.';
    }
    if (source === 'official' && categories.length === 0) return 'Selecione pelo menos uma categoria.';
    return null;
  };

  const handleStart = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError('');

    const players: CouchPlayer[] = Array.from({ length: playerCount }, (_, i) => ({
      id: `local-${i}`,
      name: names[i].trim() || `Jogador ${i + 1}`,
      control: inputMode === 'touch-zones'
        ? { type: 'touch' as const, zoneIndex: i, color: TOUCH_COLORS[i % TOUCH_COLORS.length] }
        : { type: 'keyboard' as const, key: playerKeys[i], keyLabel: formatKey(playerKeys[i]), color: TOUCH_COLORS[i % TOUCH_COLORS.length] },
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      totalReactionTime: 0,
      buzzCount: 0,
    }));

    onStart({
      players,
      source,
      categories: source === 'official' ? categories : undefined,
      difficulty: source === 'official' ? difficulty : undefined,
      questionCount: source === 'official' ? questionCount : undefined,
      answerTimeSeconds,
      inputMode,
    });
  };

  return (
    <div className="w-full space-y-6">
      <section className="bg-white border-2 border-black/15 rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">Configurar partida local</h2>
            <p className="text-sm text-[#64748B] mt-1">Sem sala, sem código e sem lobby. Tudo roda neste aparelho.</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 px-3 py-1 bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-full">
            <Smartphone className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span className="text-[11px] font-bold text-[#3B82F6] uppercase tracking-wider">Modo Sofá</span>
          </div>
        </div>
      </section>

      <section className="bg-white border-2 border-black/15 rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#0F172A]">Método de controle</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { setInputMode('touch-zones'); setPlayerCount(prev => Math.min(prev, 4)); }}
            className={`p-3 rounded-xl border text-left transition-colors ${inputMode === 'touch-zones' ? 'bg-[#3B82F6]/10 border-[#3B82F6] text-[#0F172A]' : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B] hover:border-[#94A3B8]'}`}
          >
            <Smartphone className="w-4 h-4 mb-1.5" />
            <div className="text-sm font-bold">Toque</div>
            <div className="text-[11px] text-[#94A3B8]">Até 4 jogadores</div>
          </button>
          <button
            type="button"
            onClick={() => { setInputMode('keyboard'); setPlayerCount(prev => Math.min(prev, 8)); }}
            className={`p-3 rounded-xl border text-left transition-colors ${inputMode === 'keyboard' ? 'bg-[#3B82F6]/10 border-[#3B82F6] text-[#0F172A]' : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B] hover:border-[#94A3B8]'}`}
          >
            <Keyboard className="w-4 h-4 mb-1.5" />
            <div className="text-sm font-bold">Teclado</div>
            <div className="text-[11px] text-[#94A3B8]">Até 8 jogadores</div>
          </button>
        </div>
      </section>

      <section className="bg-white border-2 border-black/15 rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#0F172A]">Número de jogadores</h2>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: maxPlayers - 1 }, (_, i) => i + 2).map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setPlayerCount(n)}
              className={`min-w-12 flex-1 py-2.5 rounded-xl border text-sm font-bold transition-colors ${playerCount === n ? 'bg-[#3B82F6] text-white border-[#3B82F6]' : 'bg-[#F8FAFC] text-[#64748B] border-[#CBD5E1] hover:border-[#94A3B8]'}`}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      {inputMode === 'touch-zones' && (
        <section className="bg-white border-2 border-black/15 rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#0F172A]">Prévia da tela de toque</h2>
          <div className="grid grid-cols-2 gap-2 min-h-56">
            {Array.from({ length: playerCount }, (_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-black/10 p-4 flex items-center justify-center text-center text-sm font-black text-white"
                style={{ backgroundColor: TOUCH_COLORS[i % TOUCH_COLORS.length] }}
              >
                {names[i] || `Jogador ${i + 1}`}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white border-2 border-black/15 rounded-2xl p-5 sm:p-6 space-y-3">
        <h2 className="text-sm font-bold text-[#0F172A]">Jogadores</h2>
        <div className="space-y-2">
          {Array.from({ length: playerCount }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all ${inputMode === 'touch-zones' ? 'text-white' : testingKey === playerKeys[i] ? 'bg-[#3B82F6] text-white scale-110 shadow-[0_0_12px_rgba(59,130,246,0.35)]' : 'bg-[#F1F5F9] border border-[#CBD5E1] text-[#64748B]'}`}
                style={inputMode === 'touch-zones' ? { backgroundColor: TOUCH_COLORS[i % TOUCH_COLORS.length] } : undefined}
              >
                {inputMode === 'touch-zones' ? <div className="w-3 h-3 rounded-sm bg-white/80" /> : formatKey(playerKeys[i])}
              </div>
              <input
                type="text"
                maxLength={20}
                value={names[i]}
                onChange={e => {
                  const next = [...names];
                  next[i] = e.target.value;
                  setNames(next);
                }}
                placeholder={`Jogador ${i + 1}`}
                className="flex-1 min-w-0 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#3B82F6] transition-colors"
              />
              {inputMode === 'keyboard' && (
                <button
                  type="button"
                  onClick={() => setCapturingKeyFor(i)}
                  className="min-h-10 rounded-lg border border-[#CBD5E1] bg-white px-3 text-xs font-bold text-[#64748B] hover:border-[#3B82F6]/50 hover:text-[#0F172A]"
                >
                  Alterar tecla
                </button>
              )}
            </div>
          ))}
        </div>
        {capturingKeyFor !== null && (
          <div className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-3 text-sm font-semibold text-[#B45309]">
            Pressione qualquer tecla... ESC cancela, Backspace limpa.
          </div>
        )}
        {inputMode === 'keyboard' && (
          <p className="text-[11px] text-[#64748B] flex items-center gap-1.5 mt-2">
            <Keyboard className="w-3 h-3" />
            Pressione a tecla configurada para testar. A tecla do jogador acende em azul.
          </p>
        )}
      </section>

      <section className="bg-white border-2 border-black/15 rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#0F172A]">Fonte das perguntas</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSource('official')}
            className={`p-3 rounded-xl border text-left transition-colors ${source === 'official' ? 'bg-[#3B82F6]/10 border-[#3B82F6] text-[#0F172A]' : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B] hover:border-[#94A3B8]'}`}
          >
            <div className="text-sm font-bold">Oficial</div>
            <div className="text-[11px] text-[#94A3B8]">Banco do BatePrimeiro</div>
          </button>
          <button
            type="button"
            onClick={() => setSource('custom')}
            className={`p-3 rounded-xl border text-left transition-colors ${source === 'custom' ? 'bg-[#3B82F6]/10 border-[#3B82F6] text-[#0F172A]' : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B] hover:border-[#94A3B8]'}`}
          >
            <div className="text-sm font-bold">Personalizado</div>
            <div className="text-[11px] text-[#94A3B8]">Quiz salvo no criador</div>
          </button>
        </div>

        {source === 'official' && (
          <>
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-[#64748B]">Categorias</h3>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryToggle(cat)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors ${categories.includes(cat) ? 'bg-[#3B82F6] text-white border-[#3B82F6]' : 'bg-[#F8FAFC] text-[#64748B] border-[#CBD5E1] hover:border-[#94A3B8]'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-[#64748B]">Dificuldade</span>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as Difficulty)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-[#3B82F6]"
                >
                  {DIFFICULTY_OPTIONS.map(d => <option key={d.value} value={d.value} className="bg-white">{d.label}</option>)}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-[#64748B]">Perguntas</span>
                <select
                  value={questionCount}
                  onChange={e => setQuestionCount(Number(e.target.value) as any)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-[#3B82F6]"
                >
                  {QUESTION_OPTIONS.map(n => <option key={n} value={n} className="bg-white">{n}</option>)}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-[#64748B]">Tempo</span>
                <select
                  value={answerTimeSeconds}
                  onChange={e => setAnswerTimeSeconds(Number(e.target.value) as any)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-[#3B82F6]"
                >
                  {ANSWER_TIME_OPTIONS.map(n => <option key={n} value={n} className="bg-white">{n}s</option>)}
                </select>
              </label>
            </div>
          </>
        )}

        {source === 'custom' && (
          <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/25 rounded-xl p-3 text-sm text-[#2563EB]">
            Usará o quiz salvo no criador de perguntas.
          </div>
        )}
      </section>

      {error && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-3 text-sm text-[#EF4444] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleStart}
        className="w-full py-3.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_2px_12px_rgba(59,130,246,0.25)] hover:shadow-[0_4px_16px_rgba(59,130,246,0.4)] active:scale-[0.98]"
      >
        Iniciar partida local <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
