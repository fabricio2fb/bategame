'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MultipleChoiceGridProps {
  alternatives: string[];
  selectedAlternative: string | null;
  disabled: boolean;
  onSelect: (alt: string) => void;
}

const LABELS = ['A', 'B', 'C', 'D'];
const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444'];

export const MultipleChoiceGrid: React.FC<MultipleChoiceGridProps> = ({ alternatives, selectedAlternative, disabled, onSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mx-auto">
      <AnimatePresence>
        {alternatives.map((alt, i) => {
          const isSelected = selectedAlternative === alt;
          const color = COLORS[i % COLORS.length];
          return (
            <motion.button
              key={`${alt}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.25 }}
              onClick={() => !disabled && onSelect(alt)}
              disabled={disabled}
              className={`relative p-4 sm:p-5 rounded-xl text-left transition-all cursor-pointer disabled:cursor-not-allowed overflow-hidden ${
                isSelected
                  ? 'text-white shadow-lg'
                  : disabled
                    ? 'bg-[#F1F5F9] text-[#94A3B8] border-2 border-[#CBD5E1]/40'
                    : 'bg-white hover:bg-[#F8FAFC] text-[#0F172A] border-2 border-black/15 hover:border-[#3B82F6]/30 hover:shadow-md active:scale-[0.98]'
              }`}
              style={isSelected ? { backgroundColor: color } : undefined}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : disabled
                      ? 'bg-[#E2E8F0] text-[#94A3B8]'
                      : 'bg-[#F1F5F9] text-[#64748B]'
                }`}>
                  {LABELS[i]}
                </div>
                <span className="text-sm sm:text-base font-medium leading-snug pt-1">{alt}</span>
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
