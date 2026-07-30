'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { CouchQuestion, loadQuestionsByCategories, loadCustomQuizFromStorage, shuffleAlternatives, validateOfficialQuestionAnswer } from '@/lib/couchQuestions';
import { validateWrittenAnswer } from '@/lib/validateWrittenAnswer';
import { Difficulty } from '@/lib/types';
import type { CouchInputMode } from '@/components/couch/CouchSetup';

export type CouchPhase =
  | 'setup'
  | 'countdown'
  | 'question-visible'
  | 'buzzer-opening'
  | 'buzzer-open'
  | 'player-selected'
  | 'correct'
  | 'wrong'
  | 'timeout'
  | 'game-finished';

export interface CouchPlayer {
  id: string;
  name: string;
  control: {
    type: 'keyboard' | 'touch';
    key?: string;
    keyLabel?: string;
    zoneIndex?: number;
    color: string;
  };
  score: number;
  correctCount: number;
  wrongCount: number;
  totalReactionTime: number;
  buzzCount: number;
}

export interface CouchRoundEvent {
  type: 'buzzer' | 'correct' | 'wrong' | 'timeout';
  playerId: string;
  playerName: string;
  timestamp: number;
  reactionTimeMs?: number;
  data?: Record<string, any>;
}

export interface CouchGameState {
  phase: CouchPhase;
  players: CouchPlayer[];
  questions: CouchQuestion[];
  currentQuestionIndex: number;
  currentQuestion: CouchQuestion | null;
  currentWinnerId: string | null;
  selectedAnswer: string | null;
  resultCorrect: boolean | null;
  correctAnswer: string | null;
  blockedPlayerIds: string[];
  roundEvents: CouchRoundEvent[];
  timer: number;
  answerTimeSeconds: number;
  countdownValue: number | null;
  isDeviceMobile: boolean;
  inputMode: CouchInputMode;
  usedQuestionIds: Set<string>;
  shuffledAlternatives: string[] | null;
  correctAlternativeIndex: number;
}

export interface CouchStartOptions {
  players: CouchPlayer[];
  source: 'official' | 'custom';
  categories?: string[];
  difficulty?: Difficulty;
  questionCount?: number;
  answerTimeSeconds?: number;
  inputMode?: CouchInputMode;
}

const TOUCH_COLORS = ['#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

export function useCouchGame() {
  const [gameState, setGameState] = useState<CouchGameState>({
    phase: 'setup',
    players: [],
    questions: [],
    currentQuestionIndex: 0,
    currentQuestion: null,
    currentWinnerId: null,
    selectedAnswer: null,
    resultCorrect: null,
    correctAnswer: null,
    blockedPlayerIds: [],
    roundEvents: [],
    timer: 30,
    answerTimeSeconds: 30,
    countdownValue: null,
    isDeviceMobile: false,
    inputMode: 'keyboard',
    usedQuestionIds: new Set(),
    shuffledAlternatives: null,
    correctAlternativeIndex: 0,
  });

  const buzzerOpenedAtRef = useRef<number>(0);
  const answerInputArmedRef = useRef(false);
  const keyHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  useEffect(() => {
    return () => {
      if (keyHandlerRef.current) {
        window.removeEventListener('keydown', keyHandlerRef.current);
        keyHandlerRef.current = null;
      }
    };
  }, []);

  const removeKeyboardListener = useCallback(() => {
    if (keyHandlerRef.current) {
      window.removeEventListener('keydown', keyHandlerRef.current);
      keyHandlerRef.current = null;
    }
  }, []);

  const addKeyboardListener = useCallback((handler: (e: KeyboardEvent) => void) => {
    removeKeyboardListener();
    keyHandlerRef.current = handler;
    window.addEventListener('keydown', handler);
  }, [removeKeyboardListener]);

  const detectMobile = useCallback(() => {
    let isMobile = false;
    if (typeof window !== 'undefined') {
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      const hasSmallScreen = window.innerWidth < 768;
      const ua = navigator.userAgent || '';
      const isMobileUA = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      isMobile = (hasCoarsePointer && hasSmallScreen) || isMobileUA;
    }
    setGameState(prev => ({ ...prev, isDeviceMobile: isMobile }));
    return isMobile;
  }, []);

  const startGame = useCallback(async (options: CouchStartOptions) => {
    let questions: CouchQuestion[] = [];
    if (options.source === 'custom') {
      const custom = loadCustomQuizFromStorage();
      if (!custom || custom.length < 5) throw new Error('Quiz personalizado não encontrado ou com menos de 5 perguntas.');
      questions = [...custom].sort(() => Math.random() - 0.5);
    } else {
      const prevCategories = gameState.questions.length > 0
        ? Array.from(new Set(gameState.questions.map(q => q.category).filter(Boolean))) as string[]
        : [];
      const prevDifficulty = gameState.questions.length > 0
        ? (gameState.questions[0]?.difficulty || 'mixed') as Difficulty
        : 'mixed';

      const categoriesChanged = !arraysEqual(prevCategories, options.categories || ['Tudo misturado']);
      const difficultyChanged = prevDifficulty !== (options.difficulty || 'mixed');

      let usedIds = gameState.usedQuestionIds;
      if (categoriesChanged || difficultyChanged) {
        usedIds = new Set();
      }

      questions = await loadQuestionsByCategories(
        options.categories || ['Tudo misturado'],
        options.difficulty || 'mixed',
        options.questionCount || 15,
        usedIds,
      );
    }
    if (questions.length === 0) throw new Error('Nenhuma pergunta encontrada.');

    const firstQ = questions[0];
    let shuffledAlts: string[] | null = null;
    let correctIdx = 0;
    if (firstQ.answerType === 'multiple-choice' && firstQ.alternatives && firstQ.alternatives.length > 0) {
      const { alternatives, correctIndex } = shuffleAlternatives(firstQ);
      shuffledAlts = alternatives;
      correctIdx = correctIndex;
    }

    const usedIds = new Set(questions.map(q => q.id));

    if (process.env.NODE_ENV === 'development') {
      console.log('[CouchGame] starting locally', {
        inputMode: options.inputMode,
        players: options.players.map(p => p.name),
        questionCount: questions.length,
      });
      console.log('[CouchGame transition]', { action: 'START_GAME', from: 'setup', to: 'countdown' });
    }

    setGameState({
      phase: 'countdown',
      players: options.players.map(p => ({ ...p, score: 0, correctCount: 0, wrongCount: 0, totalReactionTime: 0, buzzCount: 0 })),
      questions,
      currentQuestionIndex: 0,
      currentQuestion: firstQ,
      countdownValue: 3,
      currentWinnerId: null,
      selectedAnswer: null,
      resultCorrect: null,
      correctAnswer: null,
      blockedPlayerIds: [],
      roundEvents: [],
      timer: options.answerTimeSeconds || firstQ.timeLimitSeconds || 30,
      answerTimeSeconds: options.answerTimeSeconds || firstQ.timeLimitSeconds || 30,
      isDeviceMobile: gameState.isDeviceMobile,
      inputMode: options.inputMode || 'keyboard',
      usedQuestionIds: usedIds,
      shuffledAlternatives: shuffledAlts,
      correctAlternativeIndex: correctIdx,
    });
  }, [gameState.isDeviceMobile]);

  const advanceCountdown = useCallback(() => {
    setGameState(prev => {
      if (prev.countdownValue === null || prev.countdownValue <= 1) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[CouchGame transition]', { action: 'COUNTDOWN_FINISH', from: prev.phase, to: 'question-visible', question: prev.currentQuestionIndex });
        }
        return { ...prev, countdownValue: null, phase: 'question-visible', timer: prev.answerTimeSeconds };
      }
      return { ...prev, countdownValue: prev.countdownValue - 1 };
    });
  }, []);

  const setPhase = useCallback((phase: CouchPhase) => {
    setGameState(prev => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[CouchGame transition]', { action: 'SET_PHASE', from: prev.phase, to: phase, question: prev.currentQuestionIndex });
      }
      return { ...prev, phase };
    });
  }, []);

  const setTimer = useCallback((timer: number) => {
    setGameState(prev => ({ ...prev, timer }));
  }, []);

  const openBuzzer = useCallback(() => {
    buzzerOpenedAtRef.current = performance.now();
    answerInputArmedRef.current = false;
    setGameState(prev => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[CouchGame transition]', { action: 'OPEN_BUZZER', from: prev.phase, to: 'buzzer-open', question: prev.currentQuestionIndex });
      }
      return {
        ...prev,
        phase: 'buzzer-open',
        currentWinnerId: null,
        selectedAnswer: null,
        resultCorrect: null,
        correctAnswer: null,
      };
    });
  }, []);

  const tickTimer = useCallback(() => {
    setGameState(prev => {
      const timerRuns =
        prev.phase === 'question-visible' ||
        prev.phase === 'buzzer-opening' ||
        prev.phase === 'buzzer-open' ||
        prev.phase === 'player-selected' ||
        (prev.phase === 'wrong' && !prev.correctAnswer);
      if (!timerRuns) return prev;
      const next = prev.timer - 1;
      if (next <= 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[CouchGame transition]', { action: 'TIMEOUT', from: prev.phase, to: 'timeout', question: prev.currentQuestionIndex });
        }
        return {
          ...prev, phase: 'timeout', timer: 0,
          correctAnswer: prev.currentQuestion?.correctAnswer || null,
          roundEvents: [...prev.roundEvents, { type: 'timeout', playerId: '', playerName: 'Sistema', timestamp: Date.now() }],
        };
      }
      return { ...prev, timer: next };
    });
  }, []);

  const assignAnsweringPlayer = useCallback((playerId: string) => {
    answerInputArmedRef.current = false;
    setGameState(prev => {
      if (!prev.currentQuestion) return prev;
      if (prev.timer <= 0) return prev;
      if (prev.blockedPlayerIds.includes(playerId)) return prev;
      const player = prev.players.find(p => p.id === playerId);
      if (!player) return prev;

      if (process.env.NODE_ENV === 'development') {
        console.log('[CouchGame transition]', { action: 'AUTO_ASSIGN_ANSWER', from: prev.phase, to: 'player-selected', player: player.name });
      }

      return {
        ...prev,
        phase: 'player-selected',
        currentWinnerId: player.id,
        selectedAnswer: null,
        resultCorrect: null,
        correctAnswer: null,
        blockedPlayerIds: [...prev.blockedPlayerIds, player.id],
        roundEvents: [...prev.roundEvents, {
          type: 'buzzer',
          playerId: player.id,
          playerName: player.name,
          timestamp: Date.now(),
          reactionTimeMs: 0,
          data: { autoAssigned: true },
        }],
      };
    });
  }, []);

  const handleKeyboardBuzz = useCallback((e: KeyboardEvent) => {
    if (e.repeat) return;
    const target = e.target as HTMLElement | null;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
    const reactionTime = performance.now() - buzzerOpenedAtRef.current;
    answerInputArmedRef.current = false;

    setGameState(prev => {
      if (prev.phase !== 'buzzer-open' || prev.currentWinnerId) return prev;
      const player = prev.players.find(p => p.control.type === 'keyboard' && p.control.key === e.code);
      if (!player || prev.blockedPlayerIds.includes(player.id)) return prev;

      if (process.env.NODE_ENV === 'development') {
        console.log('[CouchGame transition]', { action: 'KEYBOARD_BUZZ', from: prev.phase, to: 'player-selected', player: player.name, reactionMs: Math.round(reactionTime) });
      }
      return {
        ...prev, phase: 'player-selected', currentWinnerId: player.id,
        blockedPlayerIds: [...prev.blockedPlayerIds, player.id],
        roundEvents: [...prev.roundEvents, {
          type: 'buzzer', playerId: player.id, playerName: player.name,
          timestamp: Date.now(), reactionTimeMs: reactionTime,
        }],
        players: prev.players.map(p =>
          p.id === player.id ? { ...p, buzzCount: p.buzzCount + 1, totalReactionTime: p.totalReactionTime + reactionTime } : p
        ),
      };
    });
  }, []);

  const handleTouchBuzz = useCallback((playerId: string) => {
    const reactionTime = performance.now() - buzzerOpenedAtRef.current;
    answerInputArmedRef.current = false;
    setGameState(prev => {
      if (prev.phase !== 'buzzer-open' || prev.currentWinnerId) return prev;
      if (prev.blockedPlayerIds.includes(playerId)) return prev;
      const player = prev.players.find(p => p.id === playerId);
      if (!player) return prev;

      try { navigator.vibrate?.(40); } catch {}

      if (process.env.NODE_ENV === 'development') {
        console.log('[CouchGame transition]', { action: 'TOUCH_BUZZ', from: prev.phase, to: 'player-selected', player: player.name, reactionMs: Math.round(reactionTime) });
      }
      return {
        ...prev, phase: 'player-selected', currentWinnerId: player.id,
        blockedPlayerIds: [...prev.blockedPlayerIds, player.id],
        roundEvents: [...prev.roundEvents, {
          type: 'buzzer', playerId: player.id, playerName: player.name,
          timestamp: Date.now(), reactionTimeMs: reactionTime,
        }],
        players: prev.players.map(p =>
          p.id === player.id ? { ...p, buzzCount: p.buzzCount + 1, totalReactionTime: p.totalReactionTime + reactionTime } : p
        ),
      };
    });
  }, []);

  const submitMCAnswer = useCallback((alternative: string) => {
    if (!answerInputArmedRef.current) return;
    answerInputArmedRef.current = false;
    const current = gameState;
    if (current.currentQuestion?.isOfficial) {
      void validateOfficialQuestionAnswer(current.currentQuestion.id, alternative)
        .then((validation) => {
          setGameState(prev => {
            if (prev.phase !== 'player-selected' || !prev.currentQuestion || !prev.currentWinnerId || prev.timer <= 0) return prev;
            const winner = prev.players.find(p => p.id === prev.currentWinnerId);
            const timeBonus = validation.isCorrect ? Math.max(0, Math.floor(prev.timer * 0.5)) : 0;
            const remainingAfterWrong = prev.players.filter(p => !prev.blockedPlayerIds.includes(p.id));
            const shouldRevealAnswer = validation.isCorrect || remainingAfterWrong.length === 0;
            return {
              ...prev,
              phase: validation.isCorrect ? 'correct' : 'wrong',
              selectedAnswer: alternative,
              resultCorrect: validation.isCorrect,
              correctAnswer: shouldRevealAnswer ? validation.correctAnswer : null,
              timer: shouldRevealAnswer ? 0 : prev.timer,
              players: prev.players.map(p => {
                if (p.id !== prev.currentWinnerId) return p;
                return { ...p, score: p.score + (validation.isCorrect ? 1 + timeBonus : 0), correctCount: p.correctCount + (validation.isCorrect ? 1 : 0), wrongCount: p.wrongCount + (validation.isCorrect ? 0 : 1) };
              }),
              roundEvents: [...prev.roundEvents, {
                type: validation.isCorrect ? 'correct' : 'wrong', playerId: prev.currentWinnerId,
                playerName: winner?.name || '', timestamp: Date.now(), data: { answer: alternative, isCorrect: validation.isCorrect },
              }],
            };
          });
        })
        .catch(() => {
          setGameState(prev => ({ ...prev, phase: 'wrong', selectedAnswer: alternative, resultCorrect: false, timer: 0 }));
        });
      return;
    }

    setGameState(prev => {
      if (prev.phase !== 'player-selected' || !prev.currentQuestion || !prev.currentWinnerId || prev.timer <= 0) return prev;
      const isCorrect = alternative === prev.currentQuestion.correctAnswer;
      const winner = prev.players.find(p => p.id === prev.currentWinnerId);
      const timeBonus = isCorrect ? Math.max(0, Math.floor(prev.timer * 0.5)) : 0;
      const remainingAfterWrong = prev.players.filter(p => !prev.blockedPlayerIds.includes(p.id));
      const shouldRevealAnswer = isCorrect || remainingAfterWrong.length === 0;
      if (process.env.NODE_ENV === 'development') {
        console.log('[CouchGame transition]', { action: 'MC_ANSWER', from: prev.phase, to: isCorrect ? 'correct' : 'wrong', player: winner?.name, answer: alternative });
      }
      return {
        ...prev, phase: isCorrect ? 'correct' : 'wrong', selectedAnswer: alternative,
        resultCorrect: isCorrect, correctAnswer: shouldRevealAnswer ? (prev.currentQuestion.correctAnswer || null) : null,
        timer: shouldRevealAnswer ? 0 : prev.timer,
        players: prev.players.map(p => {
          if (p.id !== prev.currentWinnerId) return p;
          return { ...p, score: p.score + (isCorrect ? 1 + timeBonus : 0), correctCount: p.correctCount + (isCorrect ? 1 : 0), wrongCount: p.wrongCount + (isCorrect ? 0 : 1) };
        }),
        roundEvents: [...prev.roundEvents, {
          type: isCorrect ? 'correct' : 'wrong', playerId: prev.currentWinnerId,
          playerName: winner?.name || '', timestamp: Date.now(), data: { answer: alternative, isCorrect },
        }],
      };
    });
  }, [gameState]);

  const submitWrittenAnswer = useCallback((answer: string) => {
    setGameState(prev => {
      if (prev.phase !== 'player-selected' || !prev.currentQuestion || !prev.currentWinnerId || prev.timer <= 0) return prev;
      const q = prev.currentQuestion;
      const validation = validateWrittenAnswer(answer, q.correctAnswer || '', q.acceptedAnswers, q.strictness);
      const winner = prev.players.find(p => p.id === prev.currentWinnerId);
      const timeBonus = validation.isCorrect ? Math.max(0, Math.floor(prev.timer * 0.5)) : 0;
      const remainingAfterWrong = prev.players.filter(p => !prev.blockedPlayerIds.includes(p.id));
      const shouldRevealAnswer = validation.isCorrect || remainingAfterWrong.length === 0;
      return {
        ...prev, phase: validation.isCorrect ? 'correct' : 'wrong', selectedAnswer: answer,
        resultCorrect: validation.isCorrect, correctAnswer: shouldRevealAnswer ? (q.correctAnswer || null) : null,
        timer: shouldRevealAnswer ? 0 : prev.timer,
        players: prev.players.map(p => {
          if (p.id !== prev.currentWinnerId) return p;
          return { ...p, score: p.score + (validation.isCorrect ? 1 + timeBonus : 0), correctCount: p.correctCount + (validation.isCorrect ? 1 : 0), wrongCount: p.wrongCount + (validation.isCorrect ? 0 : 1) };
        }),
        roundEvents: [...prev.roundEvents, {
          type: validation.isCorrect ? 'correct' : 'wrong', playerId: prev.currentWinnerId,
          playerName: winner?.name || '', timestamp: Date.now(), data: { answer, isCorrect: validation.isCorrect },
        }],
      };
    });
  }, []);

  const judgeSpokenAnswer = useCallback((isCorrect: boolean) => {
    setGameState(prev => {
      if (prev.phase !== 'player-selected' || !prev.currentQuestion || !prev.currentWinnerId || prev.timer <= 0) return prev;
      const winner = prev.players.find(p => p.id === prev.currentWinnerId);
      const remainingAfterWrong = prev.players.filter(p => !prev.blockedPlayerIds.includes(p.id));
      const shouldRevealAnswer = isCorrect || remainingAfterWrong.length === 0;
      return {
        ...prev, phase: isCorrect ? 'correct' : 'wrong', resultCorrect: isCorrect,
        correctAnswer: shouldRevealAnswer ? (prev.currentQuestion!.correctAnswer || null) : null,
        timer: shouldRevealAnswer ? 0 : prev.timer,
        players: prev.players.map(p => {
          if (p.id !== prev.currentWinnerId) return p;
          return { ...p, score: p.score + (isCorrect ? 1 : 0), correctCount: p.correctCount + (isCorrect ? 1 : 0), wrongCount: p.wrongCount + (isCorrect ? 0 : 1) };
        }),
        roundEvents: [...prev.roundEvents, {
          type: isCorrect ? 'correct' : 'wrong', playerId: prev.currentWinnerId,
          playerName: winner?.name || '', timestamp: Date.now(), data: { isCorrect },
        }],
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setGameState(prev => {
      const nextIdx = prev.currentQuestionIndex + 1;
      if (nextIdx >= prev.questions.length) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[CouchGame transition]', { action: 'GAME_FINISHED', from: prev.phase, to: 'game-finished', question: prev.currentQuestionIndex });
        }
        return { ...prev, phase: 'game-finished', currentQuestion: null, shuffledAlternatives: null };
      }
      const nextQ = prev.questions[nextIdx];
      let shuffledAlts: string[] | null = null;
      let correctIdx = 0;
      if (nextQ.answerType === 'multiple-choice' && nextQ.alternatives && nextQ.alternatives.length > 0) {
        const { alternatives, correctIndex } = shuffleAlternatives(nextQ);
        shuffledAlts = alternatives;
        correctIdx = correctIndex;
      }
      if (process.env.NODE_ENV === 'development') {
        console.log('[CouchGame transition]', { action: 'NEXT_QUESTION', from: prev.phase, to: 'question-visible', question: nextIdx });
      }
      return {
        ...prev, phase: 'question-visible', currentQuestionIndex: nextIdx,
        currentQuestion: nextQ, currentWinnerId: null,
        selectedAnswer: null, resultCorrect: null, correctAnswer: null,
        blockedPlayerIds: [], roundEvents: [],
        timer: prev.answerTimeSeconds,
        shuffledAlternatives: shuffledAlts,
        correctAlternativeIndex: correctIdx,
      };
    });
  }, []);

  const rematch = useCallback(() => {
    setGameState(prev => {
      const reshuffled = [...prev.questions].sort(() => Math.random() - 0.5);
      const firstQ = reshuffled[0];
      let shuffledAlts: string[] | null = null;
      let correctIdx = 0;
      if (firstQ.answerType === 'multiple-choice' && firstQ.alternatives && firstQ.alternatives.length > 0) {
        const { alternatives, correctIndex } = shuffleAlternatives(firstQ);
        shuffledAlts = alternatives;
        correctIdx = correctIndex;
      }
      return {
        ...prev, phase: 'countdown',
        questions: reshuffled,
        currentQuestionIndex: 0, currentQuestion: firstQ,
        countdownValue: 3, currentWinnerId: null, selectedAnswer: null,
        resultCorrect: null, correctAnswer: null, blockedPlayerIds: [], roundEvents: [],
        players: prev.players.map(p => ({
          ...p, score: 0, correctCount: 0, wrongCount: 0, totalReactionTime: 0, buzzCount: 0,
        })),
        usedQuestionIds: prev.usedQuestionIds,
        shuffledAlternatives: shuffledAlts,
        correctAlternativeIndex: correctIdx,
      };
    });
  }, []);

  const goToSetup = useCallback(() => {
    removeKeyboardListener();
    setGameState(prev => ({
      ...prev, phase: 'setup', questions: [], currentQuestionIndex: 0, currentQuestion: null,
      currentWinnerId: null, selectedAnswer: null, resultCorrect: null, correctAnswer: null,
      blockedPlayerIds: [], roundEvents: [],
      players: prev.players.map(p => ({
        ...p, score: 0, correctCount: 0, wrongCount: 0, totalReactionTime: 0, buzzCount: 0,
      })),
      shuffledAlternatives: null,
      correctAlternativeIndex: 0,
    }));
  }, [removeKeyboardListener]);

  return {
    gameState, buzzerOpenedAtRef, answerInputArmedRef, detectMobile, startGame, advanceCountdown,
    setPhase, setTimer, openBuzzer, tickTimer, handleKeyboardBuzz, handleTouchBuzz,
    assignAnsweringPlayer, addKeyboardListener, removeKeyboardListener, submitMCAnswer, submitWrittenAnswer,
    judgeSpokenAnswer, nextQuestion, rematch, goToSetup,
  };
}
