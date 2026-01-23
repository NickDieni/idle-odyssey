// game/selling.ts (or wherever fits)
import type { ResourceId } from "@/game/resources";

export const SELL_PRICES: Partial<Record<ResourceId, number>> = {
  oak: 1,
  birch: 2,
  spruce: 3,
  pebbles: 1,
  stone: 1,
  iron: 5,
  copper: 4,
  worm: 1,
  minifish: 2,
  smallfish: 3,
  goldfish: 10,
  // do not include xp or gold
};

export const SELLABLE_RESOURCES = Object.keys(SELL_PRICES) as ResourceId[];
