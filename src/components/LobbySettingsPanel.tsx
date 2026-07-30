'use client';

import React from 'react';
import { Edit3, Play, Shield, BookOpen, List, BarChart3, Users, MessageSquare, CheckSquare, Swords, Users2, Sofa, Clock } from 'lucide-react';
import { RoomSettings } from '@/lib/types';
import { motion } from 'framer-motion';

const DIFFICULTY_LABELS: Record<string, string> = { easy: 'Fácil', medium: 'Média', hard: 'Difícil', mixed: 'Misturada' };
const ANSWER_MODE_LABELS: Record<string, string> = { spoken: 'Resposta falada', 'multiple-choice': 'Múltipla escolha' };
const GAME_MODE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  classic: { label: 'Clássico', icon: <Swords className="w-3.5 h-3.5" /> },
  teams: { label: 'Equipes', icon: <Users2 className="w-3.5 h-3.5" /> },
  couch: { label: 'Sofá', icon: <Sofa className="w-3.5 h-3.5" /> },
};

interface LobbySettingsPanelProps {
  settings: RoomSettings;
  isHost: boolean;
  canStart: boolean;
  gameStarting: boolean;
  startDisabledReason: string | null;
  countdownActive: boolean;
  onEditSettings: () => void;
  onStartGame: () => void;
}

export const LobbySettingsPanel: React.FC<LobbySettingsPanelProps> = ({
  settings, isHost, canStart, gameStarting, startDisabledReason, countdownActive, onEditSettings, onStartGame,
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm border-2 border-black/15 rounded-2xl overflow-hidden shadow-lg">
      <div className="p-4 border-b border-[#CBD5E1]/40 flex items-center justify-between">
        <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Configurações</h2>
        {isHost && (
          <button onClick={onEditSettings}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-all cursor-pointer">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="p-4 space-y-2.5">
        <SettingRow
          icon={GAME_MODE_LABELS[settings.gameMode || 'classic']?.icon || <Swords className="w-3.5 h-3.5" />}
          label="Modo"
          value={GAME_MODE_LABELS[settings.gameMode || 'classic']?.label || 'Clássico'}
        />
        <SettingRow icon={<Shield className="w-3.5 h-3.5" />} label="Privacidade" value={settings.privacy === 'public' ? 'Pública' : 'Privada'} />
        {settings.questionSource !== 'custom' && (
          <SettingRow icon={<BookOpen className="w-3.5 h-3.5" />} label="Categorias" value={settings.categories.slice(0, 2).join(', ') + (settings.categories.length > 2 ? ` +${settings.categories.length - 2}` : '')} />
        )}
        {settings.questionSource !== 'custom' && (
          <SettingRow icon={<List className="w-3.5 h-3.5" />} label="Perguntas" value={String(settings.questionCount)} />
        )}
        {settings.questionSource !== 'custom' && (
          <SettingRow icon={<BarChart3 className="w-3.5 h-3.5" />} label="Dificuldade" value={DIFFICULTY_LABELS[settings.difficulty] || settings.difficulty} />
        )}
        {settings.gameMode === 'teams' && settings.teamCount && (
          <SettingRow icon={<Users2 className="w-3.5 h-3.5" />} label="Times" value={`${settings.teamCount} times`} />
        )}
        <SettingRow icon={<Users className="w-3.5 h-3.5" />} label="Máx. jogadores" value={String(settings.maxPlayers)} />
        <SettingRow icon={<Clock className="w-3.5 h-3.5" />} label="Tempo resposta" value={`${settings.answerTimeSeconds || 15}s`} />
        <SettingRow icon={settings.answerMode === 'spoken' ? <MessageSquare className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
          label="Resposta" value={ANSWER_MODE_LABELS[settings.answerMode] || settings.answerMode} />
      </div>

      {isHost && (
        <div className="p-4 pt-0 space-y-2">
          <button onClick={onStartGame} disabled={!canStart || countdownActive}
            className={`w-full py-3.5 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed relative overflow-hidden ${
              canStart && !countdownActive
                ? 'bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-[0_4px_16px_rgba(59,130,246,0.35)] hover:shadow-[0_6px_24px_rgba(59,130,246,0.5)] active:scale-[0.98]'
                : 'bg-[#E2E8F0] text-[#94A3B8]'
            }`}>
            {canStart && !countdownActive && (
              <motion.div className="absolute inset-0 bg-[#2563EB] opacity-0 hover:opacity-100 transition-opacity" />
            )}
            <span className="relative flex items-center gap-2">
              {gameStarting ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Iniciando...</>
              ) : (
                <><Play className="w-4 h-4" />Iniciar partida</>
              )}
            </span>
          </button>
          {!canStart && !gameStarting && startDisabledReason && (
            <p className="text-[11px] text-[#EF4444] text-center font-medium">{startDisabledReason}</p>
          )}
        </div>
      )}
    </div>
  );
};

function SettingRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[#94A3B8] shrink-0">{icon}</span>
        <span className="text-xs text-[#64748B]">{label}</span>
      </div>
      <span className="text-xs font-semibold text-[#0F172A] text-right truncate max-w-[140px]">{value}</span>
    </div>
  );
}
