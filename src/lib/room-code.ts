import type { GameType } from './types';

export const ROOM_CODE_LENGTH = 5;
export const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/;

export function normalizeRoomCode(code: string | null | undefined): string {
  return (code ?? '').trim().replace(/\s+/g, '').toUpperCase();
}

export function sanitizeRoomCodeInput(code: string): string {
  const allowed = new RegExp(`[^${ROOM_CODE_CHARS}]`, 'g');
  return normalizeRoomCode(code).replace(allowed, '').slice(0, ROOM_CODE_LENGTH);
}

export function isValidRoomCode(code: string | null | undefined): boolean {
  return ROOM_CODE_PATTERN.test(normalizeRoomCode(code));
}

export function getRoomPath(code: string): string {
  const normalized = normalizeRoomCode(code);
  if (!isValidRoomCode(normalized)) return '/entrar';
  return `/sala/${normalized}`;
}

export function getGamePath(code: string, gameType: GameType = 'bateprimeiro'): string {
  const normalized = normalizeRoomCode(code);
  if (!isValidRoomCode(normalized)) return '/bateprimeiro';

  if (gameType === 'quem-chega-mais-perto') {
    return `/partida/quem-chega-mais-perto/${normalized}`;
  }

  if (gameType === 'qual-e-a-palavra') {
    return `/partida/qual-e-a-palavra/${normalized}`;
  }

  if (gameType === 'bate-o-tempo') {
    return `/partida/bate-o-tempo/${normalized}`;
  }

  if (gameType === 'tres-letras') {
    return `/partida/tres-letras/${normalized}`;
  }

  return `/partida/bateprimeiro/${normalized}`;
}
