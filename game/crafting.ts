import type { ResourceId } from "@/game/resources";

export type CraftCost =
  | { type: "resource"; resourceId: ResourceId; amount: number }
  | { type: "any_of"; resourceIds: ResourceId[]; amount: number; label: string };

export type CraftRecipe = {
  id: string;
  skill: "smithing";
  label: string;
  output: {
    resourceId: ResourceId;
    amount: number;
  };
  costs: CraftCost[];
};

export const SMITHING_RECIPES: CraftRecipe[] = [
  {
    id: "smithing.bronze_bar",
    skill: "smithing",
    label: "Bronze Bar",
    output: {
      resourceId: "bronze_bar",
      amount: 1,
    },
    costs: [
      {
        type: "any_of",
        label: "Wood (any kind)",
        resourceIds: ["oak", "birch", "spruce", "maple"],
        amount: 1,
      },
      { type: "resource", resourceId: "copper", amount: 1 },
      { type: "resource", resourceId: "tin", amount: 1 },
    ],
  },
];

export const CRAFT_RECIPES = Object.fromEntries(
  SMITHING_RECIPES.map((recipe) => [recipe.id, recipe]),
) as Record<string, CraftRecipe>;
