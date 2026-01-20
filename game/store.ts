import { create } from "zustand";
import type { Effect, StatKey } from "./effects";
import { pruneExpiredEffects, resolveStat } from "./resolve";
import { RESOURCES, type ResourceId } from "./resources";
import { UPGRADES } from "@/game/upgrades";
import type { Cost } from "@/game/upgrades";
import { SELL_PRICES } from "@/game/selling";

/* =======================
   Types
======================= */

type ResourceAmounts = Record<ResourceId, number>;
type BaseStats = Partial<Record<StatKey, number>>;
type DiscoveredMap = Record<ResourceId, boolean>;
type OwnedUpgrades = Record<string, boolean>;
type AutoEnabled = Record<string, boolean>;

type GameState = {
  // Core state
  resources: ResourceAmounts;
  discovered: DiscoveredMap;

  // Progression
  baseStats: BaseStats;
  effects: Effect[];

  // Upgrades / automation
  ownedUpgrades: OwnedUpgrades;
  autoUnlocked: AutoEnabled;
  autoEnabled: AutoEnabled;

  // Global gather selection
  activeNodeId: string | null;
  setActiveNodeId: (id: string | null) => void;

  // Queries
  getStat: (stat: StatKey) => number;
  isDiscovered: (id: ResourceId) => boolean;
  isAutoAvailable: (nodeId: string) => boolean;

  // Resource actions
  addResource: (id: ResourceId, amount: number) => void;
  setResource: (id: ResourceId, amount: number) => void;

  // Selling
  getSellValue: (id: ResourceId, amount?: number) => number;
  sellResource: (id: ResourceId, amount?: number) => number;

  // Discovery
  discoverResource: (id: ResourceId) => void;

  // Effects / stats
  setBaseStat: (stat: StatKey, value: number) => void;
  addEffect: (effect: Effect) => void;
  removeEffect: (effectId: string) => void;

  // Upgrades / automation
  buyUpgrade: (upgradeId: string) => boolean;
  toggleAuto: (nodeId: string) => void;

  // Tick
  tick: (dtSeconds: number) => void;
};

/* =======================
   Helpers
======================= */

function buildInitialDiscovered(): DiscoveredMap {
  const initial = {} as DiscoveredMap;
  (Object.keys(RESOURCES) as ResourceId[]).forEach((id) => {
    initial[id] = !!RESOURCES[id].startsDiscovered;
  });
  return initial;
}

function canAfford(resources: Record<string, number>, cost: Cost): boolean {
  return Object.entries(cost).every(
    ([rid, amt]) => (resources[rid] ?? 0) >= (amt ?? 0)
  );
}

function payCost(resources: ResourceAmounts, cost: Cost): ResourceAmounts {
  const next = { ...resources };
  for (const [rid, amt] of Object.entries(cost)) {
    next[rid as ResourceId] = (next[rid as ResourceId] ?? 0) - (amt ?? 0);
  }
  return next;
}

/* =======================
   Store
======================= */

export const useGameStore = create<GameState>((set, get) => ({
  /* ---------- Core ---------- */

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

  baseStats: {
    "xp.gain.mult": 1,

    "prod.oak.amount": 0,
    "prod.oak.mult": 1,
    "prod.oak.speed": 1,

    "prod.birch.amount": 0,
    "prod.birch.mult": 1,
    "prod.birch.speed": 1,

    "prod.spruce.amount": 0,
    "prod.spruce.mult": 1,
    "prod.spruce.speed": 1,

    "prod.stone.amount": 0,
    "prod.stone.mult": 1,
    "prod.stone.speed": 1,

    "prod.iron.amount": 0,
    "prod.iron.mult": 1,
    "prod.iron.speed": 1,

    "prod.copper.amount": 0,
    "prod.copper.mult": 1,
    "prod.copper.speed": 1,
  } as BaseStats,

  effects: [],

  ownedUpgrades: {},
  autoUnlocked: {},
  autoEnabled: {},

  /* ---------- Active node ---------- */

  activeNodeId: null,
  setActiveNodeId: (id) => set({ activeNodeId: id }),

  /* ---------- Queries ---------- */

  getStat: (stat) => {
    const base = get().baseStats[stat] ?? 0;
    return resolveStat(base, stat, get().effects);
  },

  isDiscovered: (id) => !!get().discovered[id],
  isAutoAvailable: (nodeId) => !!get().autoUnlocked[nodeId],

  /* ---------- Resources ---------- */

  addResource: (id, amount) =>
    set((s) => ({
      resources: { ...s.resources, [id]: s.resources[id] + amount },
      discovered:
        amount > 0 && !s.discovered[id]
          ? { ...s.discovered, [id]: true }
          : s.discovered,
    })),

  setResource: (id, amount) =>
    set((s) => ({ resources: { ...s.resources, [id]: amount } })),

  /* ---------- Selling ---------- */

  getSellValue: (id, amount) => {
    const price = SELL_PRICES[id];
    if (!price) return 0;

    const owned = get().resources[id] ?? 0;
    const qty = Math.min(owned, amount ?? owned);
    return Math.floor(qty * price);
  },

  sellResource: (id, amount) => {
    const gain = get().getSellValue(id, amount);
    if (gain <= 0) return 0;

    set((s) => {
      const owned = s.resources[id] ?? 0;
      const qty = Math.min(owned, amount ?? owned);

      return {
        resources: {
          ...s.resources,
          [id]: owned - qty,
          gold: s.resources.gold + gain,
        },
      };
    });

    return gain;
  },

  /* ---------- Discovery ---------- */

  discoverResource: (id) =>
    set((s) => ({ discovered: { ...s.discovered, [id]: true } })),

  /* ---------- Effects / stats ---------- */

  setBaseStat: (stat, value) =>
    set((s) => ({ baseStats: { ...s.baseStats, [stat]: value } })),

  addEffect: (effect) =>
    set((s) => {
      const idx = s.effects.findIndex((e) => e.id === effect.id);
      if (idx === -1) {
        return { effects: [...s.effects, { ...effect, stacks: effect.stacks ?? 1 }] };
      }

      const cur = s.effects[idx];
      const max = cur.maxStacks ?? effect.maxStacks;
      const stacks = Math.min(
        (cur.stacks ?? 1) + (effect.stacks ?? 1),
        max ?? Infinity
      );

      const copy = s.effects.slice();
      copy[idx] = { ...cur, ...effect, stacks };
      return { effects: copy };
    }),

  removeEffect: (effectId) =>
    set((s) => ({ effects: s.effects.filter((e) => e.id !== effectId) })),

  /* ---------- Upgrades / automation ---------- */

  toggleAuto: (nodeId) =>
    set((s) => {
      if (!s.autoUnlocked[nodeId]) return s;
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

    set((s) => {
      const nextResources = payCost(s.resources, def.cost);
      const nextEffects = def.effects ? [...s.effects, ...def.effects] : s.effects;
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

  /* ---------- Tick ---------- */

  tick: (dtSeconds) =>
    set((s) => {
      const effects = pruneExpiredEffects(s.effects, Date.now());

      const oak = resolveStat(s.baseStats["prod.oak"] ?? 0, "prod.oak", effects);
      const birch = resolveStat(s.baseStats["prod.birch"] ?? 0, "prod.birch", effects);
      const spruce = resolveStat(s.baseStats["prod.spruce"] ?? 0, "prod.spruce", effects);

      const stone = resolveStat(s.baseStats["prod.stone"] ?? 0, "prod.stone", effects);
      const iron = resolveStat(s.baseStats["prod.iron"] ?? 0, "prod.iron", effects);
      const copper = resolveStat(s.baseStats["prod.copper"] ?? 0, "prod.copper", effects);

      return {
        effects,
        resources: {
          ...s.resources,
          oak: s.discovered.oak ? s.resources.oak + oak * dtSeconds : s.resources.oak,
          birch: s.discovered.birch ? s.resources.birch + birch * dtSeconds : s.resources.birch,
          spruce: s.discovered.spruce ? s.resources.spruce + spruce * dtSeconds : s.resources.spruce,
          stone: s.discovered.stone ? s.resources.stone + stone * dtSeconds : s.resources.stone,
          iron: s.discovered.iron ? s.resources.iron + iron * dtSeconds : s.resources.iron,
          copper: s.discovered.copper ? s.resources.copper + copper * dtSeconds : s.resources.copper,
        },
      };
    }),
}));
