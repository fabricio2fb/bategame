'use client';

import React from 'react';
import { PublicRoom } from '@/lib/types';
import { Users, HelpCircle, Mic, CheckSquare, Clock, Globe, Gamepad2, Film, Flame, Atom, MapPin, Cpu, Wrench, Dog } from 'lucide-react';

interface RoomCardProps {
  room: PublicRoom;
  onJoin: (room: PublicRoom) => void;
}

export const RoomCategoryIcon: React.FC<{ category: string }> = ({ category }) => {
  const catLower = category.toLowerCase();

  let Icon = Globe;
  if (catLower.includes('futebol')) Icon = Flame;
  else if (catLower.includes('jogo')) Icon = Gamepad2;
  else if (catLower.includes('filme') || catLower.includes('série')) Icon = Film;
  else if (catLower.includes('ciência')) Icon = Atom;
  else if (catLower.includes('história')) Icon = MapPin;
  else if (catLower.includes('tecnologia')) Icon = Cpu;
  else if (catLower.includes('engenharia')) Icon = Wrench;
  else if (catLower.includes('animais')) Icon = Dog;

  return (
    <div className="w-10 h-10 rounded-2xl bg-[#F1F5F9]/80 border border-[#CBD5E1] flex items-center justify-center text-[#3B82F6] shrink-0 shadow-sm">
      <Icon className="w-5 h-5" />
    </div>
  );
};

export const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin }) => {
  const isFull = room.playerCount >= room.settings.maxPlayers;
  const firstCategory = room.settings.categories[0] || 'Geral';
  const difficultyLabel: Record<string, string> = { easy: 'Fácil', medium: 'Média', hard: 'Difícil', mixed: 'Misturada' };
  const modeLabel: Record<string, string> = { spoken: 'Falada', 'multiple-choice': 'Múltipla escolha' };

  return (
    <div className="bg-white/90 border-2 border-black/15 hover:border-[#3B82F6]/40 rounded-3xl p-5 sm:p-6 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
      {/* Left Details */}
      <div className="space-y-3 flex-1">
        {/* Header row: Icon, Name, Category pill */}
        <div className="flex items-start sm:items-center gap-3.5">
          <RoomCategoryIcon category={firstCategory} />
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-[#0F172A] leading-snug group-hover:text-[#3B82F6] transition-colors">
                {room.name}
              </h3>
              <span className="text-[11px] font-semibold text-[#64748B] bg-[#F1F5F9] border border-[#CBD5E1] px-2.5 py-0.5 rounded-full">
                {firstCategory}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Criada por <strong className="text-[#64748B] font-medium">{room.hostName}</strong>
            </p>
          </div>
        </div>

        {/* Info Grid Pills */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#64748B]">
          {/* Players */}
          <div className="flex items-center gap-1.5 bg-[#F8FAFC]/60 border border-[#CBD5E1]/60 px-2.5 py-1 rounded-full">
            <Users className="w-3.5 h-3.5 text-[#64748B]" />
            <span><strong className="text-[#0F172A]">{room.playerCount}</strong>/{room.settings.maxPlayers} jogadores</span>
          </div>

          {/* Questions */}
          <div className="flex items-center gap-1.5 bg-[#F8FAFC]/60 border border-[#CBD5E1]/60 px-2.5 py-1 rounded-full">
            <HelpCircle className="w-3.5 h-3.5 text-[#64748B]" />
            <span>{room.settings.questionCount} perguntas</span>
          </div>

          {/* Mode */}
          <div className="flex items-center gap-1.5 bg-[#F8FAFC]/60 border border-[#CBD5E1]/60 px-2.5 py-1 rounded-full">
            {room.settings.answerMode === 'spoken' ? (
              <>
                <Mic className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Resposta falada</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Múltipla escolha</span>
              </>
            )}
          </div>

          {/* Difficulty */}
          <div className="text-[#94A3B8] text-[11px] font-medium">
            ◉ {difficultyLabel[room.settings.difficulty] || room.settings.difficulty}
          </div>
        </div>
      </div>

      {/* Right Action & Status Badge */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#CBD5E1]/80">
        {/* Status Badge */}
        <div>
          {room.status === 'lobby' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              Aguardando jogadores
            </span>
          )}
        </div>

        {/* Join button */}
        <button
          onClick={() => onJoin(room)}
          disabled={isFull}
          className={`px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-full transition-all cursor-pointer disabled:cursor-not-allowed ${
            isFull
              ? 'bg-[#F1F5F9] text-[#64748B] border border-[#CBD5E1]'
              : 'bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-[0_2px_10px_rgba(59,130,246,0.25)] hover:shadow-[0_4px_14px_rgba(59,130,246,0.4)]'
          }`}
        >
          {isFull ? 'Sala cheia' : 'Entrar'}
        </button>
      </div>
    </div>
  );
};
