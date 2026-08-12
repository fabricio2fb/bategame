import type { ReactNode } from 'react';
import type { RoomSettings, RoomStatus, Team } from '@/lib/types';

export interface RuntimeScore {
  playerId: string;
  name: string;
  avatarUrl?: string;
  score: number;
}

export interface PartidaShellProps {
  roomCode: string;
  gameTitle: string;
  category?: string;
  status: RoomStatus | 'loading' | 'error';
  questionNumber: number;
  totalQuestions: number;
  timer: number;
  soundOn: boolean;
  currentPlayerId: string | null;
  isHost: boolean;
  scores: RuntimeScore[];
  teamScores?: Array<{ teamId: string; name: string; color: string; score: number; activePlayerId?: string }>;
  teams?: Team[];
  settings?: RoomSettings | null;
  settingsSummary?: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  sidePanel?: ReactNode;
  children: ReactNode;
  onToggleSound: () => void;
  onLeave: () => void;
  onRematch?: () => void;
}
