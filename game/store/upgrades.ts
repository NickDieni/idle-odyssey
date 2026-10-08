import { UPGRADES } from "../upgrades";
import { canAfford, payCost } from "./costs";
import type { GameSlice } from "./types";

export const createUpgradeSlice: GameSlice<"isAutoAvailable" | "toggleAuto" | "buyUpgrade"> = (set, get) => ({
  isAutoAvailable: (nodeId) => !!get().autoUnlocked[nodeId],
  toggleAuto: (nodeId) =>
    set((state) => {
      if (!state.autoUnlocked[nodeId]) return state;
      return {
        autoEnabled: { ...state.autoEnabled, [nodeId]: !state.autoEnabled[nodeId] },
      };
    }),

  buyUpgrade: (upgradeId) => {
    const def = UPGRADES.find((u) => u.id === upgradeId);
    if (!def) return false;

    const state = get();
    if (state.ownedUpgrades[upgradeId]) return false;
    if (!canAfford(state.resources, def.cost)) return false;

    set((state) => {
      const nextResources = payCost(state.resources, def.cost);
      const nextEffects = def.effects
        ? [...state.effects, ...def.effects]
        : state.effects;

      const nextAutoUnlocked = def.unlocks?.autoNodeId
        ? { ...state.autoUnlocked, [def.unlocks.autoNodeId]: true }
        : state.autoUnlocked;

      return {
        resources: nextResources,
        effects: nextEffects,
        ownedUpgrades: { ...state.ownedUpgrades, [upgradeId]: true },
        autoUnlocked: nextAutoUnlocked,
      };
    });

    return true;
  },

});
