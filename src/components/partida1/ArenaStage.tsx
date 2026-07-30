'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Clock, Mic, Timer, X, Zap } from 'lucide-react';
import { clampReactionTime, formatReactionTime } from '@/lib/reaction-time';

type QuestionType = 'spoken' | 'multiple';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isCurrent: boolean;
  isBuzzerWinner: boolean;
  score: number;
}

interface ArenaStageProps {
  players: Player[];
  currentPlayerId: string;
  winnerId: string | null;
  phase: string;
  questionType: QuestionType;
  alternatives: string[];
  selectedAlt?: string;
  correctAnswer: string;
  reactionTime?: number;
  onBuzzerPress: () => void;
  onSelectAlt: (alt: string) => void;
}

const PLAYER_COLORS = ['#2563EB', '#16A34A', '#E11D48', '#D97706', '#7C3AED', '#DB2777'];
const ALT_LABELS = ['A', 'B', 'C', 'D'];

const DESKTOP_POSITIONS = [
  { left: '50%', top: '6%', scale: 0.86 },
  { left: '25%', top: '19%', scale: 0.9 },
  { left: '75%', top: '19%', scale: 0.9 },
  { left: '13%', top: '52%', scale: 0.98 },
  { left: '87%', top: '52%', scale: 0.98 },
  { left: '50%', top: '87%', scale: 1.06 },
];

const MOBILE_POSITIONS = [
  { left: '50%', top: '7%', scale: 0.72 },
  { left: '24%', top: '22%', scale: 0.68 },
  { left: '76%', top: '22%', scale: 0.68 },
  { left: '16%', top: '54%', scale: 0.64 },
  { left: '84%', top: '54%', scale: 0.64 },
  { left: '50%', top: '86%', scale: 0.78 },
];

function playerColor(player: Player, index: number) {
  if (player.isCurrent) return '#0EA5E9';
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

function getWinnerName(players: Player[], winnerId: string | null) {
  return players.find(player => player.id === winnerId)?.name;
}

function getTabletTone(phase: string, isWinner: boolean) {
  if (phase === 'timeout') return 'timeout';
  if (!isWinner) return 'idle';
  if (phase === 'correct') return 'correct';
  if (phase === 'wrong') return 'wrong';
  return 'active';
}

export const ArenaStage: React.FC<ArenaStageProps> = ({
  players,
  currentPlayerId,
  winnerId,
  phase,
  questionType,
  alternatives,
  selectedAlt,
  correctAnswer,
  reactionTime = 342,
  onBuzzerPress,
  onSelectAlt,
}) => {
  const winnerName = getWinnerName(players, winnerId);
  const showBuzzer = phase === 'buzzer';
  const showChoices = !!winnerId && questionType === 'multiple' && (phase === 'you-won' || phase === 'joao-won');
  const showSpoken = !!winnerId && questionType === 'spoken' && (phase === 'you-won' || phase === 'joao-won');
  const showCorrect = phase === 'correct';
  const showWrong = phase === 'wrong';
  const showTimeout = phase === 'timeout';
  const showNext = phase === 'next' || phase === 'finished';

  return (
    <section className="relative w-full max-w-5xl mx-auto h-[min(64vh,650px)] min-h-[440px] sm:min-h-[500px] pb-4">
      <div className="absolute inset-x-0 top-6 bottom-0 rounded-[48%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.18),rgba(15,23,42,0.08)_45%,transparent_72%)] blur-xl" />

      <div className="relative h-full [perspective:1100px]">
        <div className="absolute inset-[5%_4%_9%] sm:inset-[3%_4%_7%] rounded-[50%] [transform:rotateX(58deg)]">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.36),rgba(20,184,166,0.12)_34%,rgba(15,23,42,0.44)_70%,rgba(2,6,23,0.72))] shadow-[0_38px_90px_rgba(15,23,42,0.38)]" />
          <div className="absolute inset-[2%] rounded-full border border-white/35 shadow-[inset_0_1px_16px_rgba(255,255,255,0.22),0_0_28px_rgba(125,211,252,0.18)]" />
          <div className="absolute inset-[8%] rounded-full border border-cyan-100/20" />
          <div className="absolute inset-[19%] rounded-full bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.25),rgba(255,255,255,0.08)_30%,rgba(15,23,42,0.14)_72%)] border border-white/12" />
          <div className="absolute left-[19%] right-[19%] top-[18%] h-[16%] rounded-full bg-white/16 blur-md" />
          <div className="absolute left-[22%] right-[22%] bottom-[10%] h-[13%] rounded-full bg-black/18 blur-lg" />
        </div>

        <div className="absolute inset-0 hidden sm:block">
          {players.map((player, index) => (
            <ArenaPlayer
              key={player.id}
              player={player}
              index={index}
              position={DESKTOP_POSITIONS[index % DESKTOP_POSITIONS.length]}
              color={playerColor(player, index)}
              isCurrent={player.id === currentPlayerId}
              isWinner={player.id === winnerId}
              phase={phase}
            />
          ))}
        </div>

        <div className="absolute inset-0 sm:hidden">
          {players.map((player, index) => (
            <ArenaPlayer
              key={player.id}
              player={player}
              index={index}
              position={MOBILE_POSITIONS[index % MOBILE_POSITIONS.length]}
              color={playerColor(player, index)}
              isCurrent={player.id === currentPlayerId}
              isWinner={player.id === winnerId}
              phase={phase}
            />
          ))}
        </div>

        <div className="absolute left-1/2 top-1/2 z-20 w-[min(76vw,520px)] -translate-x-1/2 -translate-y-1/2">
          <AnimatePresence mode="wait">
            {showBuzzer && (
              <motion.div key={`buzzer-${phase}`} initial={{ opacity: 0, scale: 0.86, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.88, y: -8 }} transition={{ duration: 0.28 }}>
                <PremiumBuzzer state={phase === 'buzzer' ? 'ready' : 'locked'} onPress={onBuzzerPress} />
              </motion.div>
            )}

            {showChoices && (
              <motion.div key="choices" initial={{ opacity: 0, y: 22, scale: 0.94, rotateX: -8 }} animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ type: 'spring', damping: 22, stiffness: 190 }}>
                <CenterTablet alternatives={alternatives} selectedAlt={selectedAlt} onSelectAlt={onSelectAlt} />
              </motion.div>
            )}

            {showSpoken && (
              <motion.div key="spoken" initial={{ opacity: 0, y: 20, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}>
                <SpokenPanel winnerName={winnerName} reactionTime={reactionTime} />
              </motion.div>
            )}

            {showCorrect && (
              <ResultPanel keyName="correct" tone="correct" title="Resposta correta" detail={correctAnswer} note="+1 ponto" />
            )}

            {showWrong && (
              <ResultPanel keyName="wrong" tone="wrong" title="Resposta errada" detail="Outro jogador poderá tentar" note="A arena reabre a disputa" />
            )}

            {showTimeout && (
              <ResultPanel keyName="timeout" tone="timeout" title="Tempo esgotado" detail={correctAnswer} note="Resposta correta" />
            )}

            {showNext && (
              <ResultPanel keyName="next" tone="neutral" title="Próxima rodada" detail="Preparando a arena" note="Aguardando novo estado" />
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

function ArenaPlayer({
  player,
  index,
  position,
  color,
  isCurrent,
  isWinner,
  phase,
}: {
  player: Player;
  index: number;
  position: { left: string; top: string; scale: number };
  color: string;
  isCurrent: boolean;
  isWinner: boolean;
  phase: string;
}) {
  const tabletTone = getTabletTone(phase, isWinner);
  const celebrate = isWinner && (phase === 'you-won' || phase === 'joao-won' || phase === 'correct');
  const sad = isWinner && phase === 'wrong';

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: position.scale * 0.92 }}
      animate={{ opacity: 1, y: sad ? 10 : 0, scale: position.scale }}
      transition={{ delay: index * 0.05, duration: 0.36 }}
      className="absolute z-30 flex w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center sm:w-32"
      style={{ left: position.left, top: position.top }}
    >
      <motion.div
        className="relative flex flex-col items-center"
        animate={{ y: celebrate ? [0, -5, 0] : [0, -2, 0] }}
        transition={{ duration: celebrate ? 1.1 : 3.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Character color={color} celebrating={celebrate} sad={sad} />
        <PlayerTablet tone={tabletTone} color={color} />
        <div className="mt-1 flex flex-col items-center leading-none">
          <span className="max-w-24 truncate rounded-full bg-slate-950/45 px-2 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-md sm:text-xs">
            {player.name}
          </span>
          {isCurrent && (
            <span className="mt-1 rounded-full border border-sky-200/50 bg-sky-400/20 px-2 py-0.5 text-[8px] font-black tracking-[0.12em] text-sky-50">
              VOCÊ
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Character({ color, celebrating, sad }: { color: string; celebrating: boolean; sad: boolean }) {
  return (
    <div className="relative z-10 h-24 w-20 sm:h-28 sm:w-24">
      <div className="absolute left-1/2 top-1 h-12 w-12 -translate-x-1/2 rounded-full border border-white/35 bg-white shadow-[inset_-8px_-10px_18px_rgba(15,23,42,0.12),0_10px_22px_rgba(15,23,42,0.2)] sm:h-14 sm:w-14">
        <motion.span className="absolute left-3 top-5 h-2.5 w-2 rounded-full bg-slate-900 sm:left-3.5 sm:top-6" animate={{ scaleY: [1, 0.1, 1] }} transition={{ duration: 4, repeat: Infinity }} />
        <motion.span className="absolute right-3 top-5 h-2.5 w-2 rounded-full bg-slate-900 sm:right-3.5 sm:top-6" animate={{ scaleY: [1, 0.1, 1] }} transition={{ duration: 4, repeat: Infinity, delay: 0.08 }} />
        <span className={`absolute left-1/2 top-8 h-2.5 w-5 -translate-x-1/2 rounded-b-full border-b-2 ${sad ? 'rotate-180 border-slate-500' : 'border-slate-700'}`} />
        <span className="absolute right-1.5 top-2.5 h-4 w-6 rounded-full bg-white/70 blur-[1px]" />
      </div>
      <div className="absolute left-1/2 top-[52px] h-8 w-1.5 -translate-x-1/2 rounded-full" style={{ backgroundColor: color }} />
      <div className="absolute left-1/2 top-[57px] h-1.5 w-11 -translate-x-1/2 rounded-full" style={{ backgroundColor: color }} />
      <div className="absolute left-[28px] top-[59px] h-7 w-1.5 origin-top rounded-full sm:left-[34px]" style={{ backgroundColor: color, transform: celebrating ? 'rotate(-42deg)' : 'rotate(28deg)' }} />
      <div className="absolute right-[28px] top-[59px] h-7 w-1.5 origin-top rounded-full sm:right-[34px]" style={{ backgroundColor: color, transform: celebrating ? 'rotate(42deg)' : 'rotate(-28deg)' }} />
      <div className="absolute left-[35px] top-[78px] h-8 w-1.5 origin-top rounded-full sm:left-[43px]" style={{ backgroundColor: color, transform: sad ? 'rotate(7deg)' : 'rotate(18deg)' }} />
      <div className="absolute right-[35px] top-[78px] h-8 w-1.5 origin-top rounded-full sm:right-[43px]" style={{ backgroundColor: color, transform: sad ? 'rotate(-7deg)' : 'rotate(-18deg)' }} />
    </div>
  );
}

function PlayerTablet({ tone, color }: { tone: string; color: string }) {
  const screenClass = tone === 'correct'
    ? 'from-emerald-300 to-emerald-600'
    : tone === 'wrong'
      ? 'from-rose-300 to-rose-600'
      : tone === 'timeout'
        ? 'from-amber-200 to-orange-500'
        : tone === 'active'
          ? 'from-sky-200 to-cyan-500'
          : 'from-slate-900 to-slate-800';

  return (
    <motion.div
      className="relative -mt-8 h-10 w-24 rounded-lg bg-slate-950 p-1 shadow-[0_10px_24px_rgba(2,6,23,0.35)] sm:h-12 sm:w-28"
      animate={tone === 'timeout' ? { opacity: [1, 0.35, 1] } : undefined}
      transition={{ duration: 0.32, repeat: tone === 'timeout' ? Infinity : 0 }}
      style={{
        transform: 'rotateX(58deg)',
        boxShadow: tone === 'active' || tone === 'correct' || tone === 'wrong' ? `0 0 22px ${color}55, 0 12px 26px rgba(2,6,23,0.34)` : undefined,
      }}
    >
      <div className={`h-full rounded-md bg-gradient-to-br ${screenClass} border border-white/10`}>
        <div className="h-1/2 rounded-t-md bg-white/16" />
      </div>
      <div className="absolute -bottom-1 left-3 right-3 h-1 rounded-b-md bg-slate-800" />
    </motion.div>
  );
}

function PremiumBuzzer({ state, onPress }: { state: 'locked' | 'ready'; onPress: () => void }) {
  const isReady = state === 'ready';

  return (
    <div className="flex flex-col items-center">
      <motion.button
        type="button"
        disabled={!isReady}
        onClick={onPress}
        whileTap={isReady ? { scale: 0.9, y: 9 } : undefined}
        className="group relative grid h-44 w-44 place-items-center rounded-full outline-none disabled:cursor-not-allowed sm:h-56 sm:w-56"
        aria-label={isReady ? 'Aperte' : 'Aguarde'}
      >
        {isReady && (
          <motion.div className="absolute -inset-5 rounded-full border border-cyan-100/35" animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} />
        )}
        <div className={`absolute -inset-4 rounded-full ${isReady ? 'bg-cyan-200/18 blur-xl' : 'bg-slate-950/10 blur-lg'}`} />
        <div className="absolute inset-0 rounded-full bg-[linear-gradient(145deg,rgba(255,255,255,0.72),rgba(148,163,184,0.22)_28%,rgba(15,23,42,0.52)_76%)] shadow-[0_24px_46px_rgba(2,6,23,0.32),inset_0_2px_8px_rgba(255,255,255,0.5)]" />
        <div className={`absolute inset-4 rounded-full border ${isReady ? 'border-cyan-100/60 bg-cyan-300/18' : 'border-white/18 bg-white/8'} shadow-[inset_0_10px_20px_rgba(255,255,255,0.22),inset_0_-18px_28px_rgba(2,6,23,0.24)]`} />
        <motion.div
          className={`absolute inset-9 rounded-full ${isReady ? 'bg-[radial-gradient(circle_at_45%_26%,#FFFFFF,rgba(103,232,249,0.78)_24%,rgba(14,165,233,0.66)_62%,rgba(12,74,110,0.96))]' : 'bg-[radial-gradient(circle_at_45%_25%,rgba(255,255,255,0.62),rgba(148,163,184,0.45)_34%,rgba(51,65,85,0.82))]'}`}
          animate={isReady ? { scale: [1, 1.035, 1] } : { opacity: [0.82, 0.95, 0.82] }}
          transition={{ duration: isReady ? 1.8 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute left-[26%] right-[38%] top-[19%] h-[17%] rounded-full bg-white/60 blur-sm rotate-[-18deg]" />
        <div className="relative z-10 flex flex-col items-center gap-1 text-white drop-shadow-lg">
          {isReady ? <Zap className="h-8 w-8" /> : <Clock className="h-7 w-7 text-white/70" />}
          <span className="text-lg font-black tracking-[0.14em] sm:text-2xl">{isReady ? 'APERTE' : 'Aguarde'}</span>
          {!isReady && (
            <span className="flex gap-1 pt-1">
              {[0, 1, 2].map(i => (
                <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-white/55" animate={{ opacity: [0.25, 1, 0.25] }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.18 }} />
              ))}
            </span>
          )}
        </div>
      </motion.button>
    </div>
  );
}

function CenterTablet({ alternatives, selectedAlt, onSelectAlt }: { alternatives: string[]; selectedAlt?: string; onSelectAlt: (alt: string) => void }) {
  return (
    <div className="relative mx-auto w-full max-w-lg rounded-[28px] bg-slate-950 p-3 shadow-[0_28px_70px_rgba(2,6,23,0.42),inset_0_1px_0_rgba(255,255,255,0.18)]">
      <div className="absolute -bottom-4 left-10 right-10 h-5 rounded-full bg-black/30 blur-xl" />
      <div className="rounded-[20px] border border-white/10 bg-[linear-gradient(145deg,#0F172A,#1E293B)] p-2">
        <div className="relative min-h-64 overflow-hidden rounded-2xl border border-cyan-100/20 bg-[radial-gradient(circle_at_30%_12%,rgba(255,255,255,0.24),transparent_30%),linear-gradient(145deg,#EAF8FF,#BFEAFF)] p-4 text-slate-950">
          <div className="absolute inset-x-0 top-0 h-24 bg-white/25" />
          <p className="relative text-center text-xs font-black uppercase tracking-[0.18em] text-slate-500">Terminal de resposta</p>
          <div className="relative mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {alternatives.map((alt, index) => {
              const selected = selectedAlt === alt;
              return (
                <button
                  key={alt}
                  type="button"
                  disabled={!!selectedAlt}
                  onClick={() => onSelectAlt(alt)}
                  className={`min-h-16 rounded-xl border p-3 text-left text-sm font-bold shadow-sm transition disabled:cursor-not-allowed ${
                    selected
                      ? 'border-sky-700 bg-sky-600 text-white'
                      : selectedAlt
                        ? 'border-slate-200 bg-white/55 text-slate-400'
                        : 'border-white/70 bg-white/80 text-slate-800 hover:border-sky-300 hover:bg-white'
                  }`}
                >
                  <span className={`mr-2 inline-grid h-7 w-7 place-items-center rounded-lg text-xs ${selected ? 'bg-white/20 text-white' : 'bg-slate-950 text-white'}`}>
                    {ALT_LABELS[index]}
                  </span>
                  {alt}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SpokenPanel({ winnerName, reactionTime }: { winnerName?: string; reactionTime: number }) {
  return (
    <div className="mx-auto w-full max-w-md rounded-[24px] border border-white/16 bg-slate-950/76 p-5 text-white shadow-[0_24px_70px_rgba(2,6,23,0.36)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/55">Clicou primeiro</p>
          <h2 className="mt-1 text-3xl font-black">{winnerName}</h2>
        </div>
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-cyan-300/14">
          <Mic className="h-8 w-8 text-cyan-100" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/8 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/38">Tempo</p>
          <p className="mt-1 text-2xl font-black text-cyan-100">{formatReactionTime(clampReactionTime(reactionTime))}</p>
        </div>
        <div className="rounded-2xl bg-white/8 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/38">Cronômetro</p>
          <p className="mt-1 flex items-center gap-2 text-2xl font-black text-white"><Timer className="h-5 w-5 text-amber-200" /> 30s</p>
        </div>
      </div>
      <div className="mt-3 rounded-2xl border border-white/10 bg-white/7 p-3 text-center text-sm font-bold text-white/72">
        Aguardando resposta
      </div>
      <div className="mt-3 h-12 rounded-2xl border border-dashed border-white/16 bg-white/5" />
    </div>
  );
}

function ResultPanel({ keyName, tone, title, detail, note }: { keyName: string; tone: 'correct' | 'wrong' | 'timeout' | 'neutral'; title: string; detail: string; note: string }) {
  const styles = {
    correct: { icon: <Check className="h-8 w-8" />, color: 'text-emerald-200', bg: 'bg-emerald-400/18', border: 'border-emerald-200/24' },
    wrong: { icon: <X className="h-8 w-8" />, color: 'text-rose-200', bg: 'bg-rose-400/18', border: 'border-rose-200/24' },
    timeout: { icon: <Clock className="h-8 w-8" />, color: 'text-amber-200', bg: 'bg-amber-300/18', border: 'border-amber-100/24' },
    neutral: { icon: <Timer className="h-8 w-8" />, color: 'text-cyan-100', bg: 'bg-cyan-300/14', border: 'border-cyan-100/20' },
  }[tone];

  return (
    <motion.div key={keyName} initial={{ opacity: 0, y: 18, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} className={`mx-auto w-full max-w-md rounded-[24px] border ${styles.border} bg-slate-950/78 p-5 text-center text-white shadow-[0_24px_70px_rgba(2,6,23,0.38)] backdrop-blur-xl`}>
      <div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${styles.bg} ${styles.color}`}>
        {styles.icon}
      </div>
      <h2 className={`mt-4 text-3xl font-black ${styles.color}`}>{title}</h2>
      <p className="mt-2 text-lg font-bold text-white">{detail}</p>
      <p className="mt-1 text-sm font-semibold text-white/48">{note}</p>
    </motion.div>
  );
}
