export const PRODUCTION_RESOURCES = [
  "oak", "birch", "spruce", "maple",
  "pebbles", "stone", "copper", "tin", "iron",
  "worm", "minifish", "smallfish", "goldfish",
] as const;

type ProductionResource = typeof PRODUCTION_RESOURCES[number];

export type StatKey =
  | "xp.gain.mult"
  | "prod.fishing.speed"
  | "prod.gold"
  | `prod.${ProductionResource}.${"amount" | "mult" | "speed"}`;

export type ModifierType = 'add' | 'mul' | 'speed'; 
// add: +X to the stat
// mul: *X to the stat (use 2 for “2x”, 0.5 for “half”, etc.)

export type Modifier = {
  stat: StatKey;
  type: ModifierType;
  value: number;
};

export type Effect = {
  id: string;
  name: string;
  modifiers: Modifier[];

  // optional runtime properties
  expiresAt?: number;     // unix ms; omit for permanent upgrades
  stacks?: number;        // default 1
  maxStacks?: number;     // optional stack cap
  source?: 'upgrade' | 'event' | 'debuff' | 'consumable';
};
