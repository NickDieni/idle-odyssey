"use client";

import { clamp01, formatInt } from "@/game/format";
import type { StatKey } from "@/game/effects";
import { requirementText } from "@/game/node-display";
import { getUnlockProgress } from "@/game/progression";
import { useGameStore } from "@/game/store";
import { canAfford } from "@/game/store/costs";
import { RESOURCES, type ResourceId } from "@/game/resources";
import type { GatherNode } from "@/game/types";

// ---------- Component ----------
export default function GatherNodeCard({ node }: { node: GatherNode }) {
  // Store
  const resources = useGameStore((s) => s.resources);
  const permanentlyUnlocked = useGameStore((s) => !!s.unlockedNodes[node.id]);
  const getStat = useGameStore((s) => s.getStat);

  const gather = useGameStore((s) => s.gather);
  const setActiveNodeId = useGameStore((s) => s.setActiveNodeId);

  // Automatic gathering controls
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);
  const isAutoAvailable = useGameStore((s) => s.isAutoAvailable(node.id));
  const autoEnabled = useGameStore((s) => !!s.autoEnabled[node.id]);
  const toggleAuto = useGameStore((s) => s.toggleAuto);

  const isActive = gather.activeNodeId === node.id;

  // Unlock progress (for locked look + progress bar)
  const unlockProgress = getUnlockProgress(node, resources, permanentlyUnlocked);

  const unlocked = unlockProgress >= 1;

  // Stat keys (defaults derived from resourceId)
  const amountKey = (node.amountStatKey ?? `prod.${node.resourceId}.amount`) as StatKey;
  const multKey = (node.multStatKey ?? `prod.${node.resourceId}.mult`) as StatKey;
  const speedKey = (node.speedStatKey ?? `prod.${node.resourceId}.speed`) as StatKey;

  // Effects-aware values (display only; store uses same logic for actual rewards)
  const amountAdd = Number(getStat(amountKey) ?? 0);
  const amountMult = Number(getStat(multKey) ?? 1);
  const speedMult = Number(getStat(speedKey) ?? 1);
  const xpMult = Number(getStat("xp.gain.mult") ?? 1);

  const effectiveReward = Math.max(0, (node.rewardAmount + amountAdd) * amountMult);
  const effectiveXp = Math.max(0, node.xp * xpMult);

  const effectiveDurationSeconds = Math.max(
    0.05,
    node.durationSeconds / Math.max(0.01, speedMult)
  );

  // Progress bar:
  // - If unlocked: show current gather progress only if this node is active; otherwise show 0%.
  // - If locked: show unlock progress.
  const actionProgress = isActive ? gather.gatherProgress01 : 0;
  const barProgress = unlocked ? actionProgress : unlockProgress;
  const pct = Math.floor(clamp01(barProgress) * 100);

  const barFillClass = unlocked ? "bg-sky-500" : "bg-rose-500";

  const barCenterText = unlocked
    ? `${pct}%`
    : requirementText(node);

  const barRightText =
    !unlocked && node.requirement.type === "resource_amount"
      ? `${formatInt(resources[node.requirement.resourceId] ?? 0)} / ${node.requirement.amount.toLocaleString()}`
      : "";

  const subtitle = unlocked
    ? `${formatInt(effectiveXp)} XP / ${effectiveDurationSeconds.toFixed(2)}s • +${formatInt(
        effectiveReward
      )} ${RESOURCES[node.resourceId].name}`
    : requirementText(node);

  const showAutoUnlock = !!node.auto && !isAutoAvailable;
  const showAutoToggle = !!node.auto && isAutoAvailable;

  const canAffordAuto =
    node.auto ? canAfford(resources, node.auto.cost) : false;

  const autoCostText =
    node.auto
      ? Object.entries(node.auto.cost)
          .map(([rid, amt]) => `${(amt ?? 0).toLocaleString()} ${RESOURCES[rid as ResourceId]?.name ?? rid}`)
          .join(", ")
      : "";

  // Click: select/deselect this node
  const onToggleSelect = () => {
    if (!unlocked) return;
    setActiveNodeId(isActive ? null : node.id);
    console.log("activeNodeId", gather.activeNodeId, "progress", gather.gatherProgress01);

  };

  return (
    <div className="rounded-xl bg-slate-900/60 border border-slate-700 p-5 w-full max-w-md">
      <div className="flex flex-col items-center gap-3">
        {/* Header */}
        <div className="text-center">
          <div className={`text-lg font-semibold ${unlocked ? "text-white" : "text-slate-400"}`}>
            {node.label}
          </div>

          <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
        </div>

        {/* Sprite */}
        <div className={`mt-2 ${unlocked ? "" : "grayscale opacity-60"}`}>
          {node.iconSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={node.iconSrc}
              alt={node.label}
              width={96}
              height={96}
              style={{ imageRendering: "pixelated" }}
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-slate-700" />
          )}
        </div>

        {/* Buttons row */}
        <div className="mt-1 flex gap-2 items-center">
          {/* Action (Select/Stop) */}
          <button
            onClick={onToggleSelect}
            disabled={!unlocked}
            className={[
              "px-5 py-2 rounded-md text-sm font-semibold transition",
              unlocked
                ? isActive
                  ? "bg-sky-700 hover:bg-sky-600 text-white"
                  : "bg-slate-700 hover:bg-slate-600 text-white"
                : "bg-slate-800 text-slate-500 cursor-not-allowed",
            ].join(" ")}
          >
            {!unlocked ? "Locked" : isActive ? "Stop" : node.actionVerb}
          </button>

          {/* Auto unlock */}
          {showAutoUnlock && node.auto ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => buyUpgrade(node.auto!.upgradeId)}
                disabled={!unlocked || !canAffordAuto}
                className="px-3 py-2 rounded-md text-sm font-semibold bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
                title={autoCostText}
              >
                Unlock Auto
              </button>
              <div className="text-xs text-slate-400 whitespace-nowrap">{autoCostText}</div>
            </div>
          ) : null}

          {/* Auto toggle */}
          {showAutoToggle ? (
            <button
              onClick={() => toggleAuto(node.id)}
              disabled={!unlocked}
              className={[
                "px-3 py-2 rounded-md text-sm font-semibold transition",
                unlocked
                  ? autoEnabled
                    ? "bg-emerald-700 hover:bg-emerald-600 text-white"
                    : "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed",
              ].join(" ")}
              title="Toggle Auto"
            >
              Auto {autoEnabled ? "ON" : "OFF"}
            </button>
          ) : null}
        </div>

        {/* Progress bar */}
        <div className="w-full mt-3">
          <div className="h-3 rounded-full bg-slate-700 overflow-hidden">
            <div className={`h-full ${barFillClass}`} style={{ width: `${pct}%` }} />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs gap-2">
            <div className="text-slate-300 text-center flex-1">{barCenterText}</div>
            <div className="text-slate-400 shrink-0">{barRightText}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
