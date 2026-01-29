import type { Effect } from "@/game/effects";
import type { ResourceId } from "@/game/resources";

export type Cost = Partial<Record<ResourceId, number>>;

export type UpgradeDef = {
  id: string;
  name: string;
  description: string;
  cost: Cost;

  // Category for organizing in store
  category: 'woodcutting' | 'mining' | 'fishing' | 'general';
  material?: ResourceId; // specific material this upgrade affects (oak, stone, etc.)

  // Permanent upgrades apply effects
  effects?: Effect[];

  // Special unlocks for features (like auto)
  unlocks?: {
    autoNodeId?: string; // enables auto toggle for a specific node
  };
};

export const UPGRADES: UpgradeDef[] = [
  // Woodcutting Upgrades
  // Oak Upgrades
  {
    id: "wood.amount.plus1",
    name: "Sharper Axe",
    description: "+1 Wood per cut",
    cost: { gold: 25 },
    category: 'woodcutting',
    material: 'oak',
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
    category: 'woodcutting',
    material: 'oak',
    effects: [
      {
        id: "eff.wood.speed.x2",
        name: "Wood Speed x2",
        source: "upgrade",
        modifiers: [{ stat: "prod.oak.speed", type: "mul", value: 2 }],
      },
    ],
  },
  // Birch Upgrades
    {
    id: "wood.amount.plus1",
    name: "Sharper Axe",
    description: "+1 Wood per cut",
    cost: { gold: 25 },
    category: 'woodcutting',
    material: 'birch',
    effects: [
      {
        id: "eff.wood.amount.plus1",
        name: "Wood Amount +1",
        source: "upgrade",
        modifiers: [{ stat: "prod.birch.amount", type: "add", value: 1 }],
      },
    ],
  },
  {
    id: "wood.speed.x2",
    name: "Fast Hands",
    description: "Cutting speed x2",
    cost: { gold: 75, birch: 25 },
    category: 'woodcutting',
    material: 'birch',
    effects: [
      {
        id: "eff.wood.speed.x2",
        name: "Wood Speed x2",
        source: "upgrade",
        modifiers: [{ stat: "prod.birch.speed", type: "mul", value: 2 }],
      },
    ],
  },
  // Spruce Upgrades
    {
    id: "wood.amount.plus1",
    name: "Sharper Axe",
    description: "+1 Wood per cut",
    cost: { gold: 25 },
    category: 'woodcutting',
    material: 'spruce',
    effects: [
      {
        id: "eff.wood.amount.plus1",
        name: "Wood Amount +1",
        source: "upgrade",
        modifiers: [{ stat: "prod.spruce.amount", type: "add", value: 1 }],
      },
    ],
  },
  {
    id: "wood.speed.x2",
    name: "Fast Hands",
    description: "Cutting speed x2",
    cost: { gold: 75, spruce: 25 },
    category: 'woodcutting',
    material: 'spruce',
    effects: [
      {
        id: "eff.wood.speed.x2",
        name: "Wood Speed x2",
        source: "upgrade",
        modifiers: [{ stat: "prod.spruce.speed", type: "mul", value: 2 }],
      },
    ],
  },
  // maple Upgrades
    {
    id: "wood.amount.plus1",
    name: "Sharper Axe",
    description: "+1 Wood per cut",
    cost: { gold: 25 },
    category: 'woodcutting',
    material: 'maple',
    effects: [
      {
        id: "eff.wood.amount.plus1",
        name: "Wood Amount +1",
        source: "upgrade",
        modifiers: [{ stat: "prod.maple.amount", type: "add", value: 1 }],
      },
    ],
  },
  {
    id: "wood.speed.x2",
    name: "Fast Hands",
    description: "Cutting speed x2",
    cost: { gold: 75, maple: 25 },
    category: 'woodcutting',
    material: 'maple',
    effects: [
      {
        id: "eff.wood.speed.x2",
        name: "Wood Speed x2",
        source: "upgrade",
        modifiers: [{ stat: "prod.maple.speed", type: "mul", value: 2 }],
      },
    ],
  },




  // General Upgrades
  // Xp Upgrades
  {
    id: "xp.mult.x1_5",
    name: "Training Manual",
    description: "XP gain x1.5",
    cost: { gold: 100 },
    category: 'general',
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
