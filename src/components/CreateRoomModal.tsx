'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Shield, Globe, Lock } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated?: (roomData: any) => void;
}

const CATEGORY_OPTIONS = [
  'Tudo misturado',
  'Futebol',
  'Jogos',
  'Filmes e séries',
  'Animais',
  'Ciência',
  'História',
  'Geografia',
  'Música',
  'Tecnologia',
  'Engenharia',
];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onRoomCreated,
}) => {
  const [roomName, setRoomName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tudo misturado');
  const [questionCount, setQuestionCount] = useState<number>(15);
  const [maxPlayers, setMaxPlayers] = useState<number>(8);
  const [difficulty, setDifficulty] = useState<string>('Misturada');
  const [responseMode, setResponseMode] = useState<'Falada' | 'Múltipla escolha'>('Múltipla escolha');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      setErrorMessage('Por favor, informe o nome da sala.');
      return;
    }
    if (!playerName.trim()) {
      setErrorMessage('Por favor, informe seu nome.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      if (onRoomCreated) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = 'B';
        for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));

        onRoomCreated({
          id: `room-${Date.now()}`,
          name: roomName,
          creator: playerName,
          category: selectedCategory,
          difficulty,
          questionCount,
          responseMode,
          currentPlayers: 1,
          maxPlayers,
          status: 'waiting',
          code,
          isPrivate,
        });
      }
      onClose();
    }, 800);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white border-2 border-black/15 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#CBD5E1] pb-4 mb-5">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">Criar partida</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Configure os detalhes da sua sala de jogo.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-lg bg-[#F1F5F9] transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Room Name */}
            <div className="space-y-1.5">
              <label htmlFor="room-name" className="block text-xs font-semibold text-[#64748B]">
                Nome da sala <span className="text-[#EF4444]">*</span>
              </label>
              <input
                id="room-name"
                type="text"
                maxLength={30}
                placeholder="Ex.: Quiz da galera"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#3B82F6] rounded-lg px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none transition-colors"
                required
              />
            </div>

            {/* Creator Name */}
            <div className="space-y-1.5">
              <label htmlFor="creator-name" className="block text-xs font-semibold text-[#64748B]">
                Seu nome <span className="text-[#EF4444]">*</span>
              </label>
              <input
                id="creator-name"
                type="text"
                maxLength={20}
                placeholder="Como você será chamado?"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#3B82F6] rounded-lg px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none transition-colors"
                required
              />
            </div>

            {/* Privacy toggle */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#64748B]">Privacidade</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                   className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                     !isPrivate
                       ? 'bg-[#F1F5F9] border-[#3B82F6] text-[#0F172A]'
                       : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B]'
                   }`}
                 >
                   <Globe className="w-4 h-4 text-[#3B82F6]" />
                   <div>
                     <div className="text-xs font-bold text-[#0F172A]">Pública</div>
                     <div className="text-[10px] text-[#64748B]">Aparece no feed</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                   className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                     isPrivate
                       ? 'bg-[#F1F5F9] border-[#3B82F6] text-[#0F172A]'
                       : 'bg-[#F8FAFC] border-[#CBD5E1] text-[#64748B]'
                   }`}
                 >
                   <Lock className="w-4 h-4 text-[#64748B]" />
                   <div>
                     <div className="text-xs font-bold text-[#0F172A]">Privada</div>
                     <div className="text-[10px] text-[#64748B]">Apenas por código</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#64748B]">Categoria</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#3B82F6] rounded-lg px-3 py-2.5 text-xs sm:text-sm text-[#0F172A] outline-none"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat} className="bg-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Questions & Max Players */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#64748B]">Perguntas</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#0F172A] outline-none"
                >
                  {[10, 15, 20, 30].map((num) => (
                    <option key={num} value={num} className="bg-white">
                      {num} perguntas
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#64748B]">Máx. Jogadores</label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#0F172A] outline-none"
                >
                  {[4, 6, 8, 12, 16].map((num) => (
                    <option key={num} value={num} className="bg-white">
                      {num} jogadores
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Difficulty & Response Mode */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#64748B]">Dificuldade</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#0F172A] outline-none"
                >
                  {['Misturada', 'Fácil', 'Média', 'Difícil'].map((diff) => (
                    <option key={diff} value={diff} className="bg-white">
                      {diff}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#64748B]">Modo Resposta</label>
                <select
                  value={responseMode}
                  onChange={(e) => setResponseMode(e.target.value as any)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs sm:text-sm text-[#0F172A] outline-none"
                >
                  <option value="Múltipla escolha" className="bg-white">Múltipla escolha</option>
                  <option value="Falada" className="bg-white">Resposta falada</option>
                </select>
              </div>
            </div>

            {/* Action Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Criando...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Criar partida</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
