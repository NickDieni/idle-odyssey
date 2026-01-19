'use client';

import { UPGRADES } from '@/game/upgrades';
import { useGameStore } from '@/game/store';

export default function StorePage() {
  const resources = useGameStore((s) => s.resources);
  const owned = useGameStore((s) => s.ownedUpgrades);
  const buy = useGameStore((s) => s.buyUpgrade);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Store</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {UPGRADES.map((u) => {
          const isOwned = !!owned[u.id];
          const canBuy = Object.entries(u.cost).every(([rid, amt]) => (resources[rid] ?? 0) >= (amt ?? 0));

          return (
            <div key={u.id} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-sm text-gray-400">{u.description}</div>
                  <div className="mt-2 text-xs text-gray-400">
                    Cost:{' '}
                    {Object.entries(u.cost).map(([rid, amt]) => (
                      <span key={rid} className="mr-2">
                        {rid}: {amt}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  disabled={isOwned || !canBuy}
                  onClick={() => buy(u.id)}
                  className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
                >
                  {isOwned ? 'Owned' : 'Buy'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
