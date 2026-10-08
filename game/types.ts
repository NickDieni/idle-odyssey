import type { ResourceId, SellResourceId } from "@/game/resources";
import type { Cost } from "@/game/upgrades";
import type { UnlockRequirement } from "./unlocks";

export type NodeCategory = "woodcutting" | "mining" | "fishing";

export type FishEntry = {
  sellResourceId: SellResourceId;
  chance: number; // relative chance (does NOT need to sum to 100)
  iconSrc?: string;
  label?: string;
  rewardAmount?: number;
};

type NodeBase = {
  id: string;
  actionVerb: string;
  label: string;
  iconSrc?: string;
  xp: number;
  durationSeconds: number;
  requirement: UnlockRequirement;
  rewardAmount: number;
  speedStatKey?: string;
};

export type FishingNode = NodeBase & {
  category: "fishing";
  fishTable: FishEntry[];
  visibleFishCount?: number; // default 4
};

export type GatherNode = NodeBase & {
  category: "woodcutting" | "mining";
  resourceId: ResourceId;
  amountStatKey?: string;
  multStatKey?: string;
  auto?: {
    upgradeId: string;
    cost: Cost;
  };
};

export type AnyNode = GatherNode | FishingNode;
