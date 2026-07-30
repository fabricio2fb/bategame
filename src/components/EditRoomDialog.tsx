'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { RoomSettings, Difficulty, AnswerType } from '@/lib/types';

interface EditRoomDialogProps {
  isOpen: boolean;
  settings: RoomSettings;
  currentPlayers: number;
  onClose: () => void;
  onSave: (settings: Partial<RoomSettings>) => void;
}

export const EditRoomDialog: React.FC<EditRoomDialogProps> = ({ isOpen, settings, currentPlayers, onClose, onSave }) => {
  const [questionCount, setQuestionCount] = useState(settings.questionCount);
  const [maxPlayers, setMaxPlayers] = useState(settings.maxPlayers);
  const [answerTimeSeconds, setAnswerTimeSeconds] = useState(settings.answerTimeSeconds || 15);
  const [difficulty, setDifficulty] = useState<Difficulty>(settings.difficulty);
  const [answerMode, setAnswerMode] = useState<AnswerType | 'mixed'>(settings.answerMode);

  useEffect(() => {
    if (isOpen) {
      setQuestionCount(settings.questionCount);
      setMaxPlayers(settings.maxPlayers);
      setAnswerTimeSeconds(settings.answerTimeSeconds || 15);
      setDifficulty(settings.difficulty);
      setAnswerMode(settings.answerMode);
    }
  }, [isOpen, settings]);

  const handleSave = () => {
    const updated: any = {};
    if (questionCount !== settings.questionCount) updated.questionCount = questionCount;
    if (maxPlayers !== settings.maxPlayers && maxPlayers >= currentPlayers) updated.maxPlayers = maxPlayers;
    if (answerTimeSeconds !== settings.answerTimeSeconds) updated.answerTimeSeconds = answerTimeSeconds;
    if (difficulty !== settings.difficulty) updated.difficulty = difficulty;
    if (answerMode !== settings.answerMode) updated.answerMode = answerMode;
    if (Object.keys(updated).length > 0) onSave(updated);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg bg-white border-2 border-black/15 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#CBD5E1] pb-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">Editar configurações</h2>
                <p className="text-xs text-[#64748B] mt-0.5">Altere os parâmetros da partida.</p>
              </div>
              <button onClick={onClose}
                className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-lg bg-[#F1F5F9] transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#64748B]">Perguntas</label>
                <select value={questionCount} onChange={e => setQuestionCount(Number(e.target.value) as any)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] outline-none">
                  {[10, 15, 20, 30].map(n => <option key={n} value={n} className="bg-white">{n}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#64748B]">Máx. jogadores</label>
                <select value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value) as any)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] outline-none">
                  {[4, 6, 8, 12, 16].map(n => (
                    <option key={n} value={n} disabled={n < currentPlayers} className="bg-white">
                      {n}{n < currentPlayers ? ' (mín. atual)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#64748B]">Dificuldade</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] outline-none">
                  <option value="easy" className="bg-white">Fácil</option>
                  <option value="medium" className="bg-white">Média</option>
                  <option value="hard" className="bg-white">Difícil</option>
                  <option value="mixed" className="bg-white">Misturada</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#64748B]">Tempo resposta</label>
                <select value={answerTimeSeconds} onChange={e => setAnswerTimeSeconds(Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] outline-none">
                  {[5, 10, 15, 20, 30].map(n => <option key={n} value={n} className="bg-white">{n}s</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#64748B]">Modo resposta</label>
                <select value={answerMode} onChange={e => setAnswerMode(e.target.value as AnswerType | 'mixed')}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#0F172A] outline-none">
                  <option value="spoken" className="bg-white">Resposta falada</option>
                  <option value="multiple-choice" className="bg-white">Múltipla escolha</option>
                </select>
              </div>
            </div>
            <button onClick={handleSave}
              className="w-full mt-5 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-sm rounded-lg transition-all cursor-pointer shadow-[0_2px_10px_rgba(59,130,246,0.25)]">
              Salvar alterações
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
