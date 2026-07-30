'use client';

import React from 'react';
import { motion } from 'framer-motion';

type GamePhase = 'question' | 'buzzer' | 'you-won' | 'joao-won' | 'choosing' | 'reveal' | 'correct' | 'wrong' | 'timeout' | 'next' | 'finished';
type BuzzerStyle = 'blue' | 'glass' | 'metallic' | 'illuminated' | 'futuristic';

interface DevToolbarProps {
  phase: GamePhase;
  onPhaseChange: (phase: GamePhase) => void;
  buzzerStyle: BuzzerStyle;
  onStyleChange: (style: BuzzerStyle) => void;
  questionType: 'spoken' | 'multiple';
  onQuestionTypeChange: (type: 'spoken' | 'multiple') => void;
  showMobile: boolean;
  onMobileToggle: () => void;
}

const PHASES: { key: GamePhase; label: string; color: string }[] = [
  { key: 'question', label: 'Pergunta', color: '#3B82F6' },
  { key: 'buzzer', label: 'Liberar Botão', color: '#22C55E' },
  { key: 'you-won', label: 'Você clicou', color: '#F59E0B' },
  { key: 'joao-won', label: 'João clicou', color: '#F97316' },
  { key: 'choosing', label: 'Escolhendo', color: '#0EA5E9' },
  { key: 'reveal', label: 'Revelando', color: '#8B5CF6' },
  { key: 'correct', label: 'Correta', color: '#22C55E' },
  { key: 'wrong', label: 'Errada', color: '#EF4444' },
  { key: 'timeout', label: 'Tempo Esgotado', color: '#F59E0B' },
  { key: 'next', label: 'Próxima', color: '#8B5CF6' },
  { key: 'finished', label: 'Resultado', color: '#EC4899' },
];

const STYLES: { key: BuzzerStyle; label: string }[] = [
  { key: 'blue', label: 'Azul' },
  { key: 'glass', label: 'Vidro' },
  { key: 'metallic', label: 'Metálica' },
  { key: 'illuminated', label: 'Iluminada' },
  { key: 'futuristic', label: 'Futurista' },
];

export const DevToolbar: React.FC<DevToolbarProps> = ({ phase, onPhaseChange, buzzerStyle, onStyleChange, questionType, onQuestionTypeChange, showMobile, onMobileToggle }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F172A]/95 backdrop-blur-xl border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Phase buttons */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {PHASES.map(p => (
            <button key={p.key} onClick={() => onPhaseChange(p.key)}
              className={`px-2.5 py-1.5 text-[10px] font-semibold rounded-lg transition-all cursor-pointer ${
                phase === p.key ? 'text-white' : 'text-white/40 hover:text-white/70 bg-white/5 hover:bg-white/10'
              }`}
              style={phase === p.key ? { backgroundColor: p.color } : undefined}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between gap-3">
          {/* Buzzer style selector */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/30 uppercase tracking-wider">Botão:</span>
            <div className="flex gap-1">
              {STYLES.map(s => (
                <button key={s.key} onClick={() => onStyleChange(s.key)}
                  className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all cursor-pointer ${
                    buzzerStyle === s.key ? 'bg-[#3B82F6] text-white' : 'bg-white/10 text-white/50 hover:bg-white/20'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question type */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/30 uppercase tracking-wider">Tipo:</span>
            <button onClick={() => onQuestionTypeChange('spoken')}
              className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all cursor-pointer ${
                questionType === 'spoken' ? 'bg-[#8B5CF6] text-white' : 'bg-white/10 text-white/50'
              }`}>Falada</button>
            <button onClick={() => onQuestionTypeChange('multiple')}
              className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all cursor-pointer ${
                questionType === 'multiple' ? 'bg-[#8B5CF6] text-white' : 'bg-white/10 text-white/50'
              }`}>Múltipla</button>
          </div>

          {/* Mobile toggle */}
          <button onClick={onMobileToggle}
            className={`px-2.5 py-1.5 text-[10px] font-semibold rounded-lg transition-all cursor-pointer ${
              showMobile ? 'bg-[#EC4899] text-white' : 'bg-white/10 text-white/50 hover:bg-white/20'
            }`}>
            {showMobile ? '📱 Mobile' : '💻 Desktop'}
          </button>
        </div>
      </div>
    </div>
  );
};
