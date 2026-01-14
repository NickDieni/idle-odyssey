'use client';

import { create } from 'zustand';
import type { Effect, StatKey } from './effects';
import { pruneExpiredEffects, resolveStat } from './resolve';

type ResourceAmounts = Record<string, number>;
type BaseStats = Partial<Record<StatKey, number>>;

type GameState = {
  resources: ResourceAmounts;
  baseStats: BaseStats;
  effects: Effect[];

  getStat: (stat: StatKey) => number;

  addResource: (id: string, amount: number) => void;
  setBaseStat: (stat: StatKey, value: number) => void;

  addEffect: (effect: Effect) => void;
  removeEffect: (effectId: string) => void;
  tick: (dtSeconds: number) => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  resources: { gold: 0, gems: 0, energy: 0 },
  baseStats: {
    'prod.gold': 1,   // 1 gold/sec base
    'prod.gems': 0,
    'cap.energy': 100,
  },
  effects: [],

  getStat: (stat) => {
    const base = get().baseStats[stat] ?? 0;
    return resolveStat(base, stat, get().effects);
  },

  addResource: (id, amount) =>
    set((s) => ({
      resources: { ...s.resources, [id]: (s.resources[id] ?? 0) + amount },
    })),

  setBaseStat: (stat, value) =>
    set((s) => ({ baseStats: { ...s.baseStats, [stat]: value } })),

  addEffect: (effect) =>
    set((s) => {
      // stacking behavior: if same id exists, stack it
      const idx = s.effects.findIndex(e => e.id === effect.id);
      if (idx === -1) return { effects: [...s.effects, { ...effect, stacks: effect.stacks ?? 1 }] };

      const current = s.effects[idx];
      const maxStacks = current.maxStacks ?? effect.maxStacks;
      const nextStacks = Math.min((current.stacks ?? 1) + (effect.stacks ?? 1), maxStacks ?? Infinity);

      const updated = { ...current, ...effect, stacks: nextStacks };
      const copy = s.effects.slice();
      copy[idx] = updated;
      return { effects: copy };
    }),

  removeEffect: (effectId) =>
    set((s) => ({ effects: s.effects.filter((e) => e.id !== effectId) })),

  tick: (dtSeconds) =>
    set((s) => {
      const now = Date.now();
      const effects = pruneExpiredEffects(s.effects, now);

      // Example: apply production every tick
      const goldPerSec = resolveStat(s.baseStats['prod.gold'] ?? 0, 'prod.gold', effects);
      const gemsPerSec = resolveStat(s.baseStats['prod.gems'] ?? 0, 'prod.gems', effects);

      return {
        effects,
        resources: {
          ...s.resources,
          gold: (s.resources.gold ?? 0) + goldPerSec * dtSeconds,
          gems: (s.resources.gems ?? 0) + gemsPerSec * dtSeconds,
        },
      };
    }),
}));
