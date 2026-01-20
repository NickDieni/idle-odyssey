import type { Effect } from "@/game/effects";
import type { ResourceId } from "@/game/resources";

export type Cost = Partial<Record<ResourceId, number>>;

export type UpgradeDef = {
  id: string;
  name: string;
  description: string;
  cost: Cost;

  // Permanent upgrades apply effects
  effects?: Effect[];

  // Special unlocks for features (like auto)
  unlocks?: {
    autoNodeId?: string; // enables auto toggle for a specific node
  };
};

export const UPGRADES: UpgradeDef[] = [
  {
    id: "wood.amount.plus1",
    name: "Sharper Axe",
    description: "+1 Wood per cut",
    cost: { gold: 25 },
    effects: [
      {
        id: "eff.wood.amount.plus1",
        name: "Wood Amount +1",
        source: "upgrade",
        modifiers: [{ stat: "prod.oak.amount", type: "add", value: 1 }],
      },
    ],
  },
  {
    id: "wood.speed.x2",
    name: "Fast Hands",
    description: "Cutting speed x2",
    cost: { gold: 75, oak: 25 },
    effects: [
      {
        id: "eff.wood.speed.x2",
        name: "Wood Speed x2",
        source: "upgrade",
        modifiers: [{ stat: "prod.oak.speed", type: "mul", value: 2 }],
      },
    ],
  },
  {
    id: "xp.mult.x1_5",
    name: "Training Manual",
    description: "XP gain x1.5",
    cost: { gold: 100 },
    effects: [
      {
        id: "eff.xp.mult.x1_5",
        name: "XP Mult x1.5",
        source: "upgrade",
        modifiers: [{ stat: "xp.gain.mult", type: "mul", value: 1.5 }],
      },
    ],
  },
];
