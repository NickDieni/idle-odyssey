"use client";

import { useMemo } from "react";
import { useGameStore } from "@/game/store";
import { RESOURCES } from "@/game/resources";
import type { GatherNode } from "@/game/types";

// ---------- Helpers ----------
function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function formatInt(n: number) {
  return Math.floor(n).toLocaleString();
}

function requirementText(node: GatherNode) {
  const req = node.requirement;
  if (req.type === "none") return "";
  const name = RESOURCES[req.resourceId]?.name ?? req.resourceId;
  return `Requires ${name}: ${req.amount.toLocaleString()}`;
}

// ---------- Component ----------
export default function GatherNodeCard({ node }: { node: GatherNode }) {
  // Store
  const resources = useGameStore((s) => s.resources);
  const getStat = useGameStore((s) => s.getStat);

  const gather = useGameStore((s) => s.gather);
  const setActiveNodeId = useGameStore((s) => s.setActiveNodeId);

  // Auto (optional UI kept from your version)
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);
  const isAutoAvailable = useGameStore((s) => s.isAutoAvailable(node.id));
  const autoEnabled = useGameStore((s) => !!s.autoEnabled[node.id]);
  const toggleAuto = useGameStore((s) => s.toggleAuto);

  const isActive = gather.activeNodeId === node.id;

  // Unlock progress (for locked look + progress bar)
  const unlockProgress = useMemo(() => {
    if (node.requirement.type === "none") return 1;
    const have = resources[node.requirement.resourceId] ?? 0;
    const need = node.requirement.amount;
    if (need <= 0) return 1;
    return clamp01(have / need);
  }, [node.requirement, resources]);

  const unlocked = unlockProgress >= 1;

  // Stat keys (defaults derived from resourceId)
  const amountKey = (node.amountStatKey ?? `prod.${node.resourceId}.amount`) as any;
  const multKey = (node.multStatKey ?? `prod.${node.resourceId}.mult`) as any;
  const speedKey = (node.speedStatKey ?? `prod.${node.resourceId}.speed`) as any;

  // Effects-aware values (display only; store uses same logic for actual rewards)
  const amountAdd = Number(getStat(amountKey) ?? 0);
  const amountMult = Number(getStat(multKey) ?? 1);
  const speedMult = Number(getStat(speedKey) ?? 1);
  const xpMult = Number(getStat("xp.gain.mult" as any) ?? 1);

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
    node.auto ? Object.entries(node.auto.cost).every(([rid, amt]) => (resources[rid] ?? 0) >= (amt ?? 0)) : false;

  const autoCostText =
    node.auto
      ? Object.entries(node.auto.cost)
          .map(([rid, amt]) => `${(amt ?? 0).toLocaleString()} ${RESOURCES[rid as any]?.name ?? rid}`)
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
