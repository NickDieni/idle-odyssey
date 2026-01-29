export type ResourceId = 'xp' | 'gold' | 'oak' | 'birch' | 'spruce' | 'maple' | 'pebbles' | 'stone' | 'copper' | 'tin' |'iron' | 'worm' | 'minifish' | 'smallfish' | 'goldfish';

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
  oak: { id: 'oak', name: 'Oak', decimals: 0, startsDiscovered: true },
  birch: { id: 'birch', name: 'Birch', decimals: 0, startsDiscovered: false },
  spruce: { id: 'spruce', name: 'Spruce', decimals: 0, startsDiscovered: false },
  maple: { id: 'maple', name: 'Maple', decimals: 0, startsDiscovered: false },

  // Mine Resources
  pebbles: { id: 'pebbles', name: 'Pebbles', decimals: 0, startsDiscovered: false },
  stone: { id: 'stone', name: 'Stone', decimals: 0, startsDiscovered: false },
  copper: { id: 'copper', name: 'Copper', decimals: 0, startsDiscovered: false },
  tin: { id: 'tin', name: 'Tin', decimals: 0, startsDiscovered: false },
  iron: { id: 'iron', name: 'Iron', decimals: 0, startsDiscovered: false },

  // Fish Resources
  worm: { id: 'worm', name: 'Worm', decimals: 0, startsDiscovered: false },
  minifish: { id: 'minifish', name: 'Mini Fish', decimals: 0, startsDiscovered: false },
  smallfish: { id: 'smallfish', name: 'Small Fish', decimals: 0, startsDiscovered: false },
  goldfish: { id: 'goldfish', name: 'Goldfish', decimals: 0, startsDiscovered: false },


};
