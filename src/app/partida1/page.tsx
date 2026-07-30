'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { GameHeader } from '@/components/partida1/GameHeader';
import { ScoreboardPanel } from '@/components/partida1/ScoreboardPanel';
import { MobileScoreBar } from '@/components/partida1/MobileScoreBar';
import { QuestionTablet } from '@/components/partida1/QuestionTablet';
import { ActivityFeed, FeedEvent } from '@/components/partida1/ActivityFeed';
import { RoundPanel } from '@/components/partida1/RoundPanel';
import { DevToolbar } from '@/components/partida1/DevToolbar';
import { MobilePreview } from '@/components/partida1/MobilePreview';

type GamePhase = 'question' | 'buzzer' | 'you-won' | 'joao-won' | 'choosing' | 'reveal' | 'correct' | 'wrong' | 'timeout' | 'next' | 'finished';
type BuzzerStyle = 'blue' | 'glass' | 'metallic' | 'illuminated' | 'futuristic';
type QuestionType = 'spoken' | 'multiple';

const QUESTIONS = [
  { text: 'Qual é a capital do Brasil?', category: 'Geografia', correctAnswer: 'Brasília' },
  { text: 'Em que ano o homem pisou na Lua pela primeira vez?', category: 'História', correctAnswer: '1969' },
  { text: 'Qual o maior planeta do sistema solar?', category: 'Ciências', correctAnswer: 'Júpiter' },
  { text: 'Quem escreveu "Dom Casmurro"?', category: 'Literatura', correctAnswer: 'Machado de Assis' },
  { text: 'Qual a fórmula química da água?', category: 'Ciências', correctAnswer: 'H₂O' },
];

const MULTIPLE_CHOICES_COMMON = ['Brasília', 'Rio de Janeiro', 'São Paulo', 'Salvador'];

const MOCK_PLAYERS = [
  { id: '1', name: 'João', isHost: true, isCurrent: false, isBuzzerWinner: false, score: 8 },
  { id: '2', name: 'Maria', isHost: false, isCurrent: false, isBuzzerWinner: false, score: 12 },
  { id: '3', name: 'Você', isHost: false, isCurrent: true, isBuzzerWinner: false, score: 10 },
  { id: '4', name: 'Pedro', isHost: false, isCurrent: false, isBuzzerWinner: false, score: 5 },
  { id: '5', name: 'Lucas', isHost: false, isCurrent: false, isBuzzerWinner: false, score: 7 },
  { id: '6', name: 'Ana', isHost: false, isCurrent: false, isBuzzerWinner: false, score: 3 },
];

const ALT_LABELS = ['A', 'B', 'C', 'D'];

export default function Partida1Page() {
  const [phase, setPhase] = useState<GamePhase>('question');
  const [buzzerStyle, setBuzzerStyle] = useState<BuzzerStyle>('blue');
  const [questionType, setQuestionType] = useState<QuestionType>('multiple');
  const [showMobile, setShowMobile] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [timer, setTimer] = useState(30);
  const [questionIdx, setQuestionIdx] = useState(6);
  const [selectedAlt, setSelectedAlt] = useState<string | undefined>();
  const [justScored, setJustScored] = useState<string | null>(null);
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const feedIdRef = useRef(0);

  const question = useMemo(() => QUESTIONS[(questionIdx - 1) % QUESTIONS.length], [questionIdx]);

  const addFeedEvent = useCallback((evt: Omit<FeedEvent, 'id'>) => {
    feedIdRef.current += 1;
    setFeedEvents(prev => [...prev, { ...evt, id: String(feedIdRef.current) }]);
  }, []);

  const scores = useMemo(() => MOCK_PLAYERS.map(p => ({
    id: p.id,
    name: p.name,
    score: p.score,
    isCurrent: p.isCurrent,
    isLeader: false,
    justScored: justScored === p.id,
  })), [justScored]);

  const handlePhaseChange = useCallback((newPhase: GamePhase) => {
    setPhase(newPhase);
    setSelectedAlt(undefined);
    if (newPhase === 'question') {
      setFeedEvents([]);
    }
    if (newPhase === 'correct' || newPhase === 'wrong') {
      setJustScored(newPhase === 'correct' ? '1' : null);
      setTimeout(() => setJustScored(null), 2000);
    } else if (newPhase === 'you-won') {
      setJustScored('3');
      setTimeout(() => setJustScored(null), 2000);
    }
  }, []);

  const handleBuzzerPress = useCallback(() => {
    if (phase === 'buzzer') {
      setPhase('you-won');
      addFeedEvent({ type: 'buzzer', playerName: 'Você', detail: '0,342s' });
      setTimeout(() => {
        setPhase('choosing');
        addFeedEvent({ type: 'choosing', playerName: 'Você' });
      }, 1500);
    }
  }, [phase, addFeedEvent]);

  const handleSelectAlt = useCallback((alt: string) => {
    setSelectedAlt(alt);
    const altIndex = MULTIPLE_CHOICES_COMMON.indexOf(alt);
    const altLabel = ALT_LABELS[altIndex] || '?';
    addFeedEvent({ type: 'chosen', playerName: 'Você', altLabel, altText: alt });

    setTimeout(() => {
      setPhase('reveal');
    }, 800);

    setTimeout(() => {
      if (alt === question.correctAnswer) {
        setPhase('correct');
        addFeedEvent({ type: 'correct', playerName: 'Você' });
      } else {
        setPhase('wrong');
        addFeedEvent({ type: 'wrong', playerName: 'Você' });
      }
    }, 2200);
  }, [question.correctAnswer, addFeedEvent]);

  const handleJudgeCorrect = useCallback(() => {
    setPhase('correct');
    addFeedEvent({ type: 'correct', playerName: 'Você' });
  }, [addFeedEvent]);

  const handleJudgeWrong = useCallback(() => {
    setPhase('wrong');
    addFeedEvent({ type: 'wrong', playerName: 'Você' });
  }, [addFeedEvent]);

  const winnerName = phase === 'you-won' || phase === 'choosing' || phase === 'reveal' ? 'Você'
    : phase === 'joao-won' || phase === 'wrong' || phase === 'correct' ? 'João'
    : undefined;

  const buzzerState = phase === 'buzzer' ? 'ready' as const
    : phase === 'you-won' ? 'won' as const
    : phase === 'joao-won' ? 'lost' as const
    : 'locked' as const;

  const roundPhase = phase === 'question' ? 'waiting' as const
    : phase === 'buzzer' ? 'ready' as const
    : phase === 'you-won' || phase === 'joao-won' || phase === 'choosing' || phase === 'reveal' ? 'won' as const
    : phase === 'correct' ? 'correct' as const
    : phase === 'wrong' ? 'wrong' as const
    : phase === 'timeout' ? 'timeout' as const
    : phase === 'next' ? 'next' as const
    : 'waiting' as const;

  return (
    <MobilePreview active={showMobile}>
      <div className="h-screen bg-gradient-to-br from-[#0c1929] via-[#0f2744] to-[#0a1628] flex flex-col overflow-hidden">
        <GameHeader
          questionNumber={questionIdx}
          totalQuestions={15}
          category={question.category}
          timer={timer}
          soundOn={soundOn}
          onToggleSound={() => setSoundOn(!soundOn)}
        />

        <MobileScoreBar players={scores} />

        <div className="flex-1 flex min-h-0">
          {/* Desktop: left scoreboard */}
          <div className="hidden lg:flex lg:w-64 xl:w-72 flex-col p-3 gap-3 overflow-y-auto">
            <ScoreboardPanel players={scores} />
          </div>

          {/* Center: question + tablet */}
          <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
            <div className="flex-1 flex flex-col sm:items-center justify-between sm:justify-center overflow-y-auto px-3 sm:px-4 pb-14 pt-3 sm:pt-0 relative z-20">
              <QuestionTablet
                question={question.text}
                category={question.category}
                mode={questionType}
                phase={phase}
                alternatives={MULTIPLE_CHOICES_COMMON}
                selectedAlt={selectedAlt}
                correctAnswer={question.correctAnswer}
                winnerName={winnerName}
                reactionTime={342}
                buzzerState={buzzerState}
                onBuzzerPress={handleBuzzerPress}
                onSelectAlt={handleSelectAlt}
              />
            </div>
          </div>

          {/* Desktop: right panels */}
          <div className="hidden lg:flex lg:w-56 xl:w-64 flex-col p-3 gap-3 overflow-y-auto">
            <ActivityFeed events={feedEvents} />
            <RoundPanel
              phase={roundPhase}
              winnerName={winnerName}
              reactionTime={phase === 'you-won' || phase === 'joao-won' ? 342 : undefined}
              questionNumber={questionIdx}
            />
          </div>
        </div>

        {/* Mobile: feed below content */}
        <div className="lg:hidden px-3 pb-14">
          <ActivityFeed events={feedEvents} />
        </div>

        <DevToolbar
          phase={phase}
          onPhaseChange={handlePhaseChange}
          buzzerStyle={buzzerStyle}
          onStyleChange={setBuzzerStyle}
          questionType={questionType}
          onQuestionTypeChange={setQuestionType}
          showMobile={showMobile}
          onMobileToggle={() => setShowMobile(!showMobile)}
        />
      </div>
    </MobilePreview>
  );
}
