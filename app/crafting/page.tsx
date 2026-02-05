"use client";

import { SMITHING_RECIPES } from "@/game/crafting";
import { RESOURCES } from "@/game/resources";
import { useGameStore } from "@/game/store";

export default function CraftingPage() {
  const resources = useGameStore((s) => s.resources);
  const canCraftRecipe = useGameStore((s) => s.canCraftRecipe);
  const craftRecipe = useGameStore((s) => s.craftRecipe);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Crafting</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-amber-300">Smithing</h2>

        {SMITHING_RECIPES.map((recipe) => {
          const canCraft = canCraftRecipe(recipe.id);

          return (
            <div
              key={recipe.id}
              className="rounded-xl border border-slate-700 bg-slate-900/60 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-white">{recipe.label}</div>
                  <div className="text-sm text-slate-300">
                    Makes +{recipe.output.amount} {RESOURCES[recipe.output.resourceId].name}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => craftRecipe(recipe.id)}
                  disabled={!canCraft}
                  className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Forge
                </button>
              </div>

              <div className="mt-3 space-y-1 text-sm text-slate-300">
                {recipe.costs.map((cost, idx) => {
                  if (cost.type === "resource") {
                    const have = Math.floor(resources[cost.resourceId] ?? 0);
                    const need = cost.amount;
                    const ok = have >= need;

                    return (
                      <div key={`${recipe.id}-cost-${idx}`} className={ok ? "text-emerald-300" : "text-rose-300"}>
                        {RESOURCES[cost.resourceId].name}: {have}/{need}
                      </div>
                    );
                  }

                  const have = Math.floor(
                    cost.resourceIds.reduce((sum, id) => sum + (resources[id] ?? 0), 0),
                  );
                  const need = cost.amount;
                  const ok = have >= need;

                  return (
                    <div key={`${recipe.id}-cost-${idx}`} className={ok ? "text-emerald-300" : "text-rose-300"}>
                      {cost.label}: {have}/{need}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
