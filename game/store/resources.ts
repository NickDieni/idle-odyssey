import { SELL_PRICES } from "../selling";
import { unlockNodes } from "../progression";
import type { GameSlice } from "./types";

export const createResourceSlice: GameSlice<"isDiscovered" | "addResource" | "setResource" | "getSellValue" | "sellResource" | "discoverResource"> = (set, get) => ({
  isDiscovered: (id) => !!get().discovered[id],
  addResource: (id, amount) =>
    set((s) => ({
      resources: { ...s.resources, [id]: s.resources[id] + amount },
      unlockedNodes: unlockNodes({ ...s.resources, [id]: s.resources[id] + amount }, s.unlockedNodes),
      discovered:
        amount > 0 && !s.discovered[id]
          ? { ...s.discovered, [id]: true }
          : s.discovered,
    })),

  setResource: (id, amount) =>
    set((s) => ({
      resources: { ...s.resources, [id]: amount },
      unlockedNodes: unlockNodes({ ...s.resources, [id]: amount }, s.unlockedNodes),
    })),

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

});
