import type { ResourceId } from '@/game/resources';

export type UnlockRequirement =
  | { type: 'none' }
  | { type: 'resource_amount'; resourceId: ResourceId; amount: number };

export function isUnlocked(req: UnlockRequirement, resources: Record<string, number>): boolean {
  if (req.type === 'none') return true;
  if (req.type === 'resource_amount') {
    return (resources[req.resourceId] ?? 0) >= req.amount;
  }
  return false;
}
