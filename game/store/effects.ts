import { resolveStat } from "../resolve";
import type { GameSlice } from "./types";

export const createEffectSlice: GameSlice<"getStat" | "setBaseStat" | "addEffect" | "removeEffect"> = (set, get) => ({
  getStat: (stat) => {
    const base = get().baseStats[stat] ?? 0;
    return resolveStat(base, stat, get().effects);
  },

  setBaseStat: (stat, value) =>
    set((state) => ({ baseStats: { ...state.baseStats, [stat]: value } })),

  addEffect: (effect) =>
    set((state) => {
      const index = state.effects.findIndex((e) => e.id === effect.id);
      if (index === -1) {
        return {
          effects: [...state.effects, { ...effect, stacks: effect.stacks ?? 1 }],
        };
      }

      const current = state.effects[index];
      const maxStacks = current.maxStacks ?? effect.maxStacks;
      const stacks = Math.min(
        (current.stacks ?? 1) + (effect.stacks ?? 1),
        maxStacks ?? Infinity,
      );

      const copy = state.effects.slice();
      copy[index] = { ...current, ...effect, stacks };
      return { effects: copy };
    }),

  removeEffect: (effectId) =>
    set((state) => ({ effects: state.effects.filter((e) => e.id !== effectId) })),

});
