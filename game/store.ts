import { create } from "zustand";
import type { Effect, StatKey } from "./effects";
import { pruneExpiredEffects, resolveStat } from "./resolve";
import { RESOURCES, type ResourceId } from "./resources";
import { UPGRADES } from "@/game/upgrades";
import type { Cost } from "@/game/upgrades";

type ResourceAmounts = Record<ResourceId, number>;
type BaseStats = Partial<Record<StatKey, number>>;
type DiscoveredMap = Record<ResourceId, boolean>;
type OwnedUpgrades = Record<string, boolean>;
type AutoEnabled = Record<string, boolean>;

function buildInitialDiscovered(): DiscoveredMap {
  const initial = {} as DiscoveredMap;
  (Object.keys(RESOURCES) as ResourceId[]).forEach((id) => {
    initial[id] = !!RESOURCES[id].startsDiscovered;
  });
  return initial;
}

function canAfford(resources: Record<string, number>, cost: Cost): boolean {
  return Object.entries(cost).every(
    ([rid, amount]) => (resources[rid] ?? 0) >= amount
  );
}

function payCost(resources: ResourceAmounts, cost: Cost): ResourceAmounts {
  const next = { ...resources };
  for (const [rid, amount] of Object.entries(cost)) {
    next[rid as ResourceId] = (next[rid as ResourceId] ?? 0) - (amount ?? 0);
  }
  return next;
}
type GameState = {
  resources: ResourceAmounts;
  discovered: DiscoveredMap;

  baseStats: BaseStats;
  effects: Effect[];

  ownedUpgrades: OwnedUpgrades;
  autoUnlocked: AutoEnabled;
  autoEnabled: AutoEnabled;

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

  buyUpgrade: (upgradeId: string) => boolean;
  toggleAuto: (nodeId: string) => void;
  isAutoAvailable: (nodeId: string) => boolean;

  tick: (dtSeconds: number) => void;
};

export const useGameStore = create<GameState>((set, get) =>   ({
  resources: {
    xp: 0,

    gold: 0,

    oak: 0,
    birch: 0,
    spruce: 0,

    stone: 0,
    iron: 0,
    copper: 0,
  },
  discovered: buildInitialDiscovered(),

  // Base “engine stats” (production per second, caps, etc.)
  baseStats: {
    // =========================
    // XP
    // =========================
    'xp.gain.mult': 1,

    // =========================
    // Tree Cutting
    // =========================
    'prod.oak.amount': 1,
    'prod.oak.mult': 1,
    'prod.oak.speed': 1,

      'prod.birch.amount': 0,
    'prod.birch.mult': 1,
    'prod.birch.speed': 1,

      'prod.spruce.amount': 0,
    'prod.spruce.mult': 1,
    'prod.spruce.speed': 1,

    // =========================
    // Mining
    // =========================
    'prod.stone.amount': 0,
    'prod.stone.mult': 1,
    'prod.stone.speed': 1,

    'prod.iron.amount': 0,
    'prod.iron.mult': 1,
    'prod.iron.speed': 1,

    'prod.copper.amount': 0,
    'prod.copper.mult': 1,
    'prod.copper.speed': 1,
  } as BaseStats,

  effects: [],

  ownedUpgrades: {},
  autoUnlocked: {},
  autoEnabled: {},

  isAutoAvailable: (nodeId) => !!get().autoUnlocked[nodeId],

  toggleAuto: (nodeId) =>
    set((s) => {
      if (!s.autoUnlocked[nodeId]) return s; // not unlocked yet
      return {
        autoEnabled: { ...s.autoEnabled, [nodeId]: !s.autoEnabled[nodeId] },
      };
    }),

  buyUpgrade: (upgradeId) => {
    const def = UPGRADES.find((u) => u.id === upgradeId);
    if (!def) return false;

    const state = get();
    if (state.ownedUpgrades[upgradeId]) return false;
    if (!canAfford(state.resources, def.cost)) return false;

    // Deduct cost and apply effects/unlocks
    set((s) => {
      const nextResources = payCost(s.resources, def.cost);

      // apply effects to effect list (permanent upgrades)
      const nextEffects = def.effects ? [...s.effects, ...def.effects] : s.effects;

      // unlock auto toggle for node
      const nextAutoUnlocked =
        def.unlocks?.autoNodeId
          ? { ...s.autoUnlocked, [def.unlocks.autoNodeId]: true }
          : s.autoUnlocked;

      return {
        resources: nextResources,
        effects: nextEffects,
        ownedUpgrades: { ...s.ownedUpgrades, [upgradeId]: true },
        autoUnlocked: nextAutoUnlocked,
      };
    });

    return true;
  },

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
      const oakPerSec = resolveStat(
        s.baseStats["prod.oak"] ?? 0,
        "prod.oak",
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
      const oakGain = s.discovered.oak ? oakPerSec * dtSeconds : 0;
      const stoneGain = s.discovered.stone ? stonePerSec * dtSeconds : 0;
      const ironGain = s.discovered.iron ? ironPerSec * dtSeconds : 0;
      const copperGain = s.discovered.copper ? copperPerSec * dtSeconds : 0;

      return {
        effects,
        resources: {
          ...s.resources,
          gold: s.resources.gold + goldGain,
          oak: s.resources.oak + oakGain,
          stone: s.resources.stone + stoneGain,
          iron: s.resources.iron + ironGain,
          copper: s.resources.copper + copperGain,
        },
      };
    }),
}));
