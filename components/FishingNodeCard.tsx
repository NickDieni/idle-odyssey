"use client";

import { useMemo, useState } from "react";
import { useGameStore } from "@/game/store";
import { RESOURCES } from "@/game/resources";
import type { FishingNode } from "@/game/types";

// ---------- Helpers ----------
function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function formatInt(n: number) {
  return Math.floor(n).toLocaleString();
}

function requirementText(node: FishingNode) {
  const req = node.requirement;
  if (req.type === "none") return "";
  const name = RESOURCES[req.resourceId]?.name ?? req.resourceId;
  return `Requires ${name}: ${req.amount.toLocaleString()}`;
}

// ---------- Component ----------
export function FishingNodeCard({ node }: { node: FishingNode }) {
  const resources = useGameStore((s) => s.resources);
  const gather = useGameStore((s) => s.gather);
  const setActiveNodeId = useGameStore((s) => s.setActiveNodeId);
  const getStat = useGameStore((s) => s.getStat);

  const isActive = gather.activeNodeId === node.id;

  // Unlock progress
  const unlockProgress = useMemo(() => {
    if (node.requirement.type === "none") return 1;
    const have = resources[node.requirement.resourceId] ?? 0;
    const need = node.requirement.amount;
    if (need <= 0) return 1;
    return clamp01(have / need);
  }, [node.requirement, resources]);

  const unlocked = unlockProgress >= 1;

  // Speed / XP display
  const speedKey = (node.speedStatKey ?? "prod.fishing.speed") as any;
  const speedMult = Number(getStat(speedKey) ?? 1);
  const xpMult = Number(getStat("xp.gain.mult" as any) ?? 1);

  const effectiveDurationSeconds = Math.max(
    0.05,
    node.durationSeconds / Math.max(0.01, speedMult)
  );
  const effectiveXp = Math.max(0, node.xp * xpMult);

  // Progress bar logic
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

  // Fish list paging
  const visibleCount = node.visibleFishCount ?? 4;
  const [startIndex, setStartIndex] = useState(0);

  const visibleFish = useMemo(
    () => node.fishTable.slice(startIndex, startIndex + visibleCount),
    [node.fishTable, startIndex, visibleCount]
  );

  const canScrollDown = startIndex + visibleCount < node.fishTable.length;

  const totalChance = useMemo(
    () => node.fishTable.reduce((s, f) => s + Math.max(0, f.chance), 0),
    [node.fishTable]
  );

  const onToggleSelect = () => {
    if (!unlocked) return;
    setActiveNodeId(isActive ? null : node.id);
  };

  return (
    <div className="rounded-xl bg-slate-900/60 border border-slate-700 p-5 w-full max-w-xl">
      <div className="flex flex-col items-center gap-3">
        {/* Header */}
        <div className="text-center">
          <div className={`text-lg font-semibold ${unlocked ? "text-white" : "text-slate-400"}`}>
            {node.label}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {formatInt(effectiveXp)} XP / {effectiveDurationSeconds.toFixed(2)}s
          </div>
        </div>

        {/* Icon */}
        <div className={`mt-2 ${unlocked ? "" : "grayscale opacity-60"}`}>
          {node.iconSrc ? (
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

        {/* Fish list */}
        <div className="w-full mt-2 rounded-md bg-slate-800/60 border border-slate-700 p-3">
          <div className="text-xs text-slate-400 mb-2">Possible Fish</div>

          <div className="space-y-2">
            {visibleFish.map((f) => {
              const pctChance =
                totalChance > 0 ? (f.chance / totalChance) * 100 : 0;

              return (
                <div
                  key={f.resourceId}
                  className="flex items-center justify-between text-sm text-slate-200"
                >
                  <div className="flex items-center gap-2">
                    {f.iconSrc ? (
                      <img
                        src={f.iconSrc}
                        alt={f.resourceId}
                        width={24}
                        height={24}
                        style={{ imageRendering: "pixelated" }}
                      />
                    ) : null}
                    <span>{f.label ?? RESOURCES[f.resourceId]?.name ?? f.resourceId}</span>
                  </div>
                  <span className="text-slate-400">{pctChance.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>

          {canScrollDown && (
            <button
              className="mt-2 w-full px-3 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-xs"
              onClick={() => setStartIndex((i) => i + 1)}
            >
              Down
            </button>
          )}
        </div>

        {/* Action button */}
        <button
          onClick={onToggleSelect}
          disabled={!unlocked}
          className={[
            "px-6 py-2 rounded-md text-sm font-semibold transition",
            unlocked
              ? isActive
                ? "bg-sky-700 hover:bg-sky-600 text-white"
                : "bg-slate-700 hover:bg-slate-600 text-white"
              : "bg-slate-800 text-slate-500 cursor-not-allowed",
          ].join(" ")}
        >
          {!unlocked ? "Locked" : isActive ? "Stop" : node.actionVerb}
        </button>

        {/* Progress bar */}
        <div className="w-full mt-3">
          <div className="h-3 rounded-full bg-slate-700 overflow-hidden">
            <div className={`h-full ${barFillClass}`} style={{ width: `${pct}%` }} />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs gap-2">
            <div className="text-slate-300 flex-1 text-center">{barCenterText}</div>
            <div className="text-slate-400 shrink-0">{barRightText}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
