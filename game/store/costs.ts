import type { ResourceId } from "../resources";
import type { Cost } from "../upgrades";
import type { CraftCost } from "../crafting";
import type { ResourceAmounts } from "./types";

export function canAfford(resources: Record<string, number>, cost: Cost): boolean {
  return Object.entries(cost).every(
    ([rid, amt]) => (resources[rid] ?? 0) >= (amt ?? 0),
  );
}

export function payCost(resources: ResourceAmounts, cost: Cost): ResourceAmounts {
  const next = { ...resources };
  for (const [rid, amt] of Object.entries(cost)) {
    next[rid as ResourceId] = (next[rid as ResourceId] ?? 0) - (amt ?? 0);
  }
  return next;
}

export function getCraftCostAmount(resources: ResourceAmounts, cost: CraftCost): number {
  if (cost.type === "resource") {
    return resources[cost.resourceId] ?? 0;
  }
  return cost.resourceIds.reduce((sum, id) => sum + (resources[id] ?? 0), 0);
}

export function canPayCraftCost(resources: ResourceAmounts, cost: CraftCost): boolean {
  return getCraftCostAmount(resources, cost) >= cost.amount;
}

export function payCraftCost(resources: ResourceAmounts, cost: CraftCost): ResourceAmounts {
  const next = { ...resources };

  if (cost.type === "resource") {
    next[cost.resourceId] = (next[cost.resourceId] ?? 0) - cost.amount;
    return next;
  }

  let remaining = cost.amount;
  for (const id of cost.resourceIds) {
    if (remaining <= 0) break;
    const have = next[id] ?? 0;
    if (have <= 0) continue;

    const take = Math.min(have, remaining);
    next[id] = have - take;
    remaining -= take;
  }

  return next;
}
