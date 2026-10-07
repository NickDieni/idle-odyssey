// src/game/types.ts
import type { ResourceId, SellResourceId } from "@/game/resources";
import type { Cost } from "@/game/upgrades";
import { UnlockRequirement } from "./unlocks";

export type NodeCategory = "woodcutting" | "mining" | "fishing";

export type FishEntry = {
  sellResourceId: SellResourceId;
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
  auto?: {
    upgradeId: string;
    cost: Cost;
  };
};

export type AnyNode = GatherNode | FishingNode;
