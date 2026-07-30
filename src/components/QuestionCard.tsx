'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Mic, CheckSquare } from 'lucide-react';
import { QuestionData } from '@/lib/types';

interface QuestionCardProps {
  question: QuestionData;
  questionNumber: number;
  totalQuestions: number;
  compact?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, questionNumber, totalQuestions, compact }) => {
  if (compact) {
    return (
      <div className="text-center">
        <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] leading-snug">{question.text}</h2>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/95 backdrop-blur-sm border-2 border-black/15 rounded-2xl p-6 sm:p-8 text-center shadow-xl w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-[11px] font-semibold text-[#3B82F6] bg-[#3B82F6]/10 px-2.5 py-1 rounded-full">
          {question.category}
        </span>
        {question.answerType === 'spoken' ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-[#64748B] bg-[#F8FAFC] border border-[#CBD5E1] px-2 py-1 rounded-full">
            <Mic className="w-3 h-3" /><span>Falada</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-[#64748B] bg-[#F8FAFC] border border-[#CBD5E1] px-2 py-1 rounded-full">
            <CheckSquare className="w-3 h-3" /><span>Múltipla escolha</span>
          </span>
        )}
      </div>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0F172A] leading-snug">
        {question.text}
      </h2>
    </motion.div>
  );
};
