import type { CouchPlayer, CouchStartOptions } from '@/hooks/useCouchGame';

const COUCH_MATCH_CONFIG_KEY = 'bateprimeiro_couch_match_config';

function isValidPlayer(player: CouchPlayer): boolean {
  if (!player || typeof player.id !== 'string' || typeof player.name !== 'string') return false;
  if (!player.control || typeof player.control.type !== 'string') return false;
  if (player.control.type === 'keyboard' && typeof player.control.key !== 'string') return false;
  if (player.control.type === 'touch' && typeof player.control.zoneIndex !== 'number') return false;
  return true;
}

export function saveCouchMatchConfig(config: CouchStartOptions): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(COUCH_MATCH_CONFIG_KEY, JSON.stringify(config));
}

export function loadCouchMatchConfig(): CouchStartOptions | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(COUCH_MATCH_CONFIG_KEY);
    if (!raw) return null;
    const config = JSON.parse(raw) as CouchStartOptions;
    if (!Array.isArray(config.players) || config.players.length < 2) return null;
    if (!config.players.every(isValidPlayer)) return null;
    if (config.source !== 'official' && config.source !== 'custom') return null;
    if (config.inputMode !== 'keyboard' && config.inputMode !== 'touch-zones') return null;
    return config;
  } catch {
    return null;
  }
}

export function clearCouchMatchConfig(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(COUCH_MATCH_CONFIG_KEY);
}
