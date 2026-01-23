// src/game/types.ts
import type { ResourceId } from "@/game/resources";
import { UnlockRequirement } from "./unlocks";

export type NodeCategory = "woodcutting" | "mining" | "fishing";

export type FishEntry = {
  resourceId: ResourceId;
  chance: number; // relative chance (does NOT need to sum to 100)
  iconSrc?: string;
  label?: string;
  rewardAmount?: number;
};

export type FishingNode = {
  id: string;
  category: "fishing";

  actionVerb: string;
  label: string;
  iconSrc?: string;

  xp: number;
  durationSeconds: number;

  requirement: UnlockRequirement;
  rewardAmount: number;

  fishTable: FishEntry[];
  visibleFishCount?: number; // default 4

  // optional stat overrides
  speedStatKey?: string;
};

export type GatherNode = {
  id: string;
  category: "woodcutting" | "mining";

  actionVerb: string;
  label: string;
  iconSrc?: string;

  resourceId: ResourceId;
  rewardAmount: number;
  xp: number;

  durationSeconds: number;
  requirement: UnlockRequirement;

  amountStatKey?: string;
  multStatKey?: string;
  speedStatKey?: string;
};

export type AnyNode = GatherNode | FishingNode;
