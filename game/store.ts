import { create } from "zustand";
import type { Effect, StatKey } from "./effects";
import { pruneExpiredEffects, resolveStat } from "./resolve";
import { RESOURCES, type ResourceId } from "./resources";
import { UPGRADES } from "@/game/upgrades";
import type { Cost } from "@/game/upgrades";
import { SELL_PRICES } from "@/game/selling";
import { rollFish } from "@/game/fishing";
import { CRAFT_RECIPES, type CraftCost } from "@/game/crafting";


// IMPORTANT: you need a registry of nodes by id for the store to run gathering.
// Create this module to export your nodes.
// Adjust this import path to where you place it:
import { GATHER_NODES } from "@/game/nodes";
import type { AnyNode, FishingNode } from "@/game/types";

/* =======================
   Types
======================= */

type ResourceAmounts = Record<ResourceId, number>;
type BaseStats = Partial<Record<StatKey, number>>;
type DiscoveredMap = Record<ResourceId, boolean>;
type OwnedUpgrades = Record<string, boolean>;
type AutoEnabled = Record<string, boolean>;

type GatherState = {
  activeNodeId: string | null;
  gatherLastTickAt: number | null; // ms timestamp used for offline catch-up
  gatherProgress01: number; // 0..1 for UI
};

type GameState = {
  resources: ResourceAmounts;
  discovered: DiscoveredMap;

  baseStats: BaseStats;
  effects: Effect[];

  ownedUpgrades: OwnedUpgrades;
  autoUnlocked: AutoEnabled;
  autoEnabled: AutoEnabled;

  // gather engine
  gather: GatherState;
  setActiveNodeId: (id: string | null) => void;

  // queries
  getStat: (stat: StatKey) => number;
  isDiscovered: (id: ResourceId) => boolean;
  isAutoAvailable: (nodeId: string) => boolean;

  // resource actions
  addResource: (id: ResourceId, amount: number) => void;
  setResource: (id: ResourceId, amount: number) => void;
  canCraftRecipe: (recipeId: string) => boolean;
  craftRecipe: (recipeId: string) => boolean;

  // selling
  getSellValue: (id: ResourceId, amount?: number) => number;
  sellResource: (id: ResourceId, amount?: number) => number;

  // discovery actions
  discoverResource: (id: ResourceId) => void;

  // stat/effect actions
  setBaseStat: (stat: StatKey, value: number) => void;
  addEffect: (effect: Effect) => void;
  removeEffect: (effectId: string) => void;

  buyUpgrade: (upgradeId: string) => boolean;
  toggleAuto: (nodeId: string) => void;

  // engine tick
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
    ([rid, amt]) => (resources[rid] ?? 0) >= (amt ?? 0),
  );
}

function payCost(resources: ResourceAmounts, cost: Cost): ResourceAmounts {
  const next = { ...resources };
  for (const [rid, amt] of Object.entries(cost)) {
    next[rid as ResourceId] = (next[rid as ResourceId] ?? 0) - (amt ?? 0);
  }
  return next;
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function canPayCraftCost(resources: ResourceAmounts, cost: CraftCost): boolean {
  if (cost.type === "resource") {
    return (resources[cost.resourceId] ?? 0) >= cost.amount;
  }

  const total = cost.resourceIds.reduce((sum, id) => sum + (resources[id] ?? 0), 0);
  return total >= cost.amount;
}

function payCraftCost(resources: ResourceAmounts, cost: CraftCost): ResourceAmounts {
  const next = { ...resources };

  if (cost.type === "resource") {
    next[cost.resourceId] = (next[cost.resourceId] ?? 0) - cost.amount;
    return next;
  }

  let remaining = cost.amount;
  for (const id of cost.resourceIds) {
    if (remaining <= 0) break;
    const have = next[id] ?? 0;
    if (have <= 0) continue;

    const take = Math.min(have, remaining);
    next[id] = have - take;
    remaining -= take;
  }

  return next;
}

/* =======================
   Store
======================= */

export const useGameStore = create<GameState>((set, get) => ({
  resources: {
    xp: 0,
    gold: 0,
    oak: 0,
    birch: 0,
    spruce: 0,
    maple: 0,
    pebbles: 0,
    stone: 0,
    copper: 0,
    tin: 0,
    iron: 0,
    bronze_bar: 0,
    worm: 0,
    minifish: 0,
    smallfish: 0,
    goldfish: 0,
  },

  discovered: buildInitialDiscovered(),

  baseStats: {
    "xp.gain.mult": 1,

    // Wood stuff
    "prod.oak.amount": 0,
    "prod.oak.mult": 1,
    "prod.oak.speed": 1,

    "prod.birch.amount": 0,
    "prod.birch.mult": 1,
    "prod.birch.speed": 1,

    "prod.spruce.amount": 0,
    "prod.spruce.mult": 1,
    "prod.spruce.speed": 1,

    "prod.maple.amount": 0,
    "prod.maple.mult": 1,
    "prod.maple.speed": 1,

    // Mine stuff
    "prod.pebbles.amount": 0,
    "prod.pebbles.mult": 1,
    "prod.pebbles.speed": 1,

    "prod.stone.amount": 0,
    "prod.stone.mult": 1,
    "prod.stone.speed": 1,

    "prod.copper.amount": 0,
    "prod.copper.mult": 1,
    "prod.copper.speed": 1,

    "prod.tin.amount": 0,
    "prod.tin.mult": 1,
    "prod.tin.speed": 1,

    "prod.iron.amount": 0,
    "prod.iron.mult": 1,
    "prod.iron.speed": 1,


    // Fish stuff
    "prod.worm.amount": 0,
    "prod.worm.mult": 1,
    "prod.worm.speed": 1,

    "prod.minifish.amount": 0,
    "prod.minifish.mult": 1,
    "prod.minifish.speed": 1,

    "prod.smallfish.amount": 0,
    "prod.smallfish.mult": 1,
    "prod.smallfish.speed": 1,

    "prod.goldfish.amount": 0,
    "prod.goldfish.mult": 1,
    "prod.goldfish.speed": 1,
  } as BaseStats,

  effects: [],

  ownedUpgrades: {},
  autoUnlocked: {},
  autoEnabled: {},

  gather: {
    activeNodeId: null,
    gatherLastTickAt: null,
    gatherProgress01: 0,
  },

  /* ---------- Queries ---------- */

  getStat: (stat) => {
    const base = get().baseStats[stat] ?? 0;
    return resolveStat(base, stat, get().effects);
  },

  isDiscovered: (id) => !!get().discovered[id],
  isAutoAvailable: (nodeId) => !!get().autoUnlocked[nodeId],

  /* ---------- Active node (single source of truth) ---------- */

  setActiveNodeId: (id) =>
    set((s) => {
      const now = Date.now();
      return {
        gather: {
          activeNodeId: id,
          // reset timing when switching/selecting/deselecting
          gatherLastTickAt: id ? now : null,
          gatherProgress01: 0,
        },
      };
    }),

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

  canCraftRecipe: (recipeId) => {
    const recipe = CRAFT_RECIPES[recipeId];
    if (!recipe) return false;

    const resources = get().resources;
    return recipe.costs.every((cost) => canPayCraftCost(resources, cost));
  },

  craftRecipe: (recipeId) => {
    const recipe = CRAFT_RECIPES[recipeId];
    if (!recipe) return false;

    const resources = get().resources;
    const canCraft = recipe.costs.every((cost) => canPayCraftCost(resources, cost));
    if (!canCraft) return false;

    set((s) => {
      let nextResources = { ...s.resources };

      for (const cost of recipe.costs) {
        nextResources = payCraftCost(nextResources, cost);
      }

      nextResources[recipe.output.resourceId] =
        (nextResources[recipe.output.resourceId] ?? 0) + recipe.output.amount;

      return {
        resources: nextResources,
        discovered: {
          ...s.discovered,
          [recipe.output.resourceId]: true,
        },
      };
    });

    return true;
  },

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
        return {
          effects: [...s.effects, { ...effect, stacks: effect.stacks ?? 1 }],
        };
      }

      const cur = s.effects[idx];
      const max = cur.maxStacks ?? effect.maxStacks;
      const stacks = Math.min(
        (cur.stacks ?? 1) + (effect.stacks ?? 1),
        max ?? Infinity,
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
      const nextEffects = def.effects
        ? [...s.effects, ...def.effects]
        : s.effects;

      const nextAutoUnlocked = def.unlocks?.autoNodeId
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

  /* ---------- Tick (includes background/offscreen gathering) ---------- */

 tick: (dtSeconds) =>
  set((s) => {
    const now = Date.now();
    const effects = pruneExpiredEffects(s.effects, now);

    // ----- Background gathering engine -----
    const activeId = s.gather.activeNodeId;
    if (!activeId) {
      return { effects };
    }

    const node = GATHER_NODES[activeId] as AnyNode | undefined;
    if (!node) {
      // invalid id; stop safely
      return {
        effects,
        gather: {
          activeNodeId: null,
          gatherLastTickAt: null,
          gatherProgress01: 0,
        },
      };
    }

    // If locked, stop (or you can keep selected but not running)
    if (node.requirement.type === "resource_amount") {
      const have = s.resources[node.requirement.resourceId] ?? 0;
      if (have < node.requirement.amount) {
        return {
          effects,
          gather: { ...s.gather, gatherProgress01: 0, gatherLastTickAt: now },
        };
      }
    }

    // Snapshot last tick time; if null, initialize
    const last = s.gather.gatherLastTickAt ?? now;
    const elapsedMs = Math.max(0, now - last);

    // Resolve speed stat
    // - For wood/mining: default prod.<resourceId>.speed
    // - For fishing: default prod.fishing.speed (or node.speedStatKey override)
    const speedKey = (node.speedStatKey ??
      (node.category === "fishing"
        ? "prod.fishing.speed"
        : `prod.${node.resourceId}.speed`)) as StatKey;

    const speedMult = resolveStat(
      s.baseStats[speedKey] ?? 1,
      speedKey,
      effects,
    );

    const xpMult = resolveStat(
      s.baseStats["xp.gain.mult"] ?? 1,
      "xp.gain.mult",
      effects,
    );

    const xpPerCompletion = Math.max(0, node.xp * xpMult);

    const durationMs = Math.max(
      50,
      (node.durationSeconds / Math.max(0.01, speedMult)) * 1000,
    );

    // Current progress (0..durationMs) + elapsed
    const currentProgressMs = s.gather.gatherProgress01 * durationMs;
    const totalMs = currentProgressMs + elapsedMs;

    const completed = Math.floor(totalMs / durationMs);
    const remainderMs = totalMs - completed * durationMs;
    const nextProgress01 = clamp01(remainderMs / durationMs);

    const hasAward = completed > 0;

    // No completions: just advance timing/progress
    if (!hasAward) {
      return {
        effects,
        gather: {
          activeNodeId: s.gather.activeNodeId,
          gatherLastTickAt: now,
          gatherProgress01: nextProgress01,
        },
      };
    }

    // From here: we have 1+ completions to award
    let nextResources = s.resources;
    let nextDiscovered = s.discovered;

    // Always grant XP for completions
    nextResources = {
      ...nextResources,
      xp: (nextResources.xp ?? 0) + xpPerCompletion * completed,
    };

    if (node.category === "fishing") {
      const fnode = node as FishingNode;

      // Award 1 fish per completion
      for (let i = 0; i < completed; i++) {
        const fishId = rollFish(fnode.fishTable);
        if (!fishId) continue;

        nextResources = {
          ...nextResources,
          [fishId]: (nextResources[fishId] ?? 0) + 1,
        };

        if (!nextDiscovered[fishId]) {
          nextDiscovered = { ...nextDiscovered, [fishId]: true };
        }
      }
    } else {
      // Woodcutting/mining: preserve your existing amount/mult logic
      const amountKey = (node.amountStatKey ??
        `prod.${node.resourceId}.amount`) as StatKey;
      const multKey = (node.multStatKey ??
        `prod.${node.resourceId}.mult`) as StatKey;

      const amountAdd = resolveStat(
        s.baseStats[amountKey] ?? 0,
        amountKey,
        effects,
      );
      const amountMult = resolveStat(
        s.baseStats[multKey] ?? 1,
        multKey,
        effects,
      );

      const reward = Math.max(0, (node.rewardAmount + amountAdd) * amountMult);

      nextResources = {
        ...nextResources,
        [node.resourceId]:
          (nextResources[node.resourceId] ?? 0) + reward * completed,
      };

      if (!nextDiscovered[node.resourceId]) {
        nextDiscovered = { ...nextDiscovered, [node.resourceId]: true };
      }
    }

    return {
      effects,
      resources: nextResources,
      discovered: nextDiscovered,
      gather: {
        activeNodeId: s.gather.activeNodeId,
        gatherLastTickAt: now,
        gatherProgress01: nextProgress01,
      },
    };
  }),
}));
