import { RESOURCES, type ResourceId } from "../resources";
import type { BaseStats, DiscoveredMap, GameState, ResourceAmounts } from "./types";

const productionResources = [
  "oak", "birch", "spruce", "maple",
  "pebbles", "stone", "copper", "tin", "iron",
  "worm", "minifish", "smallfish", "goldfish",
];

type InitialState = Pick<GameState,
  "resources" | "discovered" | "unlockedNodes" | "baseStats" | "effects" |
  "ownedUpgrades" | "autoUnlocked" | "autoEnabled" | "gather"
>;

export function createInitialState(): InitialState {
  const resourceIds = Object.keys(RESOURCES) as ResourceId[];
  const productionStats = Object.fromEntries(productionResources.flatMap((id) => [
    [`prod.${id}.amount`, 0],
    [`prod.${id}.mult`, 1],
    [`prod.${id}.speed`, 1],
  ]));

  return {
    resources: Object.fromEntries(resourceIds.map((id) => [id, 0])) as ResourceAmounts,
    discovered: Object.fromEntries(resourceIds.map((id) => [id, !!RESOURCES[id].startsDiscovered])) as DiscoveredMap,
    baseStats: { "xp.gain.mult": 1, ...productionStats } as BaseStats,
    effects: [],
    unlockedNodes: {},
    ownedUpgrades: {},
    autoUnlocked: {},
    autoEnabled: {},
    gather: {
      activeNodeId: null,
      gatherLastTickAt: null,
      gatherProgress01: 0,
    },
  };
}
