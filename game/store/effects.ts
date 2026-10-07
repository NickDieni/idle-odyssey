import { resolveStat } from "../resolve";
import type { GameSlice } from "./types";

export const createEffectSlice: GameSlice<"getStat" | "setBaseStat" | "addEffect" | "removeEffect"> = (set, get) => ({
  getStat: (stat) => {
    const base = get().baseStats[stat] ?? 0;
    return resolveStat(base, stat, get().effects);
  },

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

});
