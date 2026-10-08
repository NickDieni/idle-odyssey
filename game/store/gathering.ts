import { clamp01 } from "../format";
import type { StatKey } from "../effects";
import { pruneExpiredEffects, resolveStat } from "../resolve";
import { GATHER_NODES } from "../nodes";
import { rollFish } from "../fishing";
import { isNodeUnlocked, unlockNodes } from "../progression";
import type { GameSlice } from "./types";

export const createGatheringSlice: GameSlice<"setActiveNodeId" | "tick"> = (set) => ({
  setActiveNodeId: (id) =>
    set(() => {
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

  // Use wall-clock time so gathering also catches up after time away.
  tick: () =>
    set((state) => {
      const now = Date.now();
      const effects = pruneExpiredEffects(state.effects, now);

      // ----- Background gathering engine -----
      const activeId = state.gather.activeNodeId;
      if (!activeId) {
        return { effects };
      }

      const node = GATHER_NODES[activeId];
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

      // Keep locked nodes selected, but reset their progress.
      if (!isNodeUnlocked(node, state.resources, state.unlockedNodes)) {
        return {
          effects,
          gather: { ...state.gather, gatherProgress01: 0, gatherLastTickAt: now },
        };
      }

      // Snapshot last tick time; if null, initialize
      const last = state.gather.gatherLastTickAt ?? now;
      const elapsedMs = Math.max(0, now - last);

      // Resolve speed stat
      // - For wood/mining: default prod.<resourceId>.speed
      // - For fishing: default prod.fishing.speed (or node.speedStatKey override)
      const speedKey = (node.speedStatKey ??
        (node.category === "fishing"
          ? "prod.fishing.speed"
          : `prod.${node.resourceId}.speed`)) as StatKey;

      const speedMult = resolveStat(
        state.baseStats[speedKey] ?? 1,
        speedKey,
        effects,
      );

      const xpMult = resolveStat(
        state.baseStats["xp.gain.mult"] ?? 1,
        "xp.gain.mult",
        effects,
      );

      const xpPerCompletion = Math.max(0, node.xp * xpMult);

      const durationMs = Math.max(
        50,
        (node.durationSeconds / Math.max(0.01, speedMult)) * 1000,
      );

      // Current progress (0..durationMs) + elapsed
      const currentProgressMs = state.gather.gatherProgress01 * durationMs;
      const totalMs = currentProgressMs + elapsedMs;

      const completed = Math.floor(totalMs / durationMs);
      const remainderMs = totalMs - completed * durationMs;
      const nextProgress01 = clamp01(remainderMs / durationMs);

      // No completions: just advance timing/progress
      if (!(completed > 0)) {
        return {
          effects,
          gather: {
            activeNodeId: state.gather.activeNodeId,
            gatherLastTickAt: now,
            gatherProgress01: nextProgress01,
          },
        };
      }

      // From here: we have 1+ completions to award
      let nextResources = state.resources;
      let nextDiscovered = state.discovered;

      // Always grant XP for completions
      nextResources = {
        ...nextResources,
        xp: (nextResources.xp ?? 0) + xpPerCompletion * completed,
      };

      if (node.category === "fishing") {

        // Award 1 fish per completion
        for (let i = 0; i < completed; i++) {
          const fishId = rollFish(node.fishTable);
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
        // Woodcutting and mining award the configured resource.
        const amountKey = (node.amountStatKey ??
          `prod.${node.resourceId}.amount`) as StatKey;
        const multKey = (node.multStatKey ??
          `prod.${node.resourceId}.mult`) as StatKey;

        const amountAdd = resolveStat(
          state.baseStats[amountKey] ?? 0,
          amountKey,
          effects,
        );
        const amountMult = resolveStat(
          state.baseStats[multKey] ?? 1,
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
        unlockedNodes: unlockNodes(nextResources, state.unlockedNodes),
        discovered: nextDiscovered,
        gather: {
          activeNodeId: state.gather.activeNodeId,
          gatherLastTickAt: now,
          gatherProgress01: nextProgress01,
        },
      };
    }),

});
