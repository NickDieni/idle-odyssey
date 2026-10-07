import { create } from "zustand";
import type { GameState } from "./store/types";
import { createInitialState } from "./store/initial-state";
import { createResourceSlice } from "./store/resources";
import { createCraftingSlice } from "./store/crafting";
import { createEffectSlice } from "./store/effects";
import { createUpgradeSlice } from "./store/upgrades";
import { createGatheringSlice } from "./store/gathering";

export const useGameStore = create<GameState>((...args) => ({
  ...createInitialState(),
  ...createResourceSlice(...args),
  ...createCraftingSlice(...args),
  ...createEffectSlice(...args),
  ...createUpgradeSlice(...args),
  ...createGatheringSlice(...args),
}));
