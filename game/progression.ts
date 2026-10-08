import type { AnyNode, GatherNode } from '@/game/types';
import { ALL_NODES } from '@/game/nodes';
import { clamp01 } from './format';
import { isUnlocked } from './unlocks';

type ResourcesMap = Record<string, number>;
type DiscoveredMap = Record<string, boolean>;

export function getUnlockProgress(node: AnyNode, resources: ResourcesMap, permanentlyUnlocked = false): number {
  const requirement = node.requirement;
  if (permanentlyUnlocked || requirement.type === 'none') return 1;
  if (requirement.amount <= 0) return 1;
  return clamp01((resources[requirement.resourceId] ?? 0) / requirement.amount);
}

export function isNodeUnlocked(node: AnyNode, resources: ResourcesMap, unlockedNodes: DiscoveredMap = {}): boolean {
  if (unlockedNodes[node.id]) return true;
  return isUnlocked(node.requirement, resources);
}

// Record requirements when they are reached; spending resources never removes an unlock.
export function unlockNodes(resources: ResourcesMap, unlockedNodes: DiscoveredMap): DiscoveredMap {
  let next = unlockedNodes;
  for (const node of ALL_NODES) {
    if (!next[node.id] && isNodeUnlocked(node, resources)) {
      next = { ...next, [node.id]: true };
    }
  }
  return next;
}

/**
 * Rules:
 * - Show all unlocked nodes.
 * - Also show exactly ONE locked node: the first locked node whose prerequisite resource is already discovered.
 * - Deeper locked nodes remain hidden until the previous node's resource becomes discovered.
 */
export function visibleNodes(
  nodes: GatherNode[],
  resources: ResourcesMap,
  discovered: DiscoveredMap,
  unlockedNodes: DiscoveredMap = {}
): GatherNode[] {
  // Keep stable ordering as defined in config (important)
  const unlocked = nodes.filter((n) => isNodeUnlocked(n, resources, unlockedNodes));

  // Find the first "eligible locked" node
  const nextLocked = nodes.find((n) => {
    if (isNodeUnlocked(n, resources, unlockedNodes)) return false; // not locked

    const req = n.requirement;
    if (req.type === 'none') return false;

    // Locked nodes only become eligible if their prerequisite resource is discovered
    if (req.type === 'resource_amount') {
      return !!discovered[req.resourceId];
    }

    return false;
  });

  // If nextLocked is already in unlocked (shouldn't be), don't duplicate
  if (!nextLocked) return unlocked;

  const alreadyIncluded = unlocked.some((u) => u.id === nextLocked.id);
  return alreadyIncluded ? unlocked : [...unlocked, nextLocked];
}
