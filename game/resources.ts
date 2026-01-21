export type ResourceId = 'xp' | 'gold' | 'oak' | 'birch' | 'spruce' | 'pebbles' | 'stone' | 'iron' | 'copper';

export type ResourceDef = {
  id: ResourceId;
  name: string;
  decimals?: number;
  startsDiscovered?: boolean;
};

export const RESOURCES: Record<ResourceId, ResourceDef> = {
  // Level up resources
  xp: { id: 'xp', name: 'Experience', decimals: 0, startsDiscovered: true },

  // Basic Currency
  gold: { id: 'gold', name: 'Gold', decimals: 0, startsDiscovered: true },

  // Tree Cutting Resources
  oak: { id: 'oak', name: 'Oak', decimals: 0, startsDiscovered: false },
  birch: { id: 'birch', name: 'Birch', decimals: 0, startsDiscovered: false },
  spruce: { id: 'spruce', name: 'Spruce', decimals: 0, startsDiscovered: false },

  // Mine Resources
  pebbles: { id: 'stone', name: 'Pebbles', decimals: 0, startsDiscovered: false },
  stone: { id: 'stone', name: 'Stone', decimals: 0, startsDiscovered: false },
  iron: { id: 'iron', name: 'Iron', decimals: 0, startsDiscovered: false },
  copper: { id: 'copper', name: 'Copper', decimals: 0, startsDiscovered: false },
};
