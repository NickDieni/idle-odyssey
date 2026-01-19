export type StatKey =
  | 'prod.gold'      // gold per second
  | 'prod.oak'      // wood per second
  | 'prod.stone'     // stone per second
  | 'prod.iron'      // iron per second
  | 'prod.copper'    // copper per second

export type ModifierType = 'add' | 'mul'; 
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
