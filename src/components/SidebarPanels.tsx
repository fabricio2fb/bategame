'use client';

import React, { useState } from 'react';
import { Key, Shield, Plus } from 'lucide-react';
import { isValidRoomCode, sanitizeRoomCodeInput } from '@/lib/room-code';

interface SidebarPanelsProps {
  onOpenCreate: () => void;
  onJoinCode: (code: string, playerName: string) => Promise<{ success: boolean; error?: string }>;
}

export const SidebarPanels: React.FC<SidebarPanelsProps> = ({
  onOpenCreate,
  onJoinCode,
}) => {
  const [code, setCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [nameError, setNameError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const normalizedName = playerName.trim().replace(/\s+/g, ' ');
  const canJoin = normalizedName.length >= 2 && normalizedName.length <= 20 && isValidRoomCode(code) && !isJoining;

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isJoining) return;
    setNameError('');
    setCodeError('');
    setServerError('');

    if (normalizedName.length < 2) {
      setNameError('Informe um nome com pelo menos 2 caracteres.');
      return;
    }
    if (normalizedName.length > 20) {
      setNameError('O nome deve ter no maximo 20 caracteres.');
      return;
    }
    if (!isValidRoomCode(code)) {
      setCodeError('Informe um codigo valido com 5 caracteres.');
      return;
    }

    setIsJoining(true);
    const result = await onJoinCode(code, normalizedName);
    setIsJoining(false);
    if (!result.success) setServerError(result.error || 'Nao foi possivel entrar na sala.');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border-2 border-black/15 rounded-3xl p-6 space-y-4 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-[#0F172A]">Crie sua propria sala</h3>
          <p className="text-xs text-[#64748B] leading-relaxed mt-1">
            Escolha as categorias, a quantidade de perguntas, convide os amigos e comece quando quiser.
          </p>
        </div>
        <button
          onClick={onOpenCreate}
          className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs sm:text-sm font-semibold rounded-full transition-all flex items-center justify-center gap-2 shadow-[0_2px_10px_rgba(59,130,246,0.25)] hover:shadow-[0_4px_14px_rgba(59,130,246,0.4)] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Criar partida</span>
        </button>
      </div>

      <div className="bg-white border-2 border-black/15 rounded-3xl p-6 space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-[#0F172A]">Entrar em uma sala</h3>
        <form onSubmit={handleJoinSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="quick-player-name" className="block text-xs font-semibold text-[#64748B]">Seu nome</label>
            <input
              id="quick-player-name"
              type="text"
              maxLength={20}
              placeholder="Digite seu nome"
              value={playerName}
              onChange={(e) => { setPlayerName(e.target.value); setNameError(''); setServerError(''); }}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#3B82F6] rounded-2xl px-4 py-3 text-base text-[#0F172A] placeholder-[#94A3B8] outline-none transition-all"
            />
            {nameError && <p className="text-[11px] font-medium text-[#EF4444]">{nameError}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="quick-room-code" className="block text-xs font-semibold text-[#64748B]">Codigo da sala</label>
            <input
              id="quick-room-code"
              type="text"
              maxLength={5}
              placeholder="EX: B7K9P"
              value={code}
              onChange={(e) => { setCode(sanitizeRoomCodeInput(e.target.value)); setCodeError(''); setServerError(''); }}
              className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#3B82F6] rounded-2xl px-4 py-3 text-center text-base font-mono font-bold tracking-wider text-[#0F172A] placeholder-[#94A3B8] uppercase outline-none transition-all"
            />
            {codeError && <p className="text-[11px] font-medium text-[#EF4444]">{codeError}</p>}
          </div>

          {serverError && (
            <p className="rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 px-3 py-2 text-xs font-medium text-[#EF4444]">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={!canJoin}
            className="w-full py-2.5 bg-[#F1F5F9] hover:bg-[#CBD5E1] disabled:opacity-50 text-[#0F172A] text-xs sm:text-sm font-medium border border-[#CBD5E1] rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <Key className="w-4 h-4 text-[#64748B]" />
            <span>{isJoining ? 'Entrando...' : 'Entrar na sala'}</span>
          </button>
        </form>
      </div>

      <div className="bg-[#F8FAFC] border-2 border-black/15 rounded-2xl p-4 flex items-start gap-3 text-xs text-[#64748B]">
        <Shield className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
        <p className="leading-normal">
          <strong className="text-[#0F172A]">Salas privadas</strong> nao aparecem no feed publico. Entre usando o codigo enviado pelo criador.
        </p>
      </div>
    </div>
  );
};
