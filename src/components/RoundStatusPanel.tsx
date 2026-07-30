'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Clock, User, Crown } from 'lucide-react';

interface RoundStatusPanelProps {
  phase: string;
  winnerName?: string | null;
  winnerId?: string | null;
  currentPlayerId?: string | null;
  result?: { type: 'correct' | 'wrong' | 'timeout' | 'all_wrong'; correctAnswer?: string; explanation?: string } | null;
  isHost?: boolean;
  questionType?: 'spoken' | 'multiple-choice';
  onJudgeCorrect?: () => void;
  onJudgeWrong?: () => void;
}

export const RoundStatusPanel: React.FC<RoundStatusPanelProps> = ({
  phase, winnerName, winnerId, currentPlayerId, result, isHost, questionType, onJudgeCorrect, onJudgeWrong,
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm border-2 border-black/15 rounded-2xl overflow-hidden shadow-lg">
      <div className="p-3 border-b border-[#CBD5E1]/40">
        <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Rodada</h2>
      </div>
      <div className="p-4 space-y-3">
        {phase === 'buzzer-open' && (
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#3B82F6]/10 flex items-center justify-center mx-auto">
              <Clock className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <p className="text-sm font-semibold text-[#0F172A]">Aperte para responder!</p>
            <p className="text-xs text-[#64748B]">O primeiro a apertar responde</p>
          </div>
        )}

        {phase === 'answering' && winnerName && (
          <div className="text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center mx-auto">
              <User className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0F172A]">{winnerName}</p>
              <p className="text-xs text-[#64748B]">Respondeu primeiro</p>
            </div>
            {winnerId === currentPlayerId && isHost && questionType === 'spoken' && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-[#64748B]">Ouça a resposta do jogador e julgue:</p>
                <div className="flex gap-2">
                  <button onClick={onJudgeCorrect}
                    className="flex-1 py-3 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95">
                    Correta
                  </button>
                  <button onClick={onJudgeWrong}
                    className="flex-1 py-3 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95">
                    Errada
                  </button>
                </div>
              </div>
            )}
            {winnerId !== currentPlayerId && (
              <p className="text-xs text-[#94A3B8]">Aguardando resposta...</p>
            )}
            {winnerId === currentPlayerId && questionType === 'multiple-choice' && (
              <p className="text-xs text-[#22C55E] font-medium">Escolha uma alternativa!</p>
            )}
          </div>
        )}

        {result && (
          <div className="text-center space-y-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${
              result.type === 'correct' ? 'bg-[#22C55E]/10' : 'bg-[#EF4444]/10'
            }`}>
              <span className="text-lg">
                {result.type === 'correct' ? '✅' : result.type === 'timeout' ? '⏰' : '❌'}
              </span>
            </div>
            <p className={`text-sm font-bold ${
              result.type === 'correct' ? 'text-[#22C55E]' : result.type === 'timeout' ? 'text-[#F59E0B]' : 'text-[#EF4444]'
            }`}>
              {result.type === 'correct' ? 'Correta!' : result.type === 'all_wrong' ? 'Ninguém acertou' : result.type === 'timeout' ? 'Tempo esgotado' : 'Incorreta'}
            </p>
            {result.correctAnswer && (
              <p className="text-xs text-[#64748B]">
                Resposta: <span className="font-bold text-[#22C55E]">{result.correctAnswer}</span>
              </p>
            )}
            {result.explanation && (
              <p className="text-xs text-[#94A3B8]">{result.explanation}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
