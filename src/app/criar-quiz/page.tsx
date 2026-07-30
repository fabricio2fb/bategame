'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Copy, ChevronUp, ChevronDown, Download, Upload, AlertCircle, GripVertical, Mic, CheckSquare, Type } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { AnswerType } from '@/lib/types';
import { useSocketRoom } from '@/hooks/useSocketRoom';

interface QuizQuestion {
  id: string;
  text: string;
  answerType: AnswerType;
  correctAnswer: string;
  alternatives: string[];
  category: string;
  timeLimitSeconds: number;
}

interface QuizDraft {
  name: string;
  questions: QuizQuestion[];
  lastSaved: number;
}

const ANSWER_TYPE_OPTIONS: { value: AnswerType; label: string; icon: React.ReactNode }[] = [
  { value: 'multiple-choice', label: 'Múltipla escolha', icon: <CheckSquare className="w-4 h-4" /> },
  { value: 'written', label: 'Resposta escrita', icon: <Type className="w-4 h-4" /> },
  { value: 'spoken', label: 'Resposta falada', icon: <Mic className="w-4 h-4" /> },
];

const STORAGE_KEY = 'bateu_quiz_draft';
const MAX_QUESTIONS = 100;
const MAX_TEXT_LENGTH = 500;
const MAX_ALTERNATIVE_LENGTH = 200;

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function loadDraft(): QuizDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as QuizDraft;
    if (!draft.name || !Array.isArray(draft.questions)) return null;
    return draft;
  } catch {
    return null;
  }
}

function saveDraft(draft: QuizDraft): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, lastSaved: Date.now() }));
  } catch {}
}

function clearDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export default function CriarQuizPage() {
  const router = useRouter();
  const { createQuiz, connectionStatus } = useSocketRoom();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [quizName, setQuizName] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImport, setPendingImport] = useState<QuizQuestion[] | null>(null);

  const draftRef = useRef<QuizDraft>({ name: '', questions: [], lastSaved: 0 });

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setQuizName(draft.name);
      setQuestions(draft.questions);
    }
  }, []);

  useEffect(() => {
    draftRef.current = { name: quizName, questions, lastSaved: Date.now() };
    saveDraft(draftRef.current);
  }, [quizName, questions]);

  const addQuestion = useCallback(() => {
    if (questions.length >= MAX_QUESTIONS) {
      setError(`Máximo de ${MAX_QUESTIONS} perguntas.`);
      return;
    }
    const newQ: QuizQuestion = {
      id: generateId(),
      text: '',
      answerType: 'multiple-choice',
      correctAnswer: '',
      alternatives: ['', '', ''],
      category: '',
      timeLimitSeconds: 30,
    };
    setQuestions(prev => [...prev, newQ]);
    setEditingIndex(questions.length);
  }, [questions.length]);

  const duplicateQuestion = useCallback((idx: number) => {
    if (questions.length >= MAX_QUESTIONS) {
      setError(`Máximo de ${MAX_QUESTIONS} perguntas.`);
      return;
    }
    const src = questions[idx];
    const dup: QuizQuestion = {
      ...src,
      id: generateId(),
      alternatives: [...src.alternatives],
    };
    setQuestions(prev => {
      const next = [...prev];
      next.splice(idx + 1, 0, dup);
      return next;
    });
    setEditingIndex(idx + 1);
  }, [questions]);

  const removeQuestion = useCallback((idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
    if (editingIndex === idx) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > idx) setEditingIndex(editingIndex - 1);
  }, [editingIndex]);

  const moveQuestion = useCallback((idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= questions.length) return;
    setQuestions(prev => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    setEditingIndex(target);
  }, [questions.length]);

  const updateQuestion = useCallback((idx: number, field: keyof QuizQuestion, value: any) => {
    setQuestions(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }, []);

  const updateAlternative = useCallback((qIdx: number, aIdx: number, value: string) => {
    setQuestions(prev => {
      const next = [...prev];
      const alts = [...next[qIdx].alternatives];
      alts[aIdx] = value;
      next[qIdx] = { ...next[qIdx], alternatives: alts };
      return next;
    });
  }, []);

  const addAlternative = useCallback((qIdx: number) => {
    setQuestions(prev => {
      const next = [...prev];
      next[qIdx] = { ...next[qIdx], alternatives: [...next[qIdx].alternatives, ''] };
      return next;
    });
  }, []);

  const removeAlternative = useCallback((qIdx: number, aIdx: number) => {
    setQuestions(prev => {
      const next = [...prev];
      const alts = next[qIdx].alternatives.filter((_, i) => i !== aIdx);
      next[qIdx] = { ...next[qIdx], alternatives: alts };
      return next;
    });
  }, []);

  const validate = useCallback((): string | null => {
    if (!quizName.trim()) return 'Informe o nome do quiz.';
    if (questions.length < 5) return 'Mínimo de 5 perguntas.';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Pergunta ${i + 1}: texto obrigatório.`;
      if (q.text.length > MAX_TEXT_LENGTH) return `Pergunta ${i + 1}: texto muito longo (máx. ${MAX_TEXT_LENGTH}).`;
      if (!q.correctAnswer.trim()) return `Pergunta ${i + 1}: resposta correta obrigatória.`;
      if (q.answerType === 'multiple-choice') {
        const validAlts = q.alternatives.filter(a => a.trim());
        if (validAlts.length < 2) return `Pergunta ${i + 1}: pelo menos 2 alternativas válidas.`;
        for (const a of q.alternatives) {
          if (a.length > MAX_ALTERNATIVE_LENGTH) return `Pergunta ${i + 1}: alternativa muito longa (máx. ${MAX_ALTERNATIVE_LENGTH}).`;
        }
      }
    }
    return null;
  }, [quizName, questions]);

  const handleSave = useCallback(async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (connectionStatus !== 'connected') {
      setError('Servidor não disponível.');
      return;
    }
    setIsSaving(true);
    setError('');
    setSuccess('');

    const result = await createQuiz(quizName.trim(), questions.map(q => ({
      text: q.text.trim(),
      correctAnswer: q.correctAnswer.trim(),
      alternatives: q.alternatives.map(a => a.trim()).filter(Boolean),
      category: q.category.trim() || 'Personalizado',
      type: q.answerType,
      difficulty: 'medium',
      timeLimitSeconds: q.timeLimitSeconds,
    })));

    setIsSaving(false);
    if (result.success) {
      clearDraft();
      setSuccess('Quiz salvo com sucesso!');
      setTimeout(() => router.push('/criar-partida'), 1500);
    } else {
      setError(result.error || 'Erro ao salvar quiz.');
    }
  }, [validate, connectionStatus, createQuiz, quizName, questions, router]);

  const handleExport = useCallback(() => {
    const data = {
      version: 1,
      name: quizName,
      questions: questions.map(q => ({
        text: q.text,
        answerType: q.answerType,
        correctAnswer: q.correctAnswer,
        alternatives: q.alternatives.filter(a => a.trim()),
        category: q.category || 'Personalizado',
        timeLimitSeconds: q.timeLimitSeconds,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quizName || 'quiz'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [quizName, questions]);

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string);
        if (!raw.questions || !Array.isArray(raw.questions)) {
          setError('Arquivo JSON inválido.');
          return;
        }
        const imported: QuizQuestion[] = raw.questions.map((q: any) => ({
          id: generateId(),
          text: String(q.text || ''),
          answerType: (q.answerType || q.type || 'multiple-choice') as AnswerType,
          correctAnswer: String(q.correctAnswer || ''),
          alternatives: Array.isArray(q.alternatives) ? q.alternatives.map(String) : [],
          category: String(q.category || 'Personalizado'),
          timeLimitSeconds: Number(q.timeLimitSeconds || 30),
        }));
        if (questions.length > 0) {
          setPendingImport(imported);
          setShowImportConfirm(true);
        } else {
          setQuestions(imported);
          if (raw.name) setQuizName(raw.name);
        }
      } catch {
        setError('Erro ao ler arquivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [questions.length]);

  const confirmImport = useCallback(() => {
    if (pendingImport) {
      setQuestions(pendingImport);
      setPendingImport(null);
    }
    setShowImportConfirm(false);
  }, [pendingImport]);

  const questionCount = questions.length;
  const validCount = questions.filter(q => q.text.trim() && q.correctAnswer.trim()).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <header className="h-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#CBD5E1]/40">
        <div className="max-w-5xl mx-auto h-full flex items-center justify-between">
          <Link href="/criar-partida" className="flex items-center gap-2"><Logo /></Link>
          <Link href="/criar-partida"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-[#64748B] hover:text-[#0F172A] bg-white border border-[#CBD5E1] rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" /><span>Voltar</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0F172A]">Criar quiz personalizado</h1>
          <p className="text-sm text-[#64748B] mt-1">Crie suas perguntas com múltipla escolha, resposta escrita ou falada.</p>
        </div>

        {error && (
          <div className="mb-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-3 text-sm text-[#EF4444] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
            <button onClick={() => setError('')} className="ml-auto text-xs underline cursor-pointer">Fechar</button>
          </div>
        )}
        {success && (
          <div className="mb-4 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl p-3 text-sm text-[#22C55E]">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border-2 border-black/15 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#0F172A]">Informações do quiz</h2>
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
                  <button onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />Importar
                  </button>
                  <button onClick={handleExport} disabled={questions.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg transition-colors cursor-pointer disabled:opacity-50">
                    <Download className="w-3.5 h-3.5" />Exportar
                  </button>
                </div>
              </div>
              <input type="text" maxLength={40} placeholder="Nome do quiz (ex.: Quiz da firma)"
                value={quizName} onChange={e => setQuizName(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#3B82F6]" />
              <div className="flex items-center gap-3 text-xs text-[#64748B]">
                <span>{questionCount}/{MAX_QUESTIONS} perguntas</span>
                <span className="text-[#CBD5E1]">|</span>
                <span>{validCount} válidas</span>
                {questionCount >= 5 && <span className="text-[#22C55E] font-medium">Mínimo atingido</span>}
              </div>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={q.id}
                  className={`bg-white border-2 rounded-2xl overflow-hidden transition-all ${
                    editingIndex === idx ? 'border-[#3B82F6] shadow-lg' : 'border-black/10'
                  }`}>
                  <div className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-[#F8FAFC]"
                    onClick={() => setEditingIndex(editingIndex === idx ? null : idx)}>
                    <GripVertical className="w-4 h-4 text-[#CBD5E1] shrink-0" />
                    <span className="text-xs font-mono text-[#94A3B8] w-6 shrink-0">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{q.text || 'Pergunta sem texto'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#64748B]">
                          {q.answerType === 'multiple-choice' ? 'Múltipla escolha' : q.answerType === 'written' ? 'Escrita' : 'Falada'}
                        </span>
                        {q.correctAnswer && <span className="text-[10px] text-[#22C55E]">✓ Resp: {q.correctAnswer}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => moveQuestion(idx, -1)} disabled={idx === 0}
                        className="p-1 rounded text-[#94A3B8] hover:text-[#0F172A] disabled:opacity-30 cursor-pointer">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => moveQuestion(idx, 1)} disabled={idx === questions.length - 1}
                        className="p-1 rounded text-[#94A3B8] hover:text-[#0F172A] disabled:opacity-30 cursor-pointer">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => duplicateQuestion(idx)}
                        className="p-1 rounded text-[#94A3B8] hover:text-[#3B82F6] cursor-pointer">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => removeQuestion(idx)}
                        className="p-1 rounded text-[#94A3B8] hover:text-[#EF4444] cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {editingIndex === idx && (
                    <div className="px-4 pb-4 pt-2 border-t border-[#CBD5E1]/30 space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748B]">Texto da pergunta</label>
                        <textarea maxLength={MAX_TEXT_LENGTH} rows={2} placeholder="Qual é a capital do Brasil?"
                          value={q.text} onChange={e => updateQuestion(idx, 'text', e.target.value)}
                          className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#3B82F6] resize-none" />
                        <span className="text-[10px] text-[#94A3B8]">{q.text.length}/{MAX_TEXT_LENGTH}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#64748B]">Tipo de resposta</label>
                          <div className="flex gap-1.5">
                            {ANSWER_TYPE_OPTIONS.map(opt => (
                              <button key={opt.value} type="button"
                                onClick={() => updateQuestion(idx, 'answerType', opt.value)}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                  q.answerType === opt.value
                                    ? 'bg-[#3B82F6] text-white'
                                    : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                                }`}>
                                {opt.icon}{opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#64748B]">Tempo (seg)</label>
                          <select value={q.timeLimitSeconds}
                            onChange={e => updateQuestion(idx, 'timeLimitSeconds', Number(e.target.value))}
                            className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] outline-none">
                            {[10, 15, 20, 30, 45, 60].map(n => <option key={n} value={n}>{n}s</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748B]">Categoria</label>
                        <input type="text" maxLength={50} placeholder="Ex.: Geografia"
                          value={q.category} onChange={e => updateQuestion(idx, 'category', e.target.value)}
                          className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#3B82F6]" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748B]">Resposta correta</label>
                        <input type="text" maxLength={200} placeholder="Resposta correta"
                          value={q.correctAnswer} onChange={e => updateQuestion(idx, 'correctAnswer', e.target.value)}
                          className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#3B82F6]" />
                      </div>

                      {q.answerType === 'multiple-choice' && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-[#64748B]">Alternativas</label>
                            <button onClick={() => addAlternative(idx)}
                              className="text-[10px] font-medium text-[#3B82F6] hover:text-[#2563EB] cursor-pointer flex items-center gap-1">
                              <Plus className="w-3 h-3" />Adicionar
                            </button>
                          </div>
                          <div className="space-y-1.5">
                            {q.alternatives.map((alt, aIdx) => (
                              <div key={aIdx} className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#94A3B8] w-5 shrink-0">
                                  {String.fromCharCode(65 + aIdx)}
                                </span>
                                <input type="text" maxLength={MAX_ALTERNATIVE_LENGTH}
                                  placeholder={`Alternativa ${String.fromCharCode(65 + aIdx)}`}
                                  value={alt} onChange={e => updateAlternative(idx, aIdx, e.target.value)}
                                  className="flex-1 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#3B82F6]" />
                                {q.alternatives.length > 2 && (
                                  <button onClick={() => removeAlternative(idx, aIdx)}
                                    className="p-1 rounded text-[#94A3B8] hover:text-[#EF4444] cursor-pointer">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(q.answerType === 'written' || q.answerType === 'spoken') && (
                        <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg p-3 text-xs text-[#64748B]">
                          {q.answerType === 'written'
                            ? 'O jogador digitará a resposta. Validação automática com tolerância configurada no servidor.'
                            : 'O jogador falará a resposta. O host julgará manualmente se acertou.'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={addQuestion}
              className="w-full py-3 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 border border-dashed border-[#CBD5E1]">
              <Plus className="w-4 h-4" />Adicionar pergunta
            </button>
          </div>

          <div className="hidden lg:block lg:col-span-4">
            <div className="bg-white border-2 border-black/15 rounded-2xl p-5 space-y-4 sticky top-24">
              <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Resumo</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Nome</span>
                  <span className="font-medium text-[#0F172A]">{quizName || '...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Perguntas</span>
                  <span className="font-medium text-[#0F172A]">{questionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Válidas</span>
                  <span className={`font-medium ${validCount === questionCount ? 'text-[#22C55E]' : 'text-[#F59E0B]'}`}>{validCount}</span>
                </div>
                {questionCount >= 5 && validCount === questionCount && (
                  <p className="text-[10px] text-[#22C55E] font-medium">Tudo pronto para salvar!</p>
                )}
              </div>
              <button onClick={handleSave} disabled={isSaving || questionCount < 5 || validCount !== questionCount}
                className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-[0_2px_10px_rgba(59,130,246,0.25)]">
                {isSaving ? 'Salvando...' : 'Salvar quiz'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {showImportConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowImportConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#0F172A] mb-2">Substituir perguntas?</h3>
            <p className="text-sm text-[#64748B]">Você já tem {questions.length} pergunta(s). A importação irá substituir todas.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowImportConfirm(false)}
                className="flex-1 py-2.5 bg-[#F1F5F9] text-[#0F172A] text-sm font-semibold rounded-lg cursor-pointer">
                Cancelar
              </button>
              <button onClick={confirmImport}
                className="flex-1 py-2.5 bg-[#3B82F6] text-white text-sm font-semibold rounded-lg cursor-pointer">
                Substituir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
