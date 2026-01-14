import type { Effect, StatKey } from './effects';

export function resolveStat(base: number, stat: StatKey, effects: Effect[]): number {
  // Gather relevant modifiers, respecting stacks
  const mods = effects.flatMap(e => {
    const stacks = Math.max(1, e.stacks ?? 1);
    return e.modifiers
      .filter(m => m.stat === stat)
      .map(m => ({ ...m, stacks }));
  });

  // Additives first
  const add = mods
    .filter(m => m.type === 'add')
    .reduce((sum, m) => sum + m.value * m.stacks, 0);

  // Multipliers are multiplied together (2x and 0.8x stack correctly)
  const mul = mods
    .filter(m => m.type === 'mul')
    .reduce((prod, m) => prod * Math.pow(m.value, m.stacks), 1);

  return (base + add) * mul;
}

export function pruneExpiredEffects(effects: Effect[], now: number): Effect[] {
  return effects.filter(e => e.expiresAt === undefined || e.expiresAt > now);
}
