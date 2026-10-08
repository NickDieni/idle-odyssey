# Idle Odyssey

A Next.js idle game. The UI reads game state from a Zustand store; game rules and content live in `game/`.

## Run locally

From this directory:

```sh
npm install
npm run dev
```

Open http://localhost:3000. The store also uses `zustand`, currently installed by the parent workspace's `package.json`. When setting up a fresh checkout, run `npm install` in the parent directory too.

## Where to make changes

| Change | File |
| --- | --- |
| Trees, mines, fish tables, requirements, rewards, and durations | `game/nodes.ts` |
| Resource names and initial discovery | `game/resources.ts` |
| Sale prices | `game/selling.ts` |
| Upgrade prices and effects | `game/upgrades.ts` |
| Crafting recipes and payment order for interchangeable ingredients | `game/crafting.ts` |
| Level progression | `game/leveling.ts` |
| Initial inventory and base stats | `game/store/initial-state.ts` |
| Gathering, elapsed time, XP, and rewards | `game/store/gathering.ts` |
| Permanent unlocks and which nodes are visible | `game/progression.ts` |
| Effect stacking and stat calculations | `game/resolve.ts` |
| Navigation | `components/Sidebar.tsx` |
| Page content | `app/<page>/page.tsx` |

## How the game works

`game/store.ts` combines small groups of actions from `game/store/`. Components select the state they need and call those actions. Keep inventory changes and game rules in the store rather than inside page components.

Gathering selects one active node. Each tick uses elapsed wall-clock time to calculate completed actions and retain partial progress. Fishing rolls one fish per completed action. Woodcutting and mining calculate rewards from the node's base reward, additions, and multipliers.

Reaching a requirement permanently unlocks a node; selling or crafting with its prerequisite resources does not lock it again. Resource discovery is separate from node unlocking.

Effects add to a stat first, then multiply it. Production stat names are defined in `game/effects.ts`, along with the resources that receive initial production stats. The legacy `speed` modifier type remains accepted but does not affect calculations; speed upgrades use `mul` on a speed stat.

`GatheringPage` shares the woodcutting and mining page layout. Gathering cards share formatting, requirement text, and unlock progress helpers. The store page filters the upgrade list directly by the selected category and material.

## Validate changes

```sh
npm test
npm run lint
npx tsc --noEmit
npm run build
```

On Windows PowerShell with script execution disabled, use `npm.cmd` and `npx.cmd`.

The tests execute the actual TypeScript game modules with Zustand's state engine. They cover gathering, fishing, selling, crafting, upgrades, effects, and permanent unlocks.
