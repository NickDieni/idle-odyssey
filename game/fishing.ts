import type { SellResourceId } from "@/game/resources";
import type { FishEntry } from "@/game/types";

export function rollFish(table: FishEntry[]): SellResourceId | null {
  const total = table.reduce((s, f) => s + Math.max(0, f.chance), 0);
  if (total <= 0) return null;

  let r = Math.random() * total;
  for (const f of table) {
    r -= Math.max(0, f.chance);
    if (r <= 0) return f.sellResourceId;
  }

  return table[table.length - 1].sellResourceId;
}
