'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { GameHeader } from '@/components/partida1/GameHeader';
import { ScoreboardPanel } from '@/components/partida1/ScoreboardPanel';
import { MobileScoreBar } from '@/components/partida1/MobileScoreBar';
import { QuestionTablet } from '@/components/partida1/QuestionTablet';
import { ActivityFeed, FeedEvent } from '@/components/partida1/ActivityFeed';
import { RoundPanel } from '@/components/partida1/RoundPanel';
import { FinalResults } from '@/components/FinalResults';
import { getSocket } from '@/lib/socket';
import { GameState, PlayerData, QuestionData } from '@/lib/types';
import { getSessionData, clearSessionData } from '@/lib/types';
import { getRoomPath, normalizeRoomCode } from '@/lib/room-code';
import { clampReactionTime, formatReactionTime } from '@/lib/reaction-time';
import confetti from 'canvas-confetti';

type GamePhase = 'question' | 'buzzer' | 'you-won' | 'joao-won' | 'choosing' | 'reveal' | 'correct' | 'wrong' | 'timeout' | 'next' | 'finished';
type BuzzerStyle = 'blue' | 'glass' | 'metallic' | 'illuminated' | 'futuristic';

const ALT_LABELS = ['A', 'B', 'C', 'D'];

export default function PartidaPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = Array.isArray(params.codigo) ? params.codigo[0] : params.codigo;
  const code = normalizeRoomCode(rawCode);

  const [gamePhase, setGamePhase] = useState<GamePhase>('question');
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [alternatives, setAlternatives] = useState<string[] | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [scores, setScores] = useState<Array<{ playerId: string; name: string; score: number }>>([]);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [buzzerEnabled, setBuzzerEnabled] = useState(false);
  const [buzzerPressed, setBuzzerPressed] = useState(false);
  const [result, setResult] = useState<{ type: 'correct' | 'wrong' | 'timeout' | 'all_wrong'; correctAnswer?: string; explanation?: string } | null>(null);
  const [answerSecondsRemaining, setAnswerSecondsRemaining] = useState<number | null>(null);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [selectedAlternative, setSelectedAlternative] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [isFinished, setIsFinished] = useState(false);
  const [finalScores, setFinalScores] = useState<Array<{ playerId: string; name: string; score: number }>>([]);
  const [category, setCategory] = useState('');
  const [reactionTime, setReactionTime] = useState<number | undefined>();
  const [soundOn, setSoundOn] = useState(true);
  const [showPlayersPanel, setShowPlayersPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [roomSettingsSummary, setRoomSettingsSummary] = useState('');
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const [questionType, setQuestionType] = useState<'spoken' | 'multiple'>('multiple');
  const [timer, setTimer] = useState(30);
  const feedIdRef = useRef(0);
  const socketRef = useRef(getSocket());

  const addFeedEvent = useCallback((evt: Omit<FeedEvent, 'id'>) => {
    feedIdRef.current += 1;
    setFeedEvents(prev => [...prev, { ...evt, id: String(feedIdRef.current) }]);
  }, []);

  function applyGameState(state: GameState) {
    if (state.status === 'lobby') {
      router.push(getRoomPath(code));
      return;
    }
    setQuestionNumber(state.currentQuestionIndex + 1);
    setTotalQuestions(state.totalQuestions);
    setWinnerId(state.currentBuzzerWinnerId);
    setScores(state.scores || []);

    if (state.currentQuestion) {
      setCurrentQuestion(state.currentQuestion);
      setCategory(state.currentQuestion.category || '');
      setQuestionType(state.currentQuestion.answerType === 'spoken' ? 'spoken' : 'multiple');
    }

    setAlternatives(state.orderedAlternatives ?? null);
    setAnswerSecondsRemaining(state.answerDeadlineAt ? Math.max(0, Math.ceil((state.answerDeadlineAt - Date.now()) / 1000)) : null);

    if (state.status === 'countdown') {
      setGamePhase('question');
      setCountdownValue(3);
      setBuzzerEnabled(false);
      setBuzzerPressed(false);
      setResult(null);
      setSelectedAlternative(null);
      setAlternatives(null);
      setAnswerSecondsRemaining(null);
      setReactionTime(undefined);
      setFeedEvents([]);
    }

    if (state.status === 'question-visible') {
      setGamePhase('question');
      setBuzzerEnabled(false);
      setBuzzerPressed(false);
      setResult(null);
      setSelectedAlternative(null);
      setAlternatives(null);
      setAnswerSecondsRemaining(null);
      setWinnerId(null);
      setWinnerName(null);
      setReactionTime(undefined);
    }

    if (state.status === 'buzzer-open') {
      setGamePhase('buzzer');
      setBuzzerEnabled(true);
      setBuzzerPressed(false);
      setWinnerId(null);
      setWinnerName(null);
      setAlternatives(null);
      setAnswerSecondsRemaining(null);
      setResult(null);
      setSelectedAlternative(null);
      setReactionTime(undefined);
    }

    if (state.status === 'answering') {
      setBuzzerEnabled(false);
      if (state.currentBuzzerWinnerId && state.currentBuzzerWinnerId !== playerId) {
        setGamePhase('choosing');
      }
    }

    if (state.status === 'scoreboard') {
      setGamePhase('next');
    }

    if (state.status === 'game-finished') {
      setIsFinished(true);
      setFinalScores(state.scores || []);
      setGamePhase('finished');
      setTimeout(() => triggerConfetti(), 300);
    }
  }

  function triggerConfetti() {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6'],
      });
    } catch {}
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sock = socketRef.current;

    const onConnect = () => setConnectionStatus('connected');
    const onDisconnect = () => setConnectionStatus('disconnected');
    const onConnectError = () => setConnectionStatus('error');

    sock.on('connect', onConnect);
    sock.on('disconnect', onDisconnect);
    sock.on('connect_error', onConnectError);

    sock.on('game:countdown', (data: { count: number }) => {
      setGamePhase('question');
      setCountdownValue(data.count);
      setBuzzerEnabled(false);
      setBuzzerPressed(false);
      setResult(null);
      setSelectedAlternative(null);
      setReactionTime(undefined);
      setFeedEvents([]);
    });

    sock.on('game:started', (data: { gameState: GameState }) => {
      if (data.gameState) applyGameState(data.gameState);
    });

    sock.on('game:state', (state: GameState) => {
      applyGameState(state);
    });

    sock.on('buzzer:opened', (data: { roundStartedAt: number }) => {
      setGamePhase('buzzer');
      setBuzzerEnabled(true);
      setBuzzerPressed(false);
      setWinnerId(null);
      setWinnerName(null);
      setResult(null);
      setSelectedAlternative(null);
      setReactionTime(undefined);
    });

    sock.on('buzzer:winner', (data: { winnerId: string | null; winnerName: string | null; blockedPlayerId?: string; reactionTime?: number }) => {
      setBuzzerEnabled(false);
      if (data.winnerId) {
        setWinnerId(data.winnerId);
        setWinnerName(data.winnerName);
        if (data.winnerId === playerId) {
          setGamePhase('you-won');
          setBuzzerPressed(true);
          setReactionTime(data.reactionTime);
          addFeedEvent({ type: 'buzzer', playerName: data.winnerName || 'Alguém', detail: data.reactionTime ? formatReactionTime(clampReactionTime(data.reactionTime)) : undefined });
        } else {
          setGamePhase('joao-won');
          addFeedEvent({ type: 'buzzer', playerName: data.winnerName || 'Alguém', detail: data.reactionTime ? formatReactionTime(clampReactionTime(data.reactionTime)) : undefined });
        }
        if (false && currentQuestion?.answerType === 'multiple-choice' && data.winnerId === playerId) {
          setTimeout(() => {
            setGamePhase('choosing');
            addFeedEvent({ type: 'choosing', playerName: data.winnerName || 'Você' });
          }, 1200);
        }
      }
      if (data.blockedPlayerId && data.winnerId === null) {
        setGamePhase('buzzer');
        setBuzzerEnabled(true);
      }
    });

    sock.on('question:for-player', (data: { question: QuestionData | null; alternatives: string[] | null; answerDeadlineAt?: number; attemptId?: number }) => {
      if (data.question) {
        setCurrentQuestion(data.question);
        setCategory(data.question.category || '');
        setQuestionType(data.question.answerType === 'spoken' ? 'spoken' : 'multiple');
      }
      setAlternatives(data.alternatives ?? null);
      setSelectedAlternative(null);
      if (data.answerDeadlineAt) {
        const remaining = Math.max(0, Math.ceil((data.answerDeadlineAt - Date.now()) / 1000));
        setAnswerSecondsRemaining(remaining);
        setTimer(remaining);
      }
      setGamePhase('choosing');
      if (data.alternatives && winnerId === playerId) {
        setGamePhase('choosing');
        addFeedEvent({ type: 'choosing', playerName: playerName || 'VocÃª' });
      } else if (!data.alternatives && winnerId) {
        setGamePhase('choosing');
      }
    });

    sock.on('answer:result', (data: {
      playerId: string | null;
      playerName?: string;
      result: string;
      correctAnswer?: string;
      explanation?: string;
      scores: Array<{ playerId: string; name: string; score: number }>;
      roundContinues?: boolean;
      nextPlayerId?: string;
      nextPlayerName?: string;
      autoTransferred?: boolean;
    }) => {
      setResult({
        type: data.result as any,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
      });
      setAnswerSecondsRemaining(null);
      if (data.scores) setScores(data.scores);
      setBuzzerEnabled(false);

      if (data.result === 'correct') {
        setGamePhase('correct');
        const name = scores.find(s => s.playerId === data.playerId)?.name || 'Jogador';
        addFeedEvent({ type: 'correct', playerName: name });
        if (data.playerId === playerId) triggerConfetti();
      } else if (data.result === 'wrong') {
        setGamePhase('wrong');
        setAlternatives(null);
        setSelectedAlternative(null);
        const name = data.playerName || scores.find(s => s.playerId === data.playerId)?.name || 'Jogador';
        addFeedEvent({ type: 'wrong', playerName: name });
        if (data.autoTransferred && data.nextPlayerName) {
          addFeedEvent({ type: 'choosing', playerName: data.nextPlayerName, detail: 'vez transferida' });
        }
      } else if (data.result === 'timeout') {
        setGamePhase('timeout');
        setAlternatives(null);
        setSelectedAlternative(null);
        addFeedEvent({ type: 'timeout', playerName: data.playerName || 'Sistema' });
      } else if (data.result === 'all_wrong') {
        setGamePhase('timeout');
        addFeedEvent({ type: 'timeout', playerName: 'Todos' });
      }

      if (!data.roundContinues) {
        setTimeout(() => {
          setGamePhase('next');
        }, 3000);
      }
    });

    sock.on('score:updated', (data: { scores: Array<{ playerId: string; name: string; score: number }> }) => {
      setScores(data.scores);
    });

    sock.on('game:finished', (data: { scores: Array<{ playerId: string; name: string; score: number }> }) => {
      setIsFinished(true);
      setFinalScores(data.scores);
      setGamePhase('finished');
      setBuzzerEnabled(false);
      setTimeout(() => triggerConfetti(), 300);
    });

    sock.on('game:rematch', (data: { roomCode: string }) => {
      router.push(getRoomPath(data.roomCode));
    });

    const session = getSessionData();
    if (session) {
      sock.emit('room:reconnect', {
        roomCode: code,
        playerId: session.playerId,
        playerToken: session.playerToken,
      }, (response: any) => {
        if (response.success) {
          setPlayerId(response.playerId);
          const me = response.room?.players?.find((p: PlayerData) => p.id === response.playerId);
          if (me) {
            setPlayerName(me.name);
            setIsHost(me.isHost);
          }
          if (response.room?.settings) {
            setRoomSettingsSummary(`${response.room.settings.questionCount} perguntas, ${response.room.settings.answerTimeSeconds || 15}s por resposta`);
          }
          if (response.gameState) {
            applyGameState(response.gameState);
          }
        } else {
          clearSessionData();
          router.push(getRoomPath(code));
        }
      });
    }

    return () => {
      sock.off('connect', onConnect);
      sock.off('disconnect', onDisconnect);
      sock.off('connect_error', onConnectError);
    };
  }, [code, router, playerId]);

  useEffect(() => {
    if (answerSecondsRemaining === null || answerSecondsRemaining <= 0) return;
    const timerId = setTimeout(() => {
      setAnswerSecondsRemaining(prev => {
        const next = prev === null ? null : Math.max(0, prev - 1);
        if (next !== null) setTimer(next);
        return next;
      });
    }, 1000);
    return () => clearTimeout(timerId);
  }, [answerSecondsRemaining]);

  const handleBuzzerPress = useCallback(() => {
    if (!buzzerEnabled || buzzerPressed) return;
    setBuzzerPressed(true);
    setBuzzerEnabled(false);
    const sock = socketRef.current;
    sock.emit('buzzer:press', { roomCode: code });
  }, [buzzerEnabled, buzzerPressed, code]);

  const handleSelectAlt = useCallback((alt: string) => {
    if (!currentQuestion || selectedAlternative) return;
    setSelectedAlternative(alt);
    const altIndex = alternatives?.indexOf(alt) ?? 0;
    const altLabel = ALT_LABELS[altIndex] || '?';
    addFeedEvent({ type: 'chosen', playerName: playerName || 'Você', altLabel, altText: alt });

    setTimeout(() => {
      setGamePhase('reveal');
    }, 800);

    const sock = socketRef.current;
    sock.emit('answer:submit', {
      roomCode: code,
      questionId: currentQuestion.id,
      selectedAlternative: alt,
    });
  }, [currentQuestion, selectedAlternative, alternatives, code, playerName, addFeedEvent]);

  const handleRematch = useCallback(() => {
    const sock = socketRef.current;
    sock.emit('game:rematch', { roomCode: code }, (response: any) => {
      if (response.success) router.push(getRoomPath(code));
    });
  }, [code, router]);

  const handleLeave = useCallback(() => {
    const sock = socketRef.current;
    sock.emit('room:leave', { roomCode: code }, () => {
      clearSessionData();
      setAlternatives(null);
      setAnswerSecondsRemaining(null);
      setBuzzerEnabled(false);
      setBuzzerPressed(false);
      router.push('/');
    });
  }, [code, router]);

  const handleReportProblem = useCallback((reason: string) => {
    if (!currentQuestion) return;
    socketRef.current.emit('question:report-problem', {
      roomCode: code,
      questionId: currentQuestion.id,
      reason,
    });
  }, [code, currentQuestion]);

  const buzzerState = gamePhase === 'buzzer' ? 'ready' as const
    : gamePhase === 'you-won' ? 'won' as const
    : gamePhase === 'joao-won' ? 'lost' as const
    : 'locked' as const;

  const roundPhase = gamePhase === 'question' ? 'waiting' as const
    : gamePhase === 'buzzer' ? 'ready' as const
    : gamePhase === 'you-won' || gamePhase === 'joao-won' || gamePhase === 'choosing' || gamePhase === 'reveal' ? 'won' as const
    : gamePhase === 'correct' ? 'correct' as const
    : gamePhase === 'wrong' ? 'wrong' as const
    : gamePhase === 'timeout' ? 'timeout' as const
    : gamePhase === 'next' || gamePhase === 'finished' ? 'next' as const
    : 'waiting' as const;

  const winnerNameForTablet = gamePhase === 'you-won' ? (playerName || 'Você')
    : gamePhase === 'joao-won' || gamePhase === 'choosing' || gamePhase === 'reveal' || gamePhase === 'correct' || gamePhase === 'wrong' ? (winnerName || '')
    : undefined;

  const scoresForPanel = scores.map(s => ({
    id: s.playerId,
    name: s.name,
    score: s.score,
    isCurrent: s.playerId === playerId,
    isLeader: false,
    justScored: false,
  }));
  const shouldCenterMobile = gamePhase === 'question' || gamePhase === 'buzzer' || gamePhase === 'you-won' || gamePhase === 'joao-won';

  if (isFinished) {
    return (
      <FinalResults
        scores={finalScores}
        currentPlayerId={playerId}
        isHost={isHost}
        onRematch={handleRematch}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <div className="h-[100dvh] lg:h-screen bg-gradient-to-br from-[#0c1929] via-[#0f2744] to-[#0a1628] flex flex-col overflow-hidden">
      {connectionStatus === 'disconnected' && (
        <div className="bg-amber-500/20 backdrop-blur-sm px-4 py-1 text-[10px] text-amber-400 text-center font-medium">
          Reconectando ao servidor...
        </div>
      )}

      <GameHeader
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        category={category}
        timer={timer}
        soundOn={soundOn}
        onToggleSound={() => setSoundOn(!soundOn)}
        isHost={isHost}
        players={scoresForPanel.map(p => ({ id: p.id, name: p.name, score: p.score }))}
        settingsSummary={roomSettingsSummary}
        onLeave={handleLeave}
        onViewPlayers={() => setShowPlayersPanel(true)}
        onViewSettings={() => setShowSettingsPanel(true)}
      />

      <MobileScoreBar players={scoresForPanel} />

      {/* Countdown overlay */}
      <AnimatePresence>
        {countdownValue !== null && countdownValue > 0 && (
          <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#0c1929] via-[#0f2744] to-[#0a1628] flex items-center justify-center">
            <p className="text-lg font-semibold text-white/70 absolute top-1/3">Preparando...</p>
            <div className="text-9xl font-bold text-white drop-shadow-lg animate-pulse">
              {countdownValue}
            </div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex min-h-0">
        {/* Desktop: left scoreboard */}
        <div className="hidden lg:flex lg:w-64 xl:w-72 flex-col p-3 gap-3 overflow-y-auto">
          <ScoreboardPanel players={scoresForPanel} />
        </div>

        {/* Center: question + tablet */}
        <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
          <div className={`flex-1 flex flex-col items-center px-3 sm:px-4 relative z-20 ${
            shouldCenterMobile
              ? 'justify-center overflow-hidden py-4 lg:py-0'
              : 'justify-start overflow-y-auto pt-3 pb-[max(2rem,env(safe-area-inset-bottom))] lg:justify-center lg:pt-0 lg:pb-0'
          }`}>
            {gamePhase !== 'finished' && currentQuestion && (
              <QuestionTablet
                question={currentQuestion.text}
                category={currentQuestion.category || category}
                mode={questionType}
                phase={gamePhase}
                alternatives={alternatives || undefined}
                selectedAlt={selectedAlternative || undefined}
                correctAnswer={result?.correctAnswer}
                explanation={result?.explanation}
                winnerName={winnerNameForTablet}
                reactionTime={reactionTime}
                answerSecondsRemaining={answerSecondsRemaining}
                buzzerState={buzzerState}
                onBuzzerPress={handleBuzzerPress}
                onSelectAlt={handleSelectAlt}
                onReportProblem={handleReportProblem}
              />
            )}

            {gamePhase === 'question' && !currentQuestion && (
              <div className="flex flex-col items-center gap-4 py-12">
                <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-white animate-spin" />
                <p className="text-white/60 text-sm font-medium">Preparando pergunta...</p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop: right panels */}
        <div className="hidden lg:flex lg:w-56 xl:w-64 flex-col p-3 gap-3 overflow-y-auto">
          <ActivityFeed events={feedEvents} />
          <RoundPanel
            phase={roundPhase}
            winnerName={winnerNameForTablet}
            reactionTime={reactionTime}
            questionNumber={questionNumber}
          />
        </div>
      </div>

      {showPlayersPanel && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowPlayersPanel(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-[#0F172A] mb-3">Jogadores</h2>
            <div className="space-y-2">
              {scoresForPanel.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] px-3 py-2 text-sm">
                  <span className="font-semibold text-[#0F172A]">{p.name}</span>
                  <span className="text-[#64748B]">{p.score} pts</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowPlayersPanel(false)} className="mt-4 w-full rounded-xl bg-[#F1F5F9] py-2.5 text-sm font-semibold text-[#0F172A]">Fechar</button>
          </div>
        </div>
      )}

      {showSettingsPanel && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowSettingsPanel(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-[#0F172A] mb-2">Configurações da sala</h2>
            <p className="text-sm text-[#64748B]">{roomSettingsSummary || 'Configurações sincronizadas pelo servidor.'}</p>
            <button onClick={() => setShowSettingsPanel(false)} className="mt-4 w-full rounded-xl bg-[#F1F5F9] py-2.5 text-sm font-semibold text-[#0F172A]">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
