"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "@/game/store";
import { RESOURCES, type ResourceId } from "@/game/resources";

// ---------- Types ----------
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

// ---------- Helpers ----------
function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function formatInt(n: number) {
  return Math.floor(n).toLocaleString();
}

function requirementText(req: UnlockRequirement) {
  if (req.type === "none") return "";
  const name = RESOURCES[req.resourceId]?.name ?? req.resourceId;
  return `Requires ${name}: ${req.amount.toLocaleString()}`;
}

function canAfford(resources: Record<string, number>, cost: Cost): boolean {
  return Object.entries(cost).every(
    ([rid, amt]) => (resources[rid] ?? 0) >= (amt ?? 0),
  );
}

function formatCost(cost: Cost): string {
  return Object.entries(cost)
    .map(
      ([rid, amt]) =>
        `${(amt ?? 0).toLocaleString()} ${
          RESOURCES[rid as ResourceId]?.name ?? rid
        }`,
    )
    .join(", ");
}

// ---------- Component ----------
export default function GatherNodeCard({ node }: { node: GatherNode }) {
  // --- Store ---
  const resources = useGameStore((s) => s.resources);
  const addResource = useGameStore((s) => s.addResource);
  const getStat = useGameStore((s) => s.getStat);

  // Global “selected/active” node
  const activeNodeId = useGameStore((s) => s.activeNodeId);
  const setActiveNodeId = useGameStore((s) => s.setActiveNodeId);

  // Upgrades / Auto (kept, but no longer required for continuous running)
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);
  const isAutoAvailable = useGameStore((s) => s.isAutoAvailable(node.id));
  const autoEnabled = useGameStore((s) => !!s.autoEnabled[node.id]);
  const toggleAuto = useGameStore((s) => s.toggleAuto);

  const isActive = activeNodeId === node.id;

  // --- Unlock progress ---
  const unlockProgress = useMemo(() => {
    if (node.requirement.type === "none") return 1;
    const have = resources[node.requirement.resourceId] ?? 0;
    const need = node.requirement.amount;
    if (need <= 0) return 1;
    return clamp01(have / need);
  }, [node.requirement, resources]);

  const unlocked = unlockProgress >= 1;

  // --- Stat keys ---
  const amountKey = (node.amountStatKey ??
    `prod.${node.resourceId}.amount`) as any;
  const multKey = (node.multStatKey ?? `prod.${node.resourceId}.mult`) as any;
  const speedKey = (node.speedStatKey ??
    `prod.${node.resourceId}.speed`) as any;

  const amountAdd = Number(getStat(amountKey) ?? 0);
  const amountMult = Number(getStat(multKey) ?? 1);
  const speedMult = Number(getStat(speedKey) ?? 1);
  const xpMult = Number(getStat("xp.gain.mult" as any) ?? 1);

  const effectiveReward = Math.max(
    0,
    (node.rewardAmount + amountAdd) * amountMult,
  );
  const effectiveXp = Math.max(0, node.xp * xpMult);

  const effectiveDurationSeconds = Math.max(
    0.05,
    node.durationSeconds / Math.max(0.01, speedMult),
  );
  const effectiveDurationMs = effectiveDurationSeconds * 1000;

  // --- Action progress loop state ---
  const [running, setRunning] = useState(false);
  const [actionProgress, setActionProgress] = useState(0);

  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const isActiveRef = useRef(false);
  const unlockedRef = useRef(false);
  const runIdRef = useRef(0); // increments whenever we start/stop
  const runningRef = useRef(false); // authoritative running flag

  const stopLoop = () => {
    runIdRef.current += 1; // invalidate old loops immediately
    runningRef.current = false;

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startRef.current = null;

    setRunning(false);
    setActionProgress(0);
  };

  useEffect(() => {
    isActiveRef.current = isActive;
    if (!isActive) stopLoop(); // cancel RAF + reset state immediately
  }, [isActive]);

  useEffect(() => {
    unlockedRef.current = unlocked;
    if (isActive && !unlocked) stopLoop(); // safety: if it becomes locked, stop
  }, [unlocked, isActive]);

  const startOneCycle = () => {
    if (!unlocked) return;
    if (runningRef.current) return; // prevents double-start
    if (!isActiveRef.current) return;

    runningRef.current = true;
    setRunning(true);
    setActionProgress(0);
    startRef.current = null;

    const myRunId = runIdRef.current;

    const loop = (t: number) => {
      // If a newer run started/stopped, abort immediately
      if (runIdRef.current !== myRunId) return;

      // Also abort if not active/unlocked
      if (!isActiveRef.current || !unlockedRef.current) {
        stopLoop();
        return;
      }

      if (startRef.current == null) startRef.current = t;

      const elapsed = t - startRef.current;
      const p = clamp01(elapsed / effectiveDurationMs);
      setActionProgress(p);

      if (p < 1) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Guard again at award time
      if (runIdRef.current !== myRunId) return;
      if (!isActiveRef.current || !unlockedRef.current) {
        stopLoop();
        return;
      }

      addResource(node.resourceId, effectiveReward);
      addResource("xp" as ResourceId, effectiveXp);

      // next cycle
      startRef.current = null;
      setActionProgress(0);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  };

  // When this card becomes active, start running. When it becomes inactive, stop.
  useEffect(() => {
    if (!isActiveRef.current || !unlockedRef.current) {
      stopLoop();
      return;
    }
    if (!unlocked) return;
    if (running) return;

    // If you still want Auto gating, require (isAutoAvailable && autoEnabled) here.
    // But based on your request, selection itself should be the “run continuously” mechanism.
    startOneCycle();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, unlocked]);

  // If unlocked status changes while active (e.g., requirements met), start immediately.
  useEffect(() => {
    if (isActive && unlocked && !running) startOneCycle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, unlocked]);

  // Button click selects this node (and deselects previous automatically)
  const onSelect = () => {
    if (!unlocked) return;
    setActiveNodeId(isActive ? null : node.id);
  };

  // Optional: a “Stop” behavior by clicking again
  const onToggleSelect = () => {
    if (!unlocked) return;
    setActiveNodeId(isActive ? null : node.id);
  };

  // --- Progress bar ---
  const barProgress = unlocked ? actionProgress : unlockProgress;
  const pct = Math.floor(clamp01(barProgress) * 100);

  const barFillClass = unlocked ? "bg-sky-500" : "bg-rose-500";

  const barCenterText = unlocked
    ? `${pct}%`
    : requirementText(node.requirement);

  const barRightText =
    !unlocked && node.requirement.type === "resource_amount"
      ? `${formatInt(resources[node.requirement.resourceId] ?? 0)} / ${node.requirement.amount.toLocaleString()}`
      : "";

  const subtitle = unlocked
    ? `${formatInt(effectiveXp)} XP / ${effectiveDurationSeconds.toFixed(
        2,
      )}s • +${formatInt(effectiveReward)} ${RESOURCES[node.resourceId].name}`
    : requirementText(node.requirement);

  const autoCostText = node.auto ? formatCost(node.auto.cost) : "";
  const showAutoUnlock = !!node.auto && !isAutoAvailable;
  const showAutoToggle = !!node.auto && isAutoAvailable;

  return (
    <div className="rounded-xl bg-slate-900/60 border border-slate-700 p-5 w-full max-w-md">
      <div className="flex flex-col items-center gap-3">
        <div className="text-center">
          <div
            className={`text-lg font-semibold ${unlocked ? "text-white" : "text-slate-400"}`}
          >
            {node.label}
          </div>

          <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
        </div>

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

        <div className="mt-1 flex gap-2 items-center">
          {/* Action now means “Select & Run” */}
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
              isActive && running ? "opacity-90" : "",
            ].join(" ")}
          >
            {!unlocked ? "Locked" : isActive ? "Selected" : node.actionVerb}
          </button>

          {/* Auto (kept as you had it) */}
          {showAutoUnlock && node.auto ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => buyUpgrade(node.auto!.upgradeId)}
                disabled={!unlocked || !canAfford(resources, node.auto.cost)}
                className="px-3 py-2 rounded-md text-sm font-semibold bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
                title={autoCostText}
              >
                Unlock Auto
              </button>
              <div className="text-xs text-slate-400 whitespace-nowrap">
                {autoCostText}
              </div>
            </div>
          ) : null}

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

        <div className="w-full mt-3">
          <div className="h-3 rounded-full bg-slate-700 overflow-hidden">
            <div
              className={`h-full ${barFillClass}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs gap-2">
            <div className="text-slate-300 text-center flex-1">
              {barCenterText}
            </div>
            <div className="text-slate-400 shrink-0">{barRightText}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
