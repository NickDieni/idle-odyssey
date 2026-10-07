import { UPGRADES } from "../upgrades";
import { canAfford, payCost } from "./costs";
import type { GameSlice } from "./types";

export const createUpgradeSlice: GameSlice<"isAutoAvailable" | "toggleAuto" | "buyUpgrade"> = (set, get) => ({
  isAutoAvailable: (nodeId) => !!get().autoUnlocked[nodeId],
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

});
