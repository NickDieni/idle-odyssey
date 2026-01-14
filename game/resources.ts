export type ResourceId = 'gold' | 'gems' ;

export type ResourceDef = {
  id: ResourceId;
  name: string;
  decimals?: number;
};

export const RESOURCES: Record<ResourceId, ResourceDef> = {
  gold: { id: 'gold', name: 'Gold', decimals: 0 },
  gems: { id: 'gems', name: 'Gems', decimals: 0 },
};
