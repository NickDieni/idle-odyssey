// src/game/nodes.ts
import type { GatherNode, NodeCategory } from "@/game/types";

// -------------------------
// WOODCUTTING
// -------------------------
export const WOODCUTTING_NODES: GatherNode[] = [
  {
    id: "tree.oak",
    category: "woodcutting",
    actionVerb: "Cut",
    label: "Oak Tree",
    resourceId: "oak",
    iconSrc: "/icons/oak.png",
    xp: 5,
    durationSeconds: 3,
    rewardAmount: 1,
    requirement: { type: "none" },
  },
  {
    id: "tree.birch",
    category: "woodcutting",
    actionVerb: "Cut",
    label: "Birch Tree",
    resourceId: "birch",
    iconSrc: "/icons/birch.png",
    xp: 10,
    durationSeconds: 3,
    rewardAmount: 1,
    requirement: { type: "resource_amount", resourceId: "oak", amount: 50 },
  },
  {
    id: "tree.spruce",
    category: "woodcutting",
    actionVerb: "Cut",
    label: "Spruce Tree",
    resourceId: "spruce",
    iconSrc: "/icons/spruce.png",
    xp: 50,
    durationSeconds: 3,
    rewardAmount: 1,
    requirement: { type: "resource_amount", resourceId: "birch", amount: 100 },
  },
];

// -------------------------
// MINING (stub for now)
// -------------------------
export const MINING_NODES: GatherNode[] = [
  // Example starter nodes (comment out if you prefer empty array):
  {
    id: "mine.pebbles",
    category: "mining",
    actionVerb: "Mine",
    label: "Happy Stone",
    resourceId: "pebbles",
    iconSrc: "/icons/happystone1.png",
    xp: 3,
    durationSeconds: 2,
    rewardAmount: 1,
    requirement: { type: "resource_amount", resourceId: "oak", amount: 15 },
  },
  {
    id: "mine.stone",
    category: "mining",
    actionVerb: "Mine",
    label: "Stone Vein",
    resourceId: "stone",
    iconSrc: "/icons/stone.png",
    xp: 8,
    durationSeconds: 3,
    rewardAmount: 1,
    requirement: { type: "resource_amount", resourceId: "pebbles", amount: 35 },
  },
    {
    id: "mine.copper",
    category: "mining",
    actionVerb: "Mine",
    label: "Copper Vein",
    resourceId: "copper",
    //iconSrc: "/icons/copper.png",
    xp: 8,
    durationSeconds: 3,
    rewardAmount: 1,
    requirement: { type: "resource_amount", resourceId: "stone", amount: 90 },
  },
    {
    id: "mine.iron",
    category: "mining",
    actionVerb: "Mine",
    label: "Iron Vein",
    resourceId: "iron",
    //iconSrc: "/icons/iron.png",
    xp: 8,
    durationSeconds: 3,
    rewardAmount: 1,
    requirement: { type: "resource_amount", resourceId: "copper", amount: 150 },
  },
];

// -------------------------
// ALL NODES
// -------------------------
export const ALL_NODES: GatherNode[] = [...WOODCUTTING_NODES, ...MINING_NODES];

// -------------------------
// Store lookup (for background/offscreen progress)
// -------------------------
export const GATHER_NODES = Object.fromEntries(ALL_NODES.map((n) => [n.id, n]));

// -------------------------
// Convenience helpers (optional)
// -------------------------
export function getNodesByCategory(category: NodeCategory): GatherNode[] {
  return ALL_NODES.filter((n) => n.category === category);
}

export function getNodeById(id: string): GatherNode | undefined {
  return GATHER_NODES[id];
}
