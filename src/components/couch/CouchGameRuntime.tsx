'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useCouchGame, CouchPhase, CouchStartOptions } from '@/hooks/useCouchGame';
import { clampReactionTime, formatReactionTime } from '@/lib/reaction-time';
import { CouchSetup } from '@/components/couch/CouchSetup';
import { CouchTouchZones } from '@/components/couch/CouchTouchZones';
import { CouchResults } from '@/components/couch/CouchResults';
import { GameHeader } from '@/components/partida1/GameHeader';
import { MobileScoreBar } from '@/components/partida1/MobileScoreBar';
import { RoundPanel } from '@/components/partida1/RoundPanel';
import { StartCountdown } from '@/components/StartCountdown';
import { reportOfficialQuestionProblem } from '@/lib/couchQuestions';

const WORD_REVEAL_INTERVAL = 170;
const BUZZER_OPENING_DELAY = 700;
const RESULT_DISPLAY_MS = 2500;
const BUZZER_OPEN_FALLBACK_MS = 3000;

const KEY_LABELS: Record<string, string> = {
  KeyA: 'A', KeyL: 'L', KeyQ: 'Q', KeyP: 'P',
  KeyZ: 'Z', KeyM: 'M', Space: 'ESPAÇO', Enter: 'ENTER',
};
const REPORT_REASONS = ['resposta incorreta', 'pergunta ambígua', 'erro de português', 'pergunta repetida', 'outro'];

interface RoundView {
  headline: string;
  buzzerLabel: string;
  buzzerEnabled: boolean;
  roundPanelPhase: 'waiting' | 'prepare' | 'ready' | 'won' | 'correct' | 'wrong' | 'timeout' | 'next';
}

interface CouchGameRuntimeProps {
  autoStart?: boolean;
  initialOptions?: CouchStartOptions | null;
  onMissingConfig?: () => void;
  onProgressChange?: (hasProgress: boolean) => void;
  onExit?: () => void;
}

function getCouchRoundView(
  phase: CouchPhase,
  inputMode: 'keyboard' | 'touch-zones',
  winnerName?: string,
): RoundView {
  switch (phase) {
    case 'question-visible':
      return {
        headline: '',
        buzzerLabel: 'AGUARDE',
        buzzerEnabled: false,
        roundPanelPhase: 'waiting',
      };
    case 'buzzer-opening':
      return {
        headline: 'PREPARE-SE!',
        buzzerLabel: 'AGUARDE',
        buzzerEnabled: false,
        roundPanelPhase: 'prepare',
      };
    case 'buzzer-open':
      return {
        headline: inputMode === 'keyboard' ? 'VALENDO! Apertem suas teclas!' : 'VALENDO! Toquem!',
        buzzerLabel: 'APERTE!',
        buzzerEnabled: true,
        roundPanelPhase: 'ready',
      };
    case 'player-selected':
      return {
        headline: '',
        buzzerLabel: winnerName || '...',
        buzzerEnabled: false,
        roundPanelPhase: 'won',
      };
    case 'correct':
      return {
        headline: 'Correto!',
        buzzerLabel: '',
        buzzerEnabled: false,
        roundPanelPhase: 'correct',
      };
    case 'wrong':
      return {
        headline: 'Errado!',
        buzzerLabel: '',
        buzzerEnabled: false,
        roundPanelPhase: 'wrong',
      };
    case 'timeout':
      return {
        headline: 'Tempo esgotado!',
        buzzerLabel: '',
        buzzerEnabled: false,
        roundPanelPhase: 'timeout',
      };
    default:
      return {
        headline: '',
        buzzerLabel: '',
        buzzerEnabled: false,
        roundPanelPhase: 'waiting',
      };
  }
}

export function CouchGameRuntime({
  autoStart = false,
  initialOptions = null,
  onMissingConfig,
  onProgressChange,
  onExit,
}: CouchGameRuntimeProps = {}) {
  const hook = useCouchGame();
  const { gameState } = hook;
  const {
    phase, players, currentQuestion, currentQuestionIndex, currentWinnerId,
    timer, countdownValue, selectedAnswer, resultCorrect, correctAnswer,
    roundEvents, questions, inputMode,
  } = gameState;

  const [soundOn, setSoundOn] = useState(true);
  const [writtenInput, setWrittenInput] = useState('');
  const [revealedWordCount, setRevealedWordCount] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSentQuestionId, setReportSentQuestionId] = useState<string | null>(null);

  const revealIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoStartRef = useRef(false);

  const gameStateRef = useRef(gameState);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  useEffect(() => {
    hook.detectMobile();
    return () => {
      if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!autoStart || autoStartRef.current) return;
    if (!initialOptions) {
      onMissingConfig?.();
      return;
    }

    autoStartRef.current = true;
    void hook.startGame(initialOptions).catch(() => {
      autoStartRef.current = false;
      onMissingConfig?.();
    });
  }, [autoStart, initialOptions, onMissingConfig, hook.startGame]);

  useEffect(() => {
    hook.answerInputArmedRef.current = false;
  }, [phase, currentWinnerId, hook.answerInputArmedRef]);

  useEffect(() => {
    const hasProgress = phase !== 'setup' && (
      currentQuestionIndex > 0 ||
      players.some(player => player.score > 0 || player.buzzCount > 0 || player.correctCount > 0 || player.wrongCount > 0)
    );
    onProgressChange?.(hasProgress);
  }, [phase, currentQuestionIndex, players, onProgressChange]);

  // ─── COUNTDOWN ───
  useEffect(() => {
    if (phase !== 'countdown' || countdownValue === null) return;
    countdownTimerRef.current = setTimeout(() => hook.advanceCountdown(), 1000);
    return () => { if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current); };
  }, [phase, countdownValue]);

  // ─── WORD REVEAL ───
  useEffect(() => {
    if (phase !== 'question-visible' || !currentQuestion) return;

    setRevealedWordCount(0);
    setWrittenInput('');
    if (revealIntervalRef.current) { clearInterval(revealIntervalRef.current); revealIntervalRef.current = null; }

    const words = currentQuestion.text.split(/\s+/);
    const totalWords = words.length;
    const revealDuration = Math.min(totalWords * WORD_REVEAL_INTERVAL, 4500);
    const interval = revealDuration / totalWords;
    let wordIdx = 0;

    revealIntervalRef.current = setInterval(() => {
      wordIdx++;
      setRevealedWordCount(wordIdx);
      if (wordIdx >= totalWords && revealIntervalRef.current) {
        clearInterval(revealIntervalRef.current);
        revealIntervalRef.current = null;
      }
    }, interval);

    return () => {
      if (revealIntervalRef.current) { clearInterval(revealIntervalRef.current); revealIntervalRef.current = null; }
    };
  }, [phase, currentQuestionIndex]);

  // ─── AFTER REVEAL: 400ms → buzzer-opening ───
  useEffect(() => {
    if (phase !== 'question-visible') return;
    if (!currentQuestion) return;
    const totalWords = currentQuestion.text.split(/\s+/).length;
    if (revealedWordCount < totalWords) return;

    const prepareTimer = setTimeout(() => {
      hook.setPhase('buzzer-opening');
    }, 400);

    return () => clearTimeout(prepareTimer);
  }, [revealedWordCount, phase, currentQuestionIndex]);

  // ─── BUZZER-OPENING: 700ms → buzzer-open ───
  useEffect(() => {
    if (phase !== 'buzzer-opening') return;

    let opened = false;
    const buzzerTimer = setTimeout(() => {
      if (!opened) { opened = true; hook.openBuzzer(); }
    }, BUZZER_OPENING_DELAY);

    const fallbackTimer = setTimeout(() => {
      if (!opened) { opened = true; hook.openBuzzer(); }
    }, BUZZER_OPEN_FALLBACK_MS);

    return () => {
      clearTimeout(buzzerTimer);
      clearTimeout(fallbackTimer);
    };
  }, [phase]);

  // ─── TICK TIMER ───
  useEffect(() => {
    const timerRuns =
      phase === 'question-visible' ||
      phase === 'buzzer-opening' ||
      phase === 'buzzer-open' ||
      phase === 'player-selected' ||
      (phase === 'wrong' && !correctAnswer);
    if (!timerRuns) return;
    tickIntervalRef.current = setInterval(() => hook.tickTimer(), 1000);
    return () => { if (tickIntervalRef.current) clearInterval(tickIntervalRef.current); };
  }, [phase, correctAnswer]);

  // ─── KEYBOARD BUZZ ───
  useEffect(() => {
    if (inputMode === 'touch-zones') return;
    function handleKeyDown(event: KeyboardEvent) {
      const current = gameStateRef.current;
      if (event.repeat) return;
      if (current.phase !== 'buzzer-open') return;
      if (current.currentWinnerId) return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      const player = current.players.find(p => p.control.type === 'keyboard' && p.control.key === event.code);
      if (!player) return;
      hook.handleTouchBuzz(player.id);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputMode]);

  // ─── RESULT AUTO-ADVANCE ───
  useEffect(() => {
    if (phase !== 'correct' && phase !== 'wrong' && phase !== 'timeout') return;
    resultTimerRef.current = setTimeout(() => {
      if (gameStateRef.current.phase !== phase) return;
      if (phase === 'wrong') {
        const remaining = gameStateRef.current.players.filter(p => !gameStateRef.current.blockedPlayerIds.includes(p.id));
        if (remaining.length === 1) {
          hook.assignAnsweringPlayer(remaining[0].id);
          return;
        }
        if (remaining.length > 1) {
          hook.setPhase('buzzer-opening');
          return;
        }
      }
      hook.nextQuestion();
    }, RESULT_DISPLAY_MS);
    return () => { if (resultTimerRef.current) clearTimeout(resultTimerRef.current); };
  }, [phase, currentQuestionIndex]);

  // ─── HANDLERS ───
  const handleBuzzFromZones = useCallback((playerId: string) => {
    hook.handleTouchBuzz(playerId);
  }, [hook.handleTouchBuzz]);

  const handleJudge = useCallback((isCorrect: boolean) => {
    hook.judgeSpokenAnswer(isCorrect);
  }, [hook.judgeSpokenAnswer]);

  const handleWrittenSubmit = useCallback(() => {
    if (writtenInput.trim()) {
      hook.submitWrittenAnswer(writtenInput.trim());
      setWrittenInput('');
    }
  }, [writtenInput, hook.submitWrittenAnswer]);

  const handleReportProblem = useCallback((reason: string) => {
    if (!currentQuestion) return;
    void reportOfficialQuestionProblem({
      questionId: currentQuestion.id,
      reason,
      mode: 'couch',
      category: currentQuestion.category,
      difficulty: currentQuestion.difficulty,
    });
    setReportOpen(false);
    setReportSentQuestionId(currentQuestion.id);
  }, [currentQuestion]);

  // ─── DERIVED VIEW MODEL (single source of truth) ───
  const winner = currentWinnerId ? players.find(p => p.id === currentWinnerId) : null;
  const winnerEvent = currentWinnerId ? roundEvents.find(e => e.type === 'buzzer' && e.playerId === currentWinnerId) : null;
  const isAutoAssignedWinner = !!winnerEvent?.data?.autoAssigned;
  const roundView = getCouchRoundView(phase, inputMode, winner?.name);

  const totalWords = currentQuestion ? currentQuestion.text.split(/\s+/).length : 0;
  const displayText = currentQuestion
    ? (phase === 'question-visible' || phase === 'buzzer-opening')
      ? currentQuestion.text.split(/\s+/).slice(0, revealedWordCount).join(' ')
      : currentQuestion.text
    : '';

  const scoresForPanel = players.map(p => ({
    id: p.id, name: p.name, score: p.score,
    isCurrent: p.id === currentWinnerId, isLeader: false, justScored: false,
  }));

  const showGame = phase !== 'setup' && phase !== 'countdown' && phase !== 'game-finished';
  const hasProgress = phase !== 'setup' && (
    currentQuestionIndex > 0 ||
    players.some(player => player.score > 0 || player.buzzCount > 0 || player.correctCount > 0 || player.wrongCount > 0)
  );
  const isTouchBuzzerPhase = inputMode === 'touch-zones' && (phase === 'buzzer-open' || phase === 'buzzer-opening');
  const shouldRevealCorrectAnswer = phase === 'correct' || phase === 'timeout' || (phase === 'wrong' && !!correctAnswer);

  return (
    <div className={phase === 'setup' ? 'w-full' : `${autoStart ? 'h-full min-h-0' : 'min-h-screen min-h-[100dvh]'} w-full overflow-x-hidden bg-gradient-to-br from-[#0c1929] via-[#0f2744] to-[#0a1628] sm:rounded-2xl`}>
      {phase === 'setup' && !autoStart && (
        <CouchSetup isMobile={inputMode === 'touch-zones'} onStart={(opts) => hook.startGame(opts)} />
      )}

      {phase === 'setup' && autoStart && (
        <div className="min-h-[60vh] grid place-items-center px-4">
          <div className="bg-white/95 border-2 border-black/15 rounded-2xl p-6 text-center shadow-xl">
            <div className="mx-auto mb-3 h-8 w-8 rounded-full border-4 border-[#3B82F6] border-t-transparent animate-spin" />
            <p className="text-sm font-semibold text-[#0F172A]">Preparando partida local...</p>
          </div>
        </div>
      )}

      {phase === 'countdown' && countdownValue !== null && (
        <StartCountdown count={countdownValue} />
      )}

      {showGame && (
        <div className={`${autoStart ? 'h-full min-h-0' : 'min-h-screen min-h-[100dvh]'} flex flex-col overflow-x-hidden`}>
          <GameHeader
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            category={currentQuestion?.category || ''}
            timer={timer}
            soundOn={soundOn}
            compact={autoStart}
            confirmLeaveOnExit={hasProgress}
            leaveDescription="A partida local será encerrada e você voltará para a configuração."
            onToggleSound={() => setSoundOn(!soundOn)}
            onLeave={onExit}
          />

          {inputMode === 'touch-zones' && !isTouchBuzzerPhase && (
            <MobileScoreBar players={scoresForPanel} />
          )}

          <div className={`${isTouchBuzzerPhase ? 'min-h-0 overflow-hidden' : 'overflow-y-auto'} flex-1 flex flex-col lg:flex-row max-w-[1500px] mx-auto w-full px-2 sm:px-4 gap-2 sm:gap-4 py-2 sm:py-4`}>
            {/* Desktop left: scoreboard with key badges */}
            {inputMode === 'keyboard' && (
              <div className="hidden lg:block lg:w-72 shrink-0">
                <div className="bg-white/90 backdrop-blur-sm border-2 border-black/15 rounded-2xl overflow-hidden shadow-lg">
                  <div className="p-3 border-b border-[#CBD5E1]/40">
                    <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Placar</h2>
                  </div>
                  <div className="p-2 space-y-1">
                    {players.map((p, idx) => (
                      <div key={p.id} className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${
                        p.id === currentWinnerId ? 'bg-[#3B82F6]/10 ring-1 ring-[#3B82F6]/30' : ''
                      }`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-[11px] font-bold text-[#94A3B8] w-5">{idx + 1}.</span>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: p.control.color }}>
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[#0F172A] truncate">{p.name}</div>
                            {p.control.type === 'keyboard' && p.control.key && (
                              <div className="text-[10px] text-[#64748B]">Tecla: {KEY_LABELS[p.control.key] || p.control.key}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {p.control.type === 'keyboard' && p.control.key && (
                            <kbd className="inline-flex items-center justify-center min-w-[36px] h-8 px-2 bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-xs font-bold text-[#0F172A] shadow-[0_2px_0_#CBD5E1]">
                              {KEY_LABELS[p.control.key] || p.control.key}
                            </kbd>
                          )}
                          <span className="text-sm font-bold text-[#0F172A] w-8 text-right">{p.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Center: question + controls */}
            <div className={`${isTouchBuzzerPhase ? 'min-h-0' : ''} flex-1 flex flex-col items-center gap-2 sm:gap-4 min-w-0 w-full`}>
              {/* Question card */}
              {currentQuestion && (
                <div className="w-full max-w-[860px] bg-white/95 backdrop-blur-sm border-2 border-black/15 rounded-2xl p-4 sm:p-8 text-center shadow-xl shrink-0">
                  <div className="flex items-center justify-center gap-2 mb-2 sm:mb-4">
                    <span className="text-xs font-semibold text-[#3B82F6] bg-[#3B82F6]/10 px-3 py-1 rounded-full">
                      {currentQuestion.category}
                    </span>
                    {currentQuestion.answerType === 'spoken' && (
                      <span className="text-[11px] text-[#64748B] bg-[#F8FAFC] border border-[#CBD5E1] px-2 py-1 rounded-full">Falada</span>
                    )}
                    {currentQuestion.answerType === 'written' && (
                      <span className="text-[11px] text-[#64748B] bg-[#F8FAFC] border border-[#CBD5E1] px-2 py-1 rounded-full">Escrita</span>
                    )}
                  </div>
                  <h2 className="font-bold text-[#0F172A] leading-snug" style={{ fontSize: 'clamp(20px, 2.5vw, 34px)' }}>
                    {displayText}
                    {(phase === 'question-visible' || phase === 'buzzer-opening') && revealedWordCount < totalWords && (
                      <span className="inline-block w-0.5 h-[1em] bg-[#3B82F6] ml-1 animate-pulse align-middle" />
                    )}
                  </h2>
                  {currentQuestion.isOfficial && (
                    <div className="mt-2 sm:mt-4 flex flex-col items-center gap-1.5 sm:gap-2">
                      {reportSentQuestionId === currentQuestion.id ? (
                        <span className="text-xs font-semibold text-[#16A34A]">Relatório registrado</span>
                      ) : (
                        <button type="button" onClick={() => setReportOpen(open => !open)}
                          className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A]">
                          Reportar problema
                        </button>
                      )}
                      {reportOpen && (
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {REPORT_REASONS.map(reason => (
                            <button key={reason} type="button" onClick={() => handleReportProblem(reason)}
                              className="rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-2 py-1 text-[11px] font-semibold text-[#64748B] hover:bg-[#F1F5F9]">
                              {reason}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Status headline — ALL derived from roundView.headline */}
              <div className="text-center min-h-[28px]">
                {phase === 'question-visible' && revealedWordCount < totalWords && (
                  <p className="text-sm text-white/40 font-medium">Leia a pergunta...</p>
                )}
                {roundView.headline && phase !== 'question-visible' && (
                  <p className={`text-base font-bold animate-pulse ${
                    phase === 'buzzer-opening' ? 'text-[#F59E0B]' :
                    phase === 'buzzer-open' ? 'text-[#22C55E]' :
                    'text-white'
                  }`}>{roundView.headline}</p>
                )}
                {phase === 'player-selected' && winner && (
                  <div className="space-y-1">
                    <p className="text-base font-bold text-white">
                      {isAutoAssignedWinner ? `${winner.name} responde agora` : `${winner.name} apertou primeiro!`}
                    </p>
                    {winner.control.type === 'keyboard' && winner.control.key && (
                      <p className="text-sm text-white/60">
                        Tecla: <kbd className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 bg-white/10 border border-white/20 rounded text-xs font-bold text-white/80 mx-1">{KEY_LABELS[winner.control.key] || winner.control.key}</kbd>
                      </p>
                    )}
                    {!isAutoAssignedWinner && winnerEvent?.reactionTimeMs != null && (
                      <p className="text-xs text-white/40">
                        {formatReactionTime(clampReactionTime(winnerEvent.reactionTimeMs))}
                      </p>
                    )}
                  </div>
                )}
                {phase === 'correct' && correctAnswer && (
                  <p className="text-sm text-white/60">Resposta: {correctAnswer}</p>
                )}
                {phase === 'wrong' && !correctAnswer && winner && (
                  <p className="text-sm text-white/60">{winner.name} errou. Valendo novamente em instantes.</p>
                )}
                {phase === 'wrong' && correctAnswer && (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">Ninguém acertou.</p>
                    <p className="text-sm text-white/60">Resposta: {correctAnswer}</p>
                  </div>
                )}
                {phase === 'timeout' && correctAnswer && (
                  <p className="text-sm text-white/60">Resposta: {correctAnswer}</p>
                )}
              </div>

              {/* Buzzer circle — label from roundView.buzzerLabel */}
              {inputMode === 'keyboard' && (phase === 'question-visible' || phase === 'buzzer-opening' || phase === 'buzzer-open' || phase === 'player-selected') && (
                <div className="relative">
                  <div className={`w-[180px] h-[180px] lg:w-[210px] lg:h-[210px] rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
                    phase === 'buzzer-open'
                      ? 'bg-gradient-to-b from-[#22C55E] to-[#16A34A] shadow-[0_0_40px_rgba(34,197,94,0.5)] scale-105 animate-pulse'
                      : phase === 'player-selected'
                        ? 'bg-gradient-to-b from-[#3B82F6] to-[#2563EB] shadow-[0_0_30px_rgba(59,130,246,0.4)]'
                        : 'bg-gradient-to-b from-[#475569] to-[#334155] shadow-lg opacity-60'
                  }`}>
                    <span className="text-white text-lg lg:text-xl font-bold">
                      {roundView.buzzerLabel}
                    </span>
                  </div>
                </div>
              )}

              {/* Desktop keyboard control hints */}
              {inputMode === 'keyboard' && phase === 'buzzer-open' && (
                <div className="flex items-center gap-6 mt-2">
                  {players.filter(p => p.control.type === 'keyboard').map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <kbd className="inline-flex items-center justify-center min-w-[40px] h-10 px-2 bg-white/10 border border-white/20 rounded-lg text-sm font-bold text-white/80 shadow-[0_2px_0_rgba(255,255,255,0.1)]">
                        {KEY_LABELS[p.control.key || ''] || '?'}
                      </kbd>
                      <span className="text-sm text-white/60">{p.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Mobile touch zones */}
              {isTouchBuzzerPhase && (
                <div className="w-full flex-1 min-h-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]" style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}>
                  <CouchTouchZones
                    players={players.filter(player => !gameState.blockedPlayerIds.includes(player.id))}
                    onPress={handleBuzzFromZones}
                    disabled={phase !== 'buzzer-open'}
                    winnerId={currentWinnerId}
                  />
                </div>
              )}

              {/* Alternatives (MC) */}
              {gameState.shuffledAlternatives && gameState.shuffledAlternatives.length > 0 && (
                phase === 'player-selected' || phase === 'correct' || phase === 'wrong' || phase === 'timeout'
              ) && (
                <div className="w-full max-w-[760px] space-y-2">
                  {phase === 'player-selected' && winner && (
                    <p className="text-sm text-center font-bold text-[#3B82F6]">{winner.name} responde agora</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {gameState.shuffledAlternatives.map((alt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isSelected = selectedAnswer === alt;
                      const isCorrectAlt = alt === correctAnswer;
                      const showResult = shouldRevealCorrectAnswer;
                      const showWrongFeedback = phase === 'wrong' && !correctAnswer;
                      return (
                        <button key={idx} type="button"
                          disabled={phase !== 'player-selected'}
                          onPointerDown={(event) => {
                            event.stopPropagation();
                            if (phase === 'player-selected') hook.answerInputArmedRef.current = true;
                          }}
                          onKeyDown={(event) => {
                            if (phase === 'player-selected' && (event.key === 'Enter' || event.key === ' ')) {
                              hook.answerInputArmedRef.current = true;
                            }
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            hook.submitMCAnswer(alt);
                          }}
                          className={`flex items-center gap-3 p-4 sm:p-5 rounded-xl border-2 text-left transition-all min-h-[60px] sm:min-h-[72px] cursor-pointer disabled:cursor-default ${
                            showResult && isCorrectAlt
                              ? 'bg-[#22C55E]/10 border-[#22C55E] text-[#0F172A]'
                              : (showResult || showWrongFeedback) && isSelected && !isCorrectAlt
                                ? 'bg-[#EF4444]/10 border-[#EF4444] text-[#0F172A]'
                                : 'bg-white border-[#CBD5E1] text-[#0F172A]'
                          }`}>
                          <span className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-sm font-bold text-[#64748B] shrink-0">
                            {letter}
                          </span>
                          <span className="text-base sm:text-lg font-medium">{alt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Written answer input */}
              {phase === 'player-selected' && currentQuestion?.answerType === 'written' && (
                <div className="w-full max-w-[760px] flex gap-2">
                  <input type="text" value={writtenInput}
                    onChange={e => setWrittenInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleWrittenSubmit(); }}
                    placeholder="Digite sua resposta..."
                    autoFocus
                    className="flex-1 bg-white/[0.07] backdrop-blur-xl border border-white/[0.15] rounded-xl px-5 py-4 text-white placeholder-white/30 outline-none focus:border-[#3B82F6]/50 text-base" />
                  <button type="button" onClick={handleWrittenSubmit}
                    className="px-8 py-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-base rounded-xl transition-all cursor-pointer">
                    Enviar
                  </button>
                </div>
              )}

              {/* Spoken answer judge buttons */}
              {phase === 'player-selected' && currentQuestion?.answerType === 'spoken' && (
                <div className="flex gap-4">
                  <button type="button" onClick={() => handleJudge(true)}
                    className="px-10 py-4 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-base rounded-xl transition-all cursor-pointer">
                    Correto
                  </button>
                  <button type="button" onClick={() => handleJudge(false)}
                    className="px-10 py-4 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-base rounded-xl transition-all cursor-pointer">
                    Errado
                  </button>
                </div>
              )}
            </div>

            {/* Desktop right: round + feed */}
            <div className="hidden lg:block lg:w-60 shrink-0 space-y-3">
              <RoundPanel
                phase={roundView.roundPanelPhase}
                winnerName={winner?.name}
                reactionTime={roundEvents.find(e => e.type === 'buzzer')?.reactionTimeMs}
                questionNumber={currentQuestionIndex}
              />
            </div>
          </div>
        </div>
      )}

      {phase === 'game-finished' && (
        <CouchResults
          players={players}
          onRematch={hook.rematch}
          onChangePlayers={autoStart ? (onExit || hook.goToSetup) : hook.goToSetup}
          onExit={onExit || (() => {})}
        />
      )}
    </div>
  );
}
