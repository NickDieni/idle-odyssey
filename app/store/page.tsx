'use client';

import { UPGRADES, type UpgradeDef } from '@/game/upgrades';
import { useGameStore } from '@/game/store';
import { useState, useMemo } from 'react';
import type { ResourceId } from '@/game/resources';

type Category = 'woodcutting' | 'mining' | 'fishing' | 'general';

// Define materials for each category
const CATEGORY_MATERIALS: Record<Category, ResourceId[]> = {
  woodcutting: ['oak', 'birch', 'spruce'],
  mining: ['pebbles', 'stone', 'copper', 'iron'],
  fishing: ['worm', 'minifish', 'smallfish', 'goldfish'],
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
  pebbles: 'Pebbles',
  stone: 'Stone',
  copper: 'Copper',
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
  const canBuy = Object.entries(upgrade.cost).every(
    ([rid, amt]) => (resources[rid] ?? 0) >= (amt ?? 0)
  );

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
  const [activeMaterial, setActiveMaterial] = useState<ResourceId | null>('oak');

  // Group upgrades by category and material
  const upgradesByCategory = useMemo(() => {
    const grouped: Record<Category, Record<string, UpgradeDef[]>> = {
      woodcutting: {},
      mining: {},
      fishing: {},
      general: {},
    };

    UPGRADES.forEach((upgrade) => {
      const category = upgrade.category;
      const material = upgrade.material || 'general';
      
      if (!grouped[category][material]) {
        grouped[category][material] = [];
      }
      grouped[category][material].push(upgrade);
    });

    return grouped;
  }, []);

  // Get available materials for current category
  const availableMaterials = useMemo(() => {
    const materials = CATEGORY_MATERIALS[activeCategory];
    if (activeCategory === 'general') return [];
    
    // Filter to only show materials that have upgrades
    return materials.filter((mat) => 
      upgradesByCategory[activeCategory][mat]?.length > 0
    );
  }, [activeCategory, upgradesByCategory]);

  // Auto-select first available material when category changes
  useMemo(() => {
    if (activeCategory === 'general') {
      setActiveMaterial(null);
    } else if (availableMaterials.length > 0 && !availableMaterials.includes(activeMaterial as ResourceId)) {
      setActiveMaterial(availableMaterials[0]);
    }
  }, [activeCategory, availableMaterials, activeMaterial]);

  // Get upgrades to display
  const displayedUpgrades = useMemo(() => {
    if (activeCategory === 'general') {
      return upgradesByCategory.general.general || [];
    }
    if (activeMaterial) {
      return upgradesByCategory[activeCategory][activeMaterial] || [];
    }
    return [];
  }, [activeCategory, activeMaterial, upgradesByCategory]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Store</h1>

      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        {(['woodcutting', 'mining', 'fishing', 'general'] as Category[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeCategory === cat
                ? 'text-gray-400 hover:text-gray-300'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            style={activeCategory === cat ? { color: '#c084fc' } : undefined}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Material Subtabs */}
      {activeCategory !== 'general' && availableMaterials.length > 0 && (
        <div className="flex gap-2 border-b border-gray-800">
          {availableMaterials.map((mat) => (
            <button
              key={mat}
              onClick={() => setActiveMaterial(mat)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                activeMaterial === mat
                  ? 'text-gray-500 hover:text-gray-400'
                  : 'text-gray-500 hover:text-gray-400'
              }`}
              style={activeMaterial === mat ? { color: '#d8b4fe' } : undefined}
            >
              {MATERIAL_LABELS[mat]}
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
