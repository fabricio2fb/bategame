'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  BookOpen,
  CheckSquare,
  Clock,
  Edit3,
  Gamepad2,
  List,
  MessageSquare,
  PenTool,
  Play,
  Shield,
  Sofa,
  Swords,
  Target,
  Users,
  Users2,
} from 'lucide-react';
import { RoomSettings } from '@/lib/types';

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Facil',
  medium: 'Media',
  hard: 'Dificil',
  mixed: 'Misturada',
};

const ANSWER_MODE_LABELS: Record<string, string> = {
  spoken: 'Resposta falada',
  'multiple-choice': 'Multipla escolha',
  written: 'Resposta escrita',
  mixed: 'Mista',
};

const SCORING_MODE_LABELS: Record<string, string> = {
  exact: 'Exato',
  approximate: 'Aproximado',
};

const GAME_MODE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  classic: { label: 'Classico', icon: <Swords className="w-3.5 h-3.5" /> },
  teams: { label: 'Equipes', icon: <Users2 className="w-3.5 h-3.5" /> },
  couch: { label: 'Sofa', icon: <Sofa className="w-3.5 h-3.5" /> },
};

const BOARD_SIZE_LABELS: Record<string, string> = {
  small: 'Pequeno',
  medium: 'Medio',
  large: 'Grande',
};

interface LobbySettingsPanelProps {
  settings: RoomSettings;
  isHost: boolean;
  canStart: boolean;
  gameStarting: boolean;
  startDisabledReason: string | null;
  countdownActive: boolean;
  accentColor?: string;
  onEditSettings: () => void;
  onStartGame: () => void;
}

export const LobbySettingsPanel: React.FC<LobbySettingsPanelProps> = ({
  settings,
  isHost,
  canStart,
  gameStarting,
  startDisabledReason,
  countdownActive,
  accentColor = '#3B82F6',
  onEditSettings,
  onStartGame,
}) => {
  const gameType = settings.gameType || 'bateprimeiro';
  const isBatePrimeiro = gameType === 'bateprimeiro';
  const hasCategoryRoundConfig = gameType === 'qual-e-a-palavra' || gameType === 'quem-chega-mais-perto';
  const isDadoDeForca = gameType === 'dado-de-forca';
  const shouldShowScoringMode = gameType !== 'qual-e-a-palavra' && gameType !== 'tres-letras';

  return (
    <div
      className="bg-white/90 backdrop-blur-sm border-2 rounded-2xl overflow-hidden shadow-lg"
      style={{ borderColor: isBatePrimeiro ? 'rgba(0,0,0,0.15)' : `${accentColor}38` }}
    >
      <div className="p-4 border-b border-[#CBD5E1]/40 flex items-center justify-between">
        <h2 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Configuracoes</h2>
        {isHost && isBatePrimeiro && (
          <button
            onClick={onEditSettings}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-2.5">
        <SettingRow
          icon={<Shield className="w-3.5 h-3.5" />}
          label="Privacidade"
          value={settings.privacy === 'public' ? 'Publica' : 'Privada'}
        />
        <SettingRow icon={<Users className="w-3.5 h-3.5" />} label="Max. jogadores" value={String(settings.maxPlayers)} />

        {!isBatePrimeiro && (
          <>
            <SettingRow
              icon={GAME_MODE_LABELS[settings.gameMode || 'classic']?.icon || <Swords className="w-3.5 h-3.5" />}
              label="Modo"
              value={GAME_MODE_LABELS[settings.gameMode || 'classic']?.label || 'Classico'}
            />
            {settings.gameMode === 'teams' && settings.teamCount && (
              <SettingRow icon={<Users2 className="w-3.5 h-3.5" />} label="Times" value={`${settings.teamCount} times`} />
            )}
            {settings.gameMode === 'teams' && (
              <SettingRow
                icon={<Users2 className="w-3.5 h-3.5" />}
                label="Formacao"
                value={settings.teamAssignmentMode === 'manual' ? 'Jogadores escolhem' : 'Sorteio automatico'}
              />
            )}
            <SettingRow icon={<List className="w-3.5 h-3.5" />} label="Rodadas" value={String(settings.roundCount || 8)} />
            {gameType === 'tres-letras' && settings.endRoundOnFirstSubmit && (
              <SettingRow icon={<Clock className="w-3.5 h-3.5" />} label="Encerramento" value="Primeiro envio" />
            )}
            {hasCategoryRoundConfig && (
              <>
                <SettingRow
                  icon={settings.questionSource === 'custom' ? <PenTool className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                  label="Fonte"
                  value={settings.questionSource === 'custom' ? `Personalizado${settings.customContentTitle ? `: ${settings.customContentTitle}` : ''}` : 'Oficial'}
                />
                {settings.questionSource !== 'custom' && (
                  <>
                    <SettingRow
                      icon={<BookOpen className="w-3.5 h-3.5" />}
                      label="Categoria"
                      value={settings.category || settings.categories?.[0] || 'Tudo misturado'}
                    />
                    <SettingRow
                      icon={<BarChart3 className="w-3.5 h-3.5" />}
                      label="Dificuldade"
                      value={DIFFICULTY_LABELS[settings.difficulty] || settings.difficulty}
                    />
                  </>
                )}
                <SettingRow
                  icon={<Clock className="w-3.5 h-3.5" />}
                  label="Tempo/rodada"
                  value={`${settings.roundTimeSeconds || settings.answerTimeSeconds || 30}s`}
                />
              </>
            )}
            {isDadoDeForca && (
              <>
                <SettingRow
                  icon={<Gamepad2 className="w-3.5 h-3.5" />}
                  label="Tabuleiro"
                  value={BOARD_SIZE_LABELS[settings.boardSize || 'medium'] || 'Medio'}
                />
                <SettingRow
                  icon={<Clock className="w-3.5 h-3.5" />}
                  label="Carga maxima"
                  value={`${settings.maxChargeSeconds || 4}s`}
                />
              </>
            )}
            {shouldShowScoringMode && (
              <SettingRow
                icon={<Target className="w-3.5 h-3.5" />}
                label="Pontuacao"
                value={SCORING_MODE_LABELS[settings.scoringMode || 'approximate'] || 'Aproximado'}
              />
            )}
            {settings.targetTimeMode && (
              <SettingRow
                icon={<Clock className="w-3.5 h-3.5" />}
                label="Tempo alvo"
                value={
                  settings.targetTimeMode === 'manual'
                    ? `${settings.targetTimeRoundSeconds?.length || 0} tempos manuais`
                    : `${settings.targetTimeMinSeconds || 5}-${settings.targetTimeMaxSeconds || 30}s`
                }
              />
            )}
          </>
        )}

        {isBatePrimeiro && (
          <>
            <SettingRow
              icon={GAME_MODE_LABELS[settings.gameMode || 'classic']?.icon || <Swords className="w-3.5 h-3.5" />}
              label="Modo"
              value={GAME_MODE_LABELS[settings.gameMode || 'classic']?.label || 'Classico'}
            />
            {settings.questionSource !== 'custom' && (
              <SettingRow
                icon={<BookOpen className="w-3.5 h-3.5" />}
                label="Categorias"
                value={settings.categories.slice(0, 2).join(', ') + (settings.categories.length > 2 ? ` +${settings.categories.length - 2}` : '')}
              />
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
            <SettingRow icon={<Clock className="w-3.5 h-3.5" />} label="Tempo resposta" value={`${settings.answerTimeSeconds || 15}s`} />
            <SettingRow
              icon={settings.answerMode === 'spoken' ? <MessageSquare className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
              label="Resposta"
              value={ANSWER_MODE_LABELS[settings.answerMode] || settings.answerMode}
            />
          </>
        )}
      </div>

      {isHost && (
        <div className="p-4 pt-0 space-y-2">
          <button
            onClick={onStartGame}
            disabled={!canStart || countdownActive}
            className={`w-full py-3.5 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed relative overflow-hidden ${
              canStart && !countdownActive
                ? 'text-white active:scale-[0.98]'
                : 'bg-[#E2E8F0] text-[#94A3B8]'
            }`}
            style={canStart && !countdownActive ? { backgroundColor: accentColor, boxShadow: `0 4px 18px ${accentColor}55` } : undefined}
          >
            {canStart && !countdownActive && (
              <motion.div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity" />
            )}
            <span className="relative flex items-center gap-2">
              {gameStarting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Iniciar partida
                </>
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
