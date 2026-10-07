import { CRAFT_RECIPES } from "../crafting";
import { unlockNodes } from "../progression";
import { canPayCraftCost, payCraftCost } from "./costs";
import type { GameSlice } from "./types";

export const createCraftingSlice: GameSlice<"canCraftRecipe" | "craftRecipe"> = (set, get) => ({
  canCraftRecipe: (recipeId) => {
    const recipe = CRAFT_RECIPES[recipeId];
    if (!recipe) return false;

    const resources = get().resources;
    return recipe.costs.every((cost) => canPayCraftCost(resources, cost));
  },

  craftRecipe: (recipeId) => {
    const recipe = CRAFT_RECIPES[recipeId];
    if (!recipe) return false;

    const resources = get().resources;
    const canCraft = recipe.costs.every((cost) => canPayCraftCost(resources, cost));
    if (!canCraft) return false;

    set((s) => {
      let nextResources = { ...s.resources };

      for (const cost of recipe.costs) {
        nextResources = payCraftCost(nextResources, cost);
      }

      nextResources[recipe.output.resourceId] =
        (nextResources[recipe.output.resourceId] ?? 0) + recipe.output.amount;

      return {
        resources: nextResources,
        unlockedNodes: unlockNodes(nextResources, s.unlockedNodes),
        discovered: {
          ...s.discovered,
          [recipe.output.resourceId]: true,
        },
      };
    });

    return true;
  },

});
