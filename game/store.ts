import { create } from "zustand";
import type { Effect, StatKey } from "./effects";
import { pruneExpiredEffects, resolveStat } from "./resolve";
import { RESOURCES, type ResourceId } from "./resources";

type ResourceAmounts = Record<ResourceId, number>;
type BaseStats = Partial<Record<StatKey, number>>;
type DiscoveredMap = Record<ResourceId, boolean>;

function buildInitialDiscovered(): DiscoveredMap {
  const initial = {} as DiscoveredMap;
  (Object.keys(RESOURCES) as ResourceId[]).forEach((id) => {
    initial[id] = !!RESOURCES[id].startsDiscovered;
  });
  return initial;
}

type GameState = {
  resources: ResourceAmounts;
  discovered: DiscoveredMap;

  baseStats: BaseStats;
  effects: Effect[];

  // queries
  getStat: (stat: StatKey) => number;
  isDiscovered: (id: ResourceId) => boolean;

  // resource actions
  addResource: (id: ResourceId, amount: number) => void;
  setResource: (id: ResourceId, amount: number) => void;

  // discovery actions
  discoverResource: (id: ResourceId) => void;

  // stat/effect actions
  setBaseStat: (stat: StatKey, value: number) => void;
  addEffect: (effect: Effect) => void;
  removeEffect: (effectId: string) => void;

  tick: (dtSeconds: number) => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  resources: {
    gold: 0,
    wood: 0,
    stone: 0,
    iron: 0,
    copper: 0,
  },
  discovered: buildInitialDiscovered(),

  // Base “engine stats” (production per second, caps, etc.)
  baseStats: {
    "prod.gold": 1,
    "prod.wood": 1,
    "prod.stone": 1,
  } as BaseStats,

  effects: [],

  getStat: (stat) => {
    const base = get().baseStats[stat] ?? 0;
    return resolveStat(base, stat, get().effects);
  },

  isDiscovered: (id) => {
    return !!get().discovered[id];
  },

  discoverResource: (id) =>
    set((s) => ({
      discovered: { ...s.discovered, [id]: true },
    })),

  addResource: (id, amount) =>
    set((s) => {
      const nextAmount = s.resources[id] + amount;
      return {
        resources: { ...s.resources, [id]: nextAmount },
        discovered:
          amount > 0 && !s.discovered[id]
            ? { ...s.discovered, [id]: true }
            : s.discovered,
      };
    }),

  setResource: (id, amount) =>
    set((s) => ({
      resources: { ...s.resources, [id]: amount },
    })),

  setBaseStat: (stat, value) =>
    set((s) => ({ baseStats: { ...s.baseStats, [stat]: value } })),

  addEffect: (effect) =>
    set((s) => {
      const idx = s.effects.findIndex((e) => e.id === effect.id);
      if (idx === -1) {
        return {
          effects: [...s.effects, { ...effect, stacks: effect.stacks ?? 1 }],
        };
      }

      const current = s.effects[idx];
      const maxStacks = current.maxStacks ?? effect.maxStacks;
      const nextStacks = Math.min(
        (current.stacks ?? 1) + (effect.stacks ?? 1),
        maxStacks ?? Infinity
      );

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

      // Effective production rates
      const goldPerSec = resolveStat(
        s.baseStats["prod.gold"] ?? 0,
        "prod.gold",
        effects
      );
      const woodPerSec = resolveStat(
        s.baseStats["prod.wood"] ?? 0,
        "prod.wood",
        effects
      );
      const stonePerSec = resolveStat(
        s.baseStats["prod.stone"] ?? 0,
        "prod.stone",
        effects
      );
      const ironPerSec = resolveStat(
        s.baseStats["prod.iron"] ?? 0,
        "prod.iron",
        effects
      );
      const copperPerSec = resolveStat(
        s.baseStats["prod.copper"] ?? 0,
        "prod.copper",
        effects
      );

      // If you want to prevent production before discovery, gate it:
      const goldGain = s.discovered.gold ? goldPerSec * dtSeconds : 0;
      const woodGain = s.discovered.wood ? woodPerSec * dtSeconds : 0;
      const stoneGain = s.discovered.stone ? stonePerSec * dtSeconds : 0;
      const ironGain = s.discovered.iron ? ironPerSec * dtSeconds : 0;
      const copperGain = s.discovered.copper ? copperPerSec * dtSeconds : 0;

      return {
        effects,
        resources: {
          gold: s.resources.gold + goldGain,
          wood: s.resources.wood + woodGain,
          stone: s.resources.stone + stoneGain,
          iron: s.resources.iron + ironGain,
          copper: s.resources.copper + copperGain,
        },
      };
    }),
}));
