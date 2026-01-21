// src/game/types.ts
import type { ResourceId } from "@/game/resources";

export type NodeCategory = "woodcutting" | "mining";

export type UnlockRequirement =
  | { type: "none" }
  | { type: "resource_amount"; resourceId: ResourceId; amount: number };

export type Cost = Partial<Record<ResourceId, number>>;

export type AutoUpgrade = {
  upgradeId: string;
  cost: Cost;
};

export type GatherNode = {
  id: string;

  // NEW
  category: NodeCategory;

  actionVerb: string;
  label: string;
  iconSrc?: string;

  resourceId: ResourceId;
  rewardAmount: number;
  xp: number;

  durationSeconds: number;

  requirement: UnlockRequirement;

  auto?: AutoUpgrade;

  amountStatKey?: string;
  multStatKey?: string;
  speedStatKey?: string;
};
