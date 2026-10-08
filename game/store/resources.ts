import { SELL_PRICES } from "../selling";
import { unlockNodes } from "../progression";
import type { GameSlice } from "./types";

export const createResourceSlice: GameSlice<"isDiscovered" | "addResource" | "setResource" | "getSellValue" | "sellResource" | "discoverResource"> = (set, get) => ({
  isDiscovered: (id) => !!get().discovered[id],
  addResource: (id, amount) =>
    set((state) => {
      const resources = { ...state.resources, [id]: state.resources[id] + amount };
      return {
        resources,
        unlockedNodes: unlockNodes(resources, state.unlockedNodes),
        discovered:
          amount > 0 && !state.discovered[id]
            ? { ...state.discovered, [id]: true }
            : state.discovered,
      };
    }),

  setResource: (id, amount) =>
    set((state) => {
      const resources = { ...state.resources, [id]: amount };
      return { resources, unlockedNodes: unlockNodes(resources, state.unlockedNodes) };
    }),

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

    set((state) => {
      const owned = state.resources[id] ?? 0;
      const qty = Math.min(owned, amount ?? owned);

      return {
        resources: {
          ...state.resources,
          [id]: owned - qty,
          gold: state.resources.gold + gain,
        },
      };
    });

    return gain;
  },

  /* ---------- Discovery ---------- */

  discoverResource: (id) =>
    set((state) => ({ discovered: { ...state.discovered, [id]: true } })),

});
