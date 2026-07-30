export type ReactionTimeMs = number;

export function clampReactionTime(ms: number): ReactionTimeMs {
  if (!Number.isFinite(ms) || ms < 0 || ms > 60000) return 0;
  return ms;
}

export function formatReactionTime(ms: ReactionTimeMs): string {
  const clamped = clampReactionTime(ms);
  if (clamped === 0) return '0,000s';
  return `${(clamped / 1000).toFixed(3)}s`.replace('.', ',');
}

export function formatReactionTimeShort(ms: ReactionTimeMs): string {
  const clamped = clampReactionTime(ms);
  if (clamped === 0) return '0ms';
  if (clamped < 1000) return `${Math.round(clamped)}ms`;
  return `${(clamped / 1000).toFixed(2)}s`.replace('.', ',');
}
