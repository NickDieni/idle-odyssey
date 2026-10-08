'use client';

import { UPGRADES, type UpgradeDef } from '@/game/upgrades';
import { useGameStore } from '@/game/store';
import { useState } from 'react';
import { canAfford } from '@/game/store/costs';
import type { ResourceId } from '@/game/resources';

type Category = 'woodcutting' | 'mining' | 'fishing' | 'general';

// Define materials for each category
const CATEGORY_MATERIALS: Record<Category, ResourceId[]> = {
  woodcutting: ['oak', 'birch', 'spruce', 'maple'],
  mining: ['pebbles', 'stone', 'copper', 'tin', 'iron'],
  fishing: [],
  general: [], // No material subtabs for general
};

const CATEGORY_LABELS: Record<Category, string> = {
  woodcutting: 'Woodcutting',
  mining: 'Mining',
  fishing: 'Fishing',
  general: 'General',
};

const MATERIAL_LABELS: Record<string, string> = {
  oak: 'Oak',
  birch: 'Birch',
  spruce: 'Spruce',
  maple: 'Maple',
  pebbles: 'Pebbles',
  stone: 'Stone',
  copper: 'Copper',
  tin: 'Tin',
  iron: 'Iron',
  worm: 'Worm',
  minifish: 'Mini Fish',
  smallfish: 'Small Fish',
  goldfish: 'Goldfish',
};

function UpgradeCard({ upgrade }: { upgrade: UpgradeDef }) {
  const resources = useGameStore((s) => s.resources);
  const owned = useGameStore((s) => s.ownedUpgrades);
  const buy = useGameStore((s) => s.buyUpgrade);

  const isOwned = !!owned[upgrade.id];
  const canBuy = canAfford(resources, upgrade.cost);

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{upgrade.name}</div>
          <div className="text-sm text-gray-400">{upgrade.description}</div>
          <div className="mt-2 text-xs text-gray-400">
            Cost:{' '}
            {Object.entries(upgrade.cost).map(([rid, amt]) => (
              <span key={rid} className="mr-2">
                {rid}: {amt}
              </span>
            ))}
          </div>
        </div>

        <button
          disabled={isOwned || !canBuy}
          onClick={() => buy(upgrade.id)}
          className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
        >
          {isOwned ? 'Owned' : 'Buy'}
        </button>
      </div>
    </div>
  );
}

export default function StorePage() {
  const [activeCategory, setActiveCategory] = useState<Category>('woodcutting');
  const [activeMaterialByCategory, setActiveMaterialByCategory] = useState<
    Partial<Record<Category, ResourceId>>
  >({
    woodcutting: CATEGORY_MATERIALS.woodcutting[0],
    mining: CATEGORY_MATERIALS.mining[0],
    fishing: CATEGORY_MATERIALS.fishing[0],
  });

  const availableMaterials = CATEGORY_MATERIALS[activeCategory];
  const activeMaterial = activeCategory === 'general'
    ? null
    : activeMaterialByCategory[activeCategory] ?? availableMaterials[0] ?? null;

  const displayedUpgrades = UPGRADES.filter((upgrade) =>
    upgrade.category === activeCategory &&
    (upgrade.material || 'general') === (activeCategory === 'general' ? 'general' : activeMaterial)
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Store</h1>

      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        {(['woodcutting', 'mining', 'fishing', 'general'] as Category[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-4 py-2 font-medium transition-colors text-gray-400 hover:text-gray-300"
            style={activeCategory === cat ? { color: '#c084fc' } : undefined}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Material Subtabs */}
      {activeCategory !== 'general' && (
        <div className="flex gap-2 flex-wrap">
          {availableMaterials.map((mat) => (
            <button
              key={mat}
              onClick={() =>
                setActiveMaterialByCategory((prev) => ({
                  ...prev,
                  [activeCategory]: mat,
                }))
              }
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                activeMaterial === mat
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {MATERIAL_LABELS[mat] ?? mat}
            </button>
          ))}
        </div>
      )}

      {/* Upgrades Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {displayedUpgrades.length > 0 ? (
          displayedUpgrades.map((upgrade) => (
            <UpgradeCard key={upgrade.id} upgrade={upgrade} />
          ))
        ) : (
          <div className="col-span-2 text-center text-gray-500 py-8">
            No upgrades available for this material yet.
          </div>
        )}
      </div>
    </div>
  );
}
