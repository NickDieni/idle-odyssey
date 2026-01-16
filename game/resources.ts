export type ResourceId = 'gold' | 'wood' | 'stone' | 'iron' | 'copper';

export type ResourceDef = {
  id: ResourceId;
  name: string;
  decimals?: number;
  startsDiscovered?: boolean;
};

export const RESOURCES: Record<ResourceId, ResourceDef> = {
  gold: { id: 'gold', name: 'Gold', decimals: 0, startsDiscovered: true },
  wood: { id: 'wood', name: 'Wood', decimals: 0, startsDiscovered: true },
  stone: { id: 'stone', name: 'Stone', decimals: 0, startsDiscovered: true },
  iron: { id: 'iron', name: 'Iron', decimals: 0, startsDiscovered: false },
  copper: { id: 'copper', name: 'Copper', decimals: 0, startsDiscovered: false },
};
