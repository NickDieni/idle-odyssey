"use client";

import { useGameStore } from "@/game/store";
import { RESOURCES, type ResourceId } from "@/game/resources";

export function ResourcePanel() {
  const resources = useGameStore((s) => s.resources);
  const discovered = useGameStore((s) => s.discovered);

  return (
    <div className="space-y-1">
      {(Object.keys(RESOURCES) as ResourceId[])
        .filter((id) => discovered[id]) // <-- This hides undiscovered resources, using the bool for each
        .filter((id) => id !== "xp") // hide XP on dashboard
        .map((id) => (
          <div key={id}>
            {RESOURCES[id].name}: {Math.floor(resources[id] ?? 0)}
          </div>
        ))}
    </div>
  );
}
