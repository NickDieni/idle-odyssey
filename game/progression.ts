import type { ResourceId } from '@/game/resources';
import type { GatherNode } from '@/components/GatherNodeCard';

type ResourcesMap = Record<string, number>;
type DiscoveredMap = Record<string, boolean>;

function isNodeUnlocked(node: GatherNode, resources: ResourcesMap): boolean {
  const req = node.requirement;
  if (req.type === 'none') return true;
  if (req.type === 'resource_amount') {
    return (resources[req.resourceId] ?? 0) >= req.amount;
  }
  return false;
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
  discovered: DiscoveredMap
): GatherNode[] {
  // Keep stable ordering as defined in config (important)
  const unlocked = nodes.filter((n) => isNodeUnlocked(n, resources));

  // Find the first "eligible locked" node
  const nextLocked = nodes.find((n) => {
    if (isNodeUnlocked(n, resources)) return false; // not locked

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
