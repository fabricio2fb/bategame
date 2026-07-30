export const ROOM_CODE_LENGTH = 5;
export const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/;

export function normalizeRoomCode(code: unknown): string {
  return typeof code === 'string' ? code.trim().replace(/\s+/g, '').toUpperCase() : '';
}

export function isValidRoomCode(code: unknown): boolean {
  return ROOM_CODE_PATTERN.test(normalizeRoomCode(code));
}
