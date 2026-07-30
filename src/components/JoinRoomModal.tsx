'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Check } from 'lucide-react';
import { isValidRoomCode, sanitizeRoomCodeInput } from '@/lib/room-code';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onClose,
  initialCode = '',
}) => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState(initialCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [joined, setJoined] = useState(false);

  if (!isOpen) return null;

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomCode(sanitizeRoomCodeInput(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setErrorMessage('Por favor, informe seu nome.');
      return;
    }
    if (!isValidRoomCode(roomCode)) {
      setErrorMessage('O código deve ter pelo menos 5 caracteres.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setJoined(true);
    }, 700);
  };

  const handleReset = () => {
    setJoined(false);
    setPlayerName('');
    setRoomCode('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white border-2 border-black/15 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#CBD5E1] pb-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">Entrar na partida</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Digite seu nome e o código da sala fornecido.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-lg bg-[#F1F5F9] transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!joined ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="join-name" className="block text-xs font-semibold text-[#64748B]">
                  Seu nome no jogo <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  id="join-name"
                  type="text"
                  maxLength={20}
                  placeholder="Ex.: Lucas"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#3B82F6] rounded-lg px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] outline-none transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="join-code" className="block text-xs font-semibold text-[#64748B]">
                  Código da partida <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  id="join-code"
                  type="text"
                  maxLength={5}
                  placeholder="B7K9P"
                  value={roomCode}
                  onChange={handleCodeChange}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#3B82F6] rounded-lg px-3.5 py-3 text-center text-2xl font-mono font-bold tracking-widest text-[#0F172A] placeholder-[#94A3B8] uppercase outline-none transition-colors"
                  required
                />
                <p className="text-[11px] text-[#94A3B8]">
                  Código fornecido pelo apresentador da sala.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Conectando...</span>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Entrar na partida</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">Conectado à sala {roomCode}!</h3>
                <p className="text-xs text-[#64748B] mt-1">
                  Aguardando a partida iniciar. O servidor de tempo real ativará seu painel automaticamente.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="w-full py-2.5 bg-[#F1F5F9] text-[#0F172A] text-sm font-semibold rounded-lg hover:bg-[#CBD5E1] transition-colors"
              >
                Entendi
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
