import type { StateCreator } from "zustand";
import type { Effect, StatKey } from "../effects";
import type { ResourceId } from "../resources";

export type ResourceAmounts = Record<ResourceId, number>;
export type BaseStats = Partial<Record<StatKey, number>>;
export type DiscoveredMap = Record<ResourceId, boolean>;
export type OwnedUpgrades = Record<string, boolean>;
export type AutoEnabled = Record<string, boolean>;

export type GatherState = {
  activeNodeId: string | null;
  gatherLastTickAt: number | null; // ms timestamp used for offline catch-up
  gatherProgress01: number; // 0..1 for UI
};

export type GameState = {
  resources: ResourceAmounts;
  discovered: DiscoveredMap;
  unlockedNodes: Record<string, boolean>;

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

export type GameSlice<K extends keyof GameState> = StateCreator<GameState, [], [], Pick<GameState, K>>;
