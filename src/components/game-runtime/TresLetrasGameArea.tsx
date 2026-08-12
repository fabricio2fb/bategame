'use client';

import { FormEvent, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type {
  TresLetrasRevealAnswer,
  TresLetrasRound,
  TresLetrasRoundReveal,
  TresLetrasVoteCount,
  TresLetrasVotingState,
} from '@/hooks/useTresLetrasRuntime';
import type { RoomStatus } from '@/lib/types';

interface TresLetrasGameAreaProps {
  status: RoomStatus | 'loading' | 'error';
  currentRound: TresLetrasRound | null;
  questionNumber: number;
  totalRounds: number;
  timer: number;
  countdownValue: number | null;
  submittedPlayerIds: string[];
  currentPlayerId: string | null;
  votingState: TresLetrasVotingState | null;
  voteCounts: TresLetrasVoteCount[];
  myVotes: Record<string, 'correct' | 'wrong'>;
  lastReveal: TresLetrasRoundReveal | null;
  submitError: string | null;
  isSubmitting: boolean;
  accentColor: string;
  onSubmitAnswer: (answer: string) => void;
  onSubmitVote: (answerId: string, vote: 'correct' | 'wrong') => void;
}

export function TresLetrasGameArea({
  status,
  currentRound,
  questionNumber,
  totalRounds,
  timer,
  countdownValue,
  submittedPlayerIds,
  currentPlayerId,
  votingState,
  voteCounts,
  myVotes,
  lastReveal,
  submitError,
  isSubmitting,
  accentColor,
  onSubmitAnswer,
  onSubmitVote,
}: TresLetrasGameAreaProps) {
  const [answer, setAnswer] = useState('');
  const alreadySubmitted = !!currentPlayerId && submittedPlayerIds.includes(currentPlayerId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleaned = answer.trim().replace(/\s+/g, ' ');
    if (!cleaned || alreadySubmitted || isSubmitting) return;
    onSubmitAnswer(cleaned);
    setAnswer('');
  }

  if (countdownValue !== null && countdownValue > 0) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-10 text-center text-white">
        <p className="text-xs font-black uppercase tracking-[0.3em]" style={{ color: accentColor }}>
          A partida vai comecar
        </p>
        <p className="mt-5 text-8xl font-black leading-none">{countdownValue}</p>
      </div>
    );
  }

  if (status === 'voting' && votingState) {
    return (
      <VotingPhase
        votingState={votingState}
        voteCounts={voteCounts}
        myVotes={myVotes}
        timer={timer}
        submitError={submitError}
        accentColor={accentColor}
        onSubmitVote={onSubmitVote}
      />
    );
  }

  if ((status === 'round-reveal' || status === 'game-finished') && lastReveal) {
    return (
      <RevealPhase
        reveal={lastReveal}
        timer={timer}
        questionNumber={questionNumber}
        totalRounds={totalRounds}
        accentColor={accentColor}
      />
    );
  }

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-5 py-8 text-center text-white">
      <div className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: accentColor }}>
        Rodada {questionNumber || 1} de {totalRounds || 1}
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        {(currentRound?.letters || ['?', '?', '?']).map((letter, index) => (
          <span
            key={`${letter}-${index}`}
            className="grid h-20 w-20 place-items-center rounded-3xl border border-white/15 bg-white/10 text-4xl font-black text-white shadow-[0_18px_45px_rgba(0,0,0,0.24)] sm:h-24 sm:w-24 sm:text-5xl"
          >
            {letter}
          </span>
        ))}
      </div>

      <p className="mt-5 text-sm font-semibold text-white/55">
        Escreva uma palavra ou expressao usando as 3 letras da rodada.
      </p>

      <div className="mt-5 rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-black text-white">
        {timer > 0 ? `${timer}s` : 'Tempo encerrando'}
      </div>

      <form onSubmit={handleSubmit} className="mt-7 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
        <input
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          disabled={alreadySubmitted || isSubmitting}
          placeholder={alreadySubmitted ? 'Resposta enviada' : 'Digite sua resposta'}
          className="min-h-14 flex-1 rounded-2xl border border-white/15 bg-white/10 px-5 text-base font-bold text-white outline-none placeholder:text-white/35 disabled:cursor-not-allowed disabled:opacity-55"
        />
        <button
          type="submit"
          disabled={!answer.trim() || alreadySubmitted || isSubmitting}
          className="min-h-14 rounded-2xl px-6 text-sm font-black text-white shadow-[0_16px_40px_rgba(0,0,0,0.22)] disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: accentColor }}
        >
          {isSubmitting ? 'Enviando...' : alreadySubmitted ? 'Enviado' : 'Enviar'}
        </button>
      </form>

      {submitError && (
        <p className="mt-3 text-sm font-bold text-[#FCA5A5]" role="alert">
          {submitError}
        </p>
      )}
    </div>
  );
}

function VotingPhase({
  votingState,
  voteCounts,
  myVotes,
  timer,
  submitError,
  accentColor,
  onSubmitVote,
}: {
  votingState: TresLetrasVotingState;
  voteCounts: TresLetrasVoteCount[];
  myVotes: Record<string, 'correct' | 'wrong'>;
  timer: number;
  submitError: string | null;
  accentColor: string;
  onSubmitVote: (answerId: string, vote: 'correct' | 'wrong') => void;
}) {
  const countsByAnswer = useMemo(
    () => new Map(voteCounts.map((entry) => [entry.answerId, entry])),
    [voteCounts]
  );

  return (
    <div className="mx-auto flex min-h-[420px] w-full max-w-3xl flex-col px-5 py-7 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: accentColor }}>
            Votacao
          </p>
          <h2 className="mt-2 text-2xl font-black">Toque para marcar errado</h2>
        </div>
        <div className="rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-black">
          {timer > 0 ? `${timer}s` : 'Encerrando'}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {votingState.answers.map((entry) => {
          const count = countsByAnswer.get(entry.answerId);
          const selected = myVotes[entry.answerId] || 'correct';
          const isWrong = selected === 'wrong';
          const nextVote = isWrong ? 'correct' : 'wrong';
          const tone = isWrong
            ? {
                label: 'Errado',
                hint: 'Toque para voltar para certo',
                border: 'rgba(239,68,68,0.48)',
                background: 'rgba(239,68,68,0.18)',
                text: '#FCA5A5',
              }
            : {
                label: 'Certo',
                hint: 'Toque para marcar como errado',
                border: 'rgba(34,197,94,0.48)',
                background: 'rgba(34,197,94,0.18)',
                text: '#86EFAC',
              };

          return (
            <button
              key={entry.answerId}
              type="button"
              onClick={() => onSubmitVote(entry.answerId, nextVote)}
              className="block w-full rounded-3xl border p-4 text-left transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white/30"
              style={{
                borderColor: tone.border,
                backgroundColor: tone.background,
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-words text-xl font-black text-white">{entry.text}</p>
                    {entry.repeated && (
                      <span className="rounded-full border border-[#F59E0B]/35 bg-[#F59E0B]/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#FCD34D]">
                        repetida
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-semibold text-white/45">{entry.playerName}</p>
                </div>

                <div className="shrink-0 rounded-full bg-black/20 px-4 py-2 text-xs font-black" style={{ color: tone.text }}>
                  {tone.label}
                </div>
              </div>

              <div className="mt-3 text-xs font-semibold text-white/45">
                {tone.hint}
                {count?.totalVotes ? ` · ${count.totalVotes} ajuste(s) registrado(s)` : ''}
              </div>
            </button>
          );
        })}
      </div>

      {submitError && (
        <p className="mt-4 text-sm font-bold text-[#FCA5A5]" role="alert">
          {submitError}
        </p>
      )}
    </div>
  );
}

function RevealPhase({
  reveal,
  questionNumber,
  totalRounds,
  accentColor,
}: {
  reveal: TresLetrasRoundReveal;
  timer: number;
  questionNumber: number;
  totalRounds: number;
  accentColor: string;
}) {
  return (
    <div className="mx-auto flex min-h-[420px] w-full max-w-3xl flex-col px-5 py-7 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: accentColor }}>
            Resultado
          </p>
          <h2 className="mt-2 text-2xl font-black">Rodada {reveal.roundNumber || questionNumber} de {reveal.totalRounds || totalRounds}</h2>
        </div>
        <div className="flex items-center gap-2">
          {reveal.letters.map((letter) => (
            <span key={letter} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-lg font-black">
              {letter}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {reveal.answers.map((answer) => (
          <RevealCard key={answer.answerId} answer={answer} />
        ))}
      </div>

      {reveal.missingPlayerIds.length > 0 && (
        <p className="mt-4 text-sm font-semibold text-white/45">
          {reveal.missingPlayerIds.length} jogador(es) nao enviaram resposta nesta rodada.
        </p>
      )}
    </div>
  );
}

function RevealCard({ answer }: { answer: TresLetrasRevealAnswer }) {
  const tone = getRevealTone(answer);

  return (
    <div
      className="rounded-3xl border p-4"
      style={{
        borderColor: tone.border,
        backgroundColor: tone.background,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="break-words text-xl font-black text-white">{answer.text}</p>
            {answer.repeated && (
              <span className="rounded-full border border-[#F59E0B]/35 bg-[#F59E0B]/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#FCD34D]">
                repetida
              </span>
            )}
          </div>
          <p className="mt-1 text-xs font-semibold text-white/45">{answer.playerName}</p>
        </div>
        <div className="rounded-full bg-black/20 px-4 py-2 text-sm font-black" style={{ color: tone.text }}>
          +{answer.points} ponto{answer.points === 1 ? '' : 's'}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-white/55">
        <span>Certo: {answer.correctVotes}</span>
        <span>Errado: {answer.wrongVotes}</span>
        <span className="inline-flex items-center gap-1" style={{ color: tone.text }}>
          <RotateCcw className="h-3.5 w-3.5" />
          {tone.label}
        </span>
      </div>
    </div>
  );
}

function getRevealTone(answer: TresLetrasRevealAnswer) {
  if (answer.outcome === 'rejected') {
    return {
      label: 'Maioria marcou errado',
      border: 'rgba(239,68,68,0.35)',
      background: 'rgba(239,68,68,0.12)',
      text: '#FCA5A5',
    };
  }
  if (answer.outcome === 'tie') {
    return {
      label: 'Empate na votacao',
      border: 'rgba(245,158,11,0.35)',
      background: 'rgba(245,158,11,0.13)',
      text: '#FCD34D',
    };
  }
  if (answer.outcome === 'accepted-repeated') {
    return {
      label: 'Certa, mas repetida',
      border: 'rgba(34,197,94,0.28)',
      background: 'rgba(34,197,94,0.12)',
      text: '#86EFAC',
    };
  }
  return {
    label: 'Certa e unica',
    border: 'rgba(34,197,94,0.42)',
    background: 'rgba(34,197,94,0.16)',
    text: '#86EFAC',
  };
}
