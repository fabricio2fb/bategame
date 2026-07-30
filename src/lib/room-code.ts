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

export function getGamePath(code: string): string {
  const normalized = normalizeRoomCode(code);
  if (!isValidRoomCode(normalized)) return '/';
  return `/partida/${normalized}`;
}
