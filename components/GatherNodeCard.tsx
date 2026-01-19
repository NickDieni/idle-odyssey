'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '@/game/store';
import { RESOURCES, type ResourceId } from '@/game/resources';

// ---------- Types ----------
export type UnlockRequirement =
  | { type: 'none' }
  | { type: 'resource_amount'; resourceId: ResourceId; amount: number };

export type Cost = Partial<Record<ResourceId, number>>;

export type AutoUpgrade = {
  upgradeId: string; // must match an entry in your UPGRADES list
  cost: Cost;        // displayed next to the unlock button
};

export type GatherNode = {
  id: string;

  // UI
  actionVerb: string; // "Cut", "Mine"
  label: string;      // "Oak Tree", "Stone Vein"
  iconSrc?: string;   // "/sprites/trees/oak.png"

  // Rewards (base)
  resourceId: ResourceId; // gained resource
  rewardAmount: number;   // base amount per completion
  xp: number;             // base xp per completion

  // Timing (base)
  durationSeconds: number;

  // Unlock
  requirement: UnlockRequirement;

  // Auto upgrade (optional)
  auto?: AutoUpgrade;

  // Optional explicit stat keys if you want custom mapping
  amountStatKey?: string; // default: `prod.<resourceId>.amount`
  multStatKey?: string;   // default: `prod.<resourceId>.mult`
  speedStatKey?: string;  // default: `prod.<resourceId>.speed`
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
  if (req.type === 'none') return '';
  const name = RESOURCES[req.resourceId]?.name ?? req.resourceId;
  return `Requires ${name}: ${req.amount.toLocaleString()}`;
}

function canAfford(resources: Record<string, number>, cost: Cost): boolean {
  return Object.entries(cost).every(([rid, amt]) => (resources[rid] ?? 0) >= (amt ?? 0));
}

function formatCost(cost: Cost): string {
  return Object.entries(cost)
    .map(([rid, amt]) => `${(amt ?? 0).toLocaleString()} ${RESOURCES[rid as ResourceId]?.name ?? rid}`)
    .join(', ');
}

// ---------- Component ----------
export default function GatherNodeCard({ node }: { node: GatherNode }) {
  // --- Store ---
  const resources = useGameStore((s) => s.resources);
  const addResource = useGameStore((s) => s.addResource);
  const getStat = useGameStore((s) => s.getStat);

  // Upgrades / Auto
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);
  const isAutoAvailable = useGameStore((s) => s.isAutoAvailable(node.id));
  const autoEnabled = useGameStore((s) => !!s.autoEnabled[node.id]);
  const toggleAuto = useGameStore((s) => s.toggleAuto);

  // --- Unlock progress (locked card should look like unlocked) ---
  const unlockProgress = useMemo(() => {
    if (node.requirement.type === 'none') return 1;
    const have = resources[node.requirement.resourceId] ?? 0;
    const need = node.requirement.amount;
    if (need <= 0) return 1;
    return clamp01(have / need);
  }, [node.requirement, resources]);

  const unlocked = unlockProgress >= 1;

  // --- Stat keys (defaults derived from resourceId) ---
  const amountKey = (node.amountStatKey ?? `prod.${node.resourceId}.amount`) as any;
  const multKey = (node.multStatKey ?? `prod.${node.resourceId}.mult`) as any;
  const speedKey = (node.speedStatKey ?? `prod.${node.resourceId}.speed`) as any;

  // --- Effective numbers (effects-aware) ---
  // amountKey should be additive (default 0)
  const amountAdd = Number(getStat(amountKey) ?? 0);

  // multipliers MUST be 1 by default in baseStats
  const amountMult = Number(getStat(multKey) ?? 1);
  const speedMult = Number(getStat(speedKey) ?? 1);

  // global XP multiplier MUST be 1 by default in baseStats
  const xpMult = Number(getStat('xp.gain.mult' as any) ?? 1);

  const effectiveReward = Math.max(0, (node.rewardAmount + amountAdd) * amountMult);
  const effectiveXp = Math.max(0, node.xp * xpMult);

  // speed: higher speedMult => shorter duration
  const effectiveDurationSeconds = Math.max(0.05, node.durationSeconds / Math.max(0.01, speedMult));
  const effectiveDurationMs = effectiveDurationSeconds * 1000;

  // --- Action progress loop state ---
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
    return () => stopLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onStart = () => {
    if (!unlocked || running) return;

    setRunning(true);
    setActionProgress(0);
    startRef.current = null;

    const loop = (t: number) => {
      if (startRef.current == null) startRef.current = t;

      const elapsed = t - startRef.current;
      const p = clamp01(elapsed / effectiveDurationMs);

      setActionProgress(p);

      if (p < 1) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Award on completion
      addResource(node.resourceId, effectiveReward);
      addResource('xp' as ResourceId, effectiveXp);

      stopLoop();
    };

    rafRef.current = requestAnimationFrame(loop);
  };

  // Auto-run: if enabled and not running, start next cycle
  useEffect(() => {
    if (!unlocked) return;
    if (!isAutoAvailable) return;
    if (!autoEnabled) return;
    if (running) return;

    onStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked, isAutoAvailable, autoEnabled, running]);

  // --- Shared progress bar (no width transition during realtime progress) ---
  const barProgress = unlocked ? actionProgress : unlockProgress;
  const pct = Math.floor(clamp01(barProgress) * 100);

  const barFillClass = unlocked ? 'bg-sky-500' : 'bg-rose-500';

  const barCenterText = unlocked
    ? `${pct}%`
    : requirementText(node.requirement);

  const barRightText =
    !unlocked && node.requirement.type === 'resource_amount'
      ? `${formatInt(resources[node.requirement.resourceId] ?? 0)} / ${node.requirement.amount.toLocaleString()}`
      : '';

  const subtitle = unlocked
    ? `${formatInt(effectiveXp)} XP / ${effectiveDurationSeconds.toFixed(2)}s • +${formatInt(effectiveReward)} ${RESOURCES[node.resourceId].name}`
    : requirementText(node.requirement);

  const autoCostText = node.auto ? formatCost(node.auto.cost) : '';

  const showAutoUnlock = !!node.auto && !isAutoAvailable;
  const showAutoToggle = !!node.auto && isAutoAvailable;

  return (
    <div className="rounded-xl bg-slate-900/60 border border-slate-700 p-5 w-full max-w-md">
      <div className="flex flex-col items-center gap-3">
        {/* Header / Title */}
        <div className="text-center">

          <div className={`text-lg font-semibold ${unlocked ? 'text-white' : 'text-slate-400'}`}>
            {node.label}
          </div>

          <div className="mt-1 text-xs text-slate-400">
            {subtitle}
          </div>
        </div>

        {/* Sprite */}
        <div className={`mt-2 ${unlocked ? '' : 'grayscale opacity-60'}`}>
          {node.iconSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={node.iconSrc}
              alt={node.label}
              width={96}
              height={96}
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-slate-700" />
          )}
        </div>

        {/* Buttons row: Action + Auto (unlock or toggle) */}
        <div className="mt-1 flex gap-2 items-center">
          {/* Action */}
          <button
            onClick={onStart}
            disabled={!unlocked || running}
            className={[
              'px-5 py-2 rounded-md text-sm font-semibold transition',
              unlocked
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed',
              running ? 'opacity-60' : '',
            ].join(' ')}
          >
            {unlocked ? (running ? 'Working…' : node.actionVerb) : 'Locked'}
          </button>

          {/* Auto */}
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
                'px-3 py-2 rounded-md text-sm font-semibold transition',
                unlocked
                  ? (autoEnabled
                      ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-white')
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed',
              ].join(' ')}
              title="Toggle Auto"
            >
              Auto {autoEnabled ? 'ON' : 'OFF'}
            </button>
          ) : null}
        </div>

        {/* Progress bar area (shared for locked/unlocked) */}
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

            <div className="text-slate-400 shrink-0">
              {barRightText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
