// game/selling.ts (or wherever fits)
import type { ResourceId } from "@/game/resources";

export const SELL_PRICES: Partial<Record<ResourceId, number>> = {
  oak: 1,
  birch: 3,
  spruce: 5,
  maple: 8,
  pebbles: 1,
  stone: 3,
  copper: 4,
  iron: 5,
  worm: 1,
  minifish: 2,
  smallfish: 3,
  goldfish: 10,
  // do not include xp or gold
};

export const SELLABLE_RESOURCES = Object.keys(SELL_PRICES) as ResourceId[];
