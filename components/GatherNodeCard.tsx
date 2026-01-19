"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "@/game/store";
import { RESOURCES, type ResourceId } from "@/game/resources";

export type UnlockRequirement =
  | { type: "none" }
  | { type: "resource_amount"; resourceId: ResourceId; amount: number };

export type GatherNode = {
  id: string;

  // UI
  actionVerb: string; // "Cut", "Mine"
  label: string; // "Oak Tree", "Birch Tree", "Stone Vein"
  iconSrc?: string; // "/sprites/oak.png"

  // Rewards
  resourceId: ResourceId; // what you gain from this node
  rewardAmount: number; // how much you get per completion

  // Timing/XP
  xp: number;
  durationSeconds: number;

  // Unlock
  requirement: UnlockRequirement;
};

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

export default function GatherNodeCard({ node }: { node: GatherNode }) {
  const isAutoAvailable = useGameStore((s) => s.isAutoAvailable(node.id));
  const autoEnabled = useGameStore((s) => !!s.autoEnabled[node.id]);
  const toggleAuto = useGameStore((s) => s.toggleAuto(node.id));

  const resources = useGameStore((s) => s.resources);
  const addResource = useGameStore((s) => s.addResource);

  // --- Unlock state ---
  const unlockProgress = useMemo(() => {
    if (node.requirement.type === "none") return 1;

    const have = resources[node.requirement.resourceId] ?? 0;
    const need = node.requirement.amount;
    if (need <= 0) return 1;

    return clamp01(have / need);
  }, [node.requirement, resources]);

  const unlocked = unlockProgress >= 1;

  // --- Action progress state (only meaningful when unlocked & running) ---
  const [running, setRunning] = useState(false);
  const [actionProgress, setActionProgress] = useState(0); // 0..1
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const stopLoop = () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startRef.current = null;
    setRunning(false);
    setActionProgress(0);
  };

  useEffect(() => {
    // cleanup on unmount
    return () => stopLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onStart = () => {
    if (!unlocked || running) return;

    setRunning(true);
    setActionProgress(0);
    startRef.current = null;

    const durationMs = node.durationSeconds * 1000;

    const loop = (t: number) => {
      if (startRef.current == null) startRef.current = t;
      const elapsed = t - startRef.current;
      const p = clamp01(elapsed / durationMs);

      setActionProgress(p);

      if (p < 1) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Complete: award resource and reset
      addResource(node.resourceId, node.rewardAmount);
      addResource("xp", node.xp);
      stopLoop();
    };

    rafRef.current = requestAnimationFrame(loop);
  };

  // Shared progress bar rendering:
  // - unlocked: show action progress
  // - locked: show unlock progress (based on prerequisite resource)
  const barProgress = unlocked ? actionProgress : unlockProgress;

  // color: locked red, unlocked blue (matches your image intent)
  const barFillClass = unlocked ? "bg-sky-500" : "bg-rose-500";

  // Text under bar:
  const barText = unlocked
    ? `${Math.round(actionProgress * 100)}%`
    : node.requirement.type === "resource_amount"
      ? `Requires ${RESOURCES[node.requirement.resourceId].name}: ${formatInt(
          resources[node.requirement.resourceId] ?? 0
        )} / ${node.requirement.amount.toLocaleString()}`
      : requirementText(node.requirement);

  return (
    <div className="rounded-xl bg-slate-900/60 border border-slate-700 p-5 w-full max-w-md">
      <div className="flex flex-col items-center gap-3">
        {/* Header / Title */}
        <div className="text-center">
          <div
            className={`text-sm font-semibold ${
              unlocked ? "text-slate-200" : "text-slate-300"
            }`}
          >
            {unlocked ? node.actionVerb : "Locked"}
          </div>

          <div
            className={`text-lg font-semibold ${
              unlocked ? "text-white" : "text-slate-400"
            }`}
          >
            {node.label}
          </div>

          <div className="mt-1 text-xs text-slate-400">
            {unlocked
              ? `${node.xp} XP / ${node.durationSeconds} seconds • +${
                  node.rewardAmount
                } ${RESOURCES[node.resourceId].name}`
              : requirementText(node.requirement)}
          </div>
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
              className="image-rendering-pixelated"
              style={{ imageRendering: "pixelated" }}
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-slate-700" />
          )}
        </div>

        {/* Button: same position, but hidden/disabled in locked state */}
        <div className="mt-1 flex gap-2">
          <button
            onClick={onStart}
            disabled={!unlocked || running}
            className={[
              "px-5 py-2 rounded-md text-sm font-semibold transition",
              unlocked
                ? "bg-slate-700 hover:bg-slate-600 text-white"
                : "bg-slate-800 text-slate-500 cursor-not-allowed",
              running ? "opacity-60" : "",
            ].join(" ")}
          >
            {unlocked ? (running ? "Working…" : node.actionVerb) : "Locked"}
          </button>

          <button
            onClick={toggleAuto}
            disabled={!isAutoAvailable}
            className={[
              "px-3 py-2 rounded-md text-sm font-semibold transition",
              isAutoAvailable
                ? autoEnabled
                  ? "bg-emerald-700 hover:bg-emerald-600 text-white"
                  : "bg-slate-700 hover:bg-slate-600 text-white"
                : "bg-slate-800 text-slate-500 cursor-not-allowed",
            ].join(" ")}
          >
            Auto
          </button>
        </div>

        {/* Progress bar area (shared for locked/unlocked) */}
        <div className="w-full mt-3">
          <div className="h-3 rounded-full bg-slate-700 overflow-hidden">
            <div
              className={`h-full ${barFillClass} ${
                running ? "" : "transition-[width] duration-300"
              }`}
              style={{ width: `${Math.floor(barProgress * 100)}%` }}
            />
          </div>

          {/* Bottom row like your image: left icon + right percentage/text */}
          <div className="mt-2 flex items-center justify-between text-xs">
            <div className="text-slate-300">{barText}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
