export type StatKey =
  // XP
  | "xp.gain.mult"

  // Production: amount/mult/speed for gather nodes
  | "prod.oak.amount" | "prod.oak.mult" | "prod.oak.speed"
  | "prod.birch.amount" | "prod.birch.mult" | "prod.birch.speed"
  | "prod.spruce.amount" | "prod.spruce.mult" | "prod.spruce.speed"
  | "prod.stone.amount" | "prod.stone.mult" | "prod.stone.speed"
  | "prod.iron.amount" | "prod.iron.mult" | "prod.iron.speed"
  | "prod.copper.amount" | "prod.copper.mult" | "prod.copper.speed"

  // If you still use passive income tick stats, add them too:
  | "prod.gold";


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
