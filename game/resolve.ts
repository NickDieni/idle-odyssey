import type { Effect, StatKey } from './effects';

export function resolveStat(base: number, stat: StatKey, effects: Effect[]): number {
  let added = 0;
  let multiplier = 1;

  for (const effect of effects) {
    const stacks = Math.max(1, effect.stacks ?? 1);
    for (const modifier of effect.modifiers) {
      if (modifier.stat !== stat) continue;
      if (modifier.type === 'add') added += modifier.value * stacks;
      if (modifier.type === 'mul') multiplier *= Math.pow(modifier.value, stacks);
    }
  }

  // Apply additions before multipliers. Legacy "speed" modifiers are ignored.
  return (base + added) * multiplier;
}

export function pruneExpiredEffects(effects: Effect[], now: number): Effect[] {
  return effects.filter(e => e.expiresAt === undefined || e.expiresAt > now);
}
