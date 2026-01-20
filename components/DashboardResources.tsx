"use client";

import { useMemo } from "react";
import { useGameStore } from "@/game/store";
import { RESOURCES, type ResourceId } from "@/game/resources";

function format(value: number, decimals = 0) {
  if (!decimals) return Math.floor(value).toLocaleString();
  return value.toFixed(decimals);
}

export default function DashboardResources() {
  const resources = useGameStore((s) => s.resources);
  const discovered = useGameStore((s) => s.discovered);

  const sellResource = useGameStore((s) => s.sellResource);
  const getSellValue = useGameStore((s) => s.getSellValue);

  const visibleResourceIds = useMemo(() => {
    return (Object.keys(RESOURCES) as ResourceId[])
      .filter((id) => id !== "xp") // hide XP on dashboard
      .filter((id) => discovered[id]);
  }, [discovered]);

  return (
    <section className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="text-lg font-semibold">Resources</div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleResourceIds.map((id) => {
          const def = RESOURCES[id];
          const value = resources[id] ?? 0;

          const isGold = id === "gold";
          const sellValue = isGold ? 0 : getSellValue(id); // sells all by default
          const canSell = !isGold && sellValue > 0 && value > 0;

          return (
            <div key={id} className="rounded-md bg-gray-950/50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-gray-400">{def.name}</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {format(value, def.decimals ?? 0)}
                  </div>
                </div>

                {!isGold && (
                  <button
                    type="button"
                    onClick={() => sellResource(id)}
                    disabled={!canSell}
                    className="rounded-md bg-amber-600 px-2.5 py-1 text-sm font-semibold text-black hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                    title={
                      canSell
                        ? `Sell all for +${sellValue.toLocaleString()} gold`
                        : "Nothing to sell"
                    }
                  >
                    Sell
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
