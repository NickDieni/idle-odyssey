"use client";

import { useGameStore } from "@/game/store";
import { RESOURCES, type ResourceId } from "@/game/resources";

function format(value: number, decimals = 0) {
  // If decimals is 0, keep it clean and integer-like
  if (!decimals) return Math.floor(value).toLocaleString();
  return value.toFixed(decimals);
}

export default function DashboardResources() {
  const resources = useGameStore((s) => s.resources);
  const discovered = useGameStore((s) => s.discovered);

  return (
    <section className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="text-lg font-semibold">Resources</div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(RESOURCES) as ResourceId[])
          .filter((id) => discovered[id]) // <-- This hides undiscovered resources, using the bool for each
          .map((id) => {
            const def = RESOURCES[id];
            const value = resources[id] ?? 0;

            return (
              <div key={id} className="rounded-md bg-gray-950/50 p-3">
                <div className="text-xs text-gray-400">{def.name}</div>
                <div className="mt-1 text-2xl font-semibold">
                  {format(value, def.decimals ?? 0)}
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
