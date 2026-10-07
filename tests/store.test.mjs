import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Load the actual TypeScript modules and their aliases without a browser or extra dependencies.
const root = fileURLToPath(new URL("../", import.meta.url));
const cache = new Map();
function load(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const loadedModule = { exports: {} };
  cache.set(filename, loadedModule);
  const localRequire = createRequire(filename);
  const requireSource = (id) => {
    // Exercise Zustand's real state engine without its React hook wrapper.
    if (id === "zustand") return { create: localRequire("zustand/vanilla").createStore };
    if (!id.startsWith(".") && !id.startsWith("@/")) return localRequire(id);
    const target = id.startsWith("@/")
      ? path.join(root, id.slice(2))
      : path.resolve(path.dirname(filename), id);
    return load(`${target}.ts`);
  };
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
  });
  vm.runInThisContext(`(function(require, module, exports) {${outputText}\n})`, { filename })(
    requireSource, loadedModule, loadedModule.exports,
  );
  return loadedModule.exports;
}

const { useGameStore: store } = load(path.join(root, "game/store.ts"));
const { RESOURCES, SELL_RESOURCES } = load(path.join(root, "game/resources.ts"));
const { visibleNodes, isNodeUnlocked } = load(path.join(root, "game/progression.ts"));
const { WOODCUTTING_NODES } = load(path.join(root, "game/nodes.ts"));
beforeEach(() => store.setState(store.getInitialState(), true));

test("reaching a requirement permanently unlocks a tree before selection or selling", (t) => {
  t.mock.method(Date, "now", () => 10000);
  store.getState().addResource("oak", 49);
  assert.equal(store.getState().unlockedNodes["tree.birch"], undefined);
  store.getState().setActiveNodeId("tree.oak");
  t.mock.method(Date, "now", () => 13000);
  store.getState().tick(0);
  assert.equal(store.getState().unlockedNodes["tree.birch"], true);
  store.getState().sellResource("oak");
  const state = store.getState();
  assert.equal(state.resources.oak, 0);
  assert.equal(isNodeUnlocked(WOODCUTTING_NODES[1], state.resources, state.unlockedNodes), true);
  assert.ok(visibleNodes(WOODCUTTING_NODES, state.resources, state.discovered, state.unlockedNodes)
    .some((node) => node.id === "tree.birch"));
  store.getState().setActiveNodeId("tree.birch");
  t.mock.method(Date, "now", () => 16000);
  store.getState().tick(0);
  assert.equal(store.getState().resources.birch, 1);
});

test("selling birch preserves spruce access and selling pebbles preserves stone access", (t) => {
  t.mock.method(Date, "now", () => 10000);
  store.getState().addResource("birch", 100);
  store.getState().sellResource("birch");
  assert.equal(store.getState().unlockedNodes["tree.spruce"], true);
  store.getState().setActiveNodeId("tree.spruce");
  t.mock.method(Date, "now", () => 13000);
  store.getState().tick(0);
  assert.equal(store.getState().resources.spruce, 1);
  store.getState().addResource("pebbles", 35);
  store.getState().sellResource("pebbles");
  assert.equal(store.getState().unlockedNodes["mine.stone"], true);
  store.getState().setActiveNodeId("mine.stone");
  t.mock.method(Date, "now", () => 16000);
  store.getState().tick(0);
  assert.equal(store.getState().resources.stone, 1);
});

test("all fish are registered, discovered on receipt, and sold for gold", () => {
  for (const id of Object.keys(SELL_RESOURCES)) {
    assert.equal(RESOURCES[id].name, SELL_RESOURCES[id].name);
    assert.equal(store.getState().resources[id], 0);
    assert.equal(store.getState().discovered[id], false);
    store.getState().addResource(id, 3);
    assert.equal(store.getState().discovered[id], true);
    const value = store.getState().getSellValue(id);
    const gold = store.getState().resources.gold;
    assert.ok(value > 0);
    assert.equal(store.getState().sellResource(id), value);
    assert.equal(store.getState().resources[id], 0);
    assert.equal(store.getState().resources.gold, gold + value);
  }
  assert.equal(store.getState().sellResource("xp"), 0);
  assert.equal(store.getState().sellResource("gold"), 0);
});

test("crafting pays mixed costs and discovers the output", () => {
  assert.equal(store.getState().craftRecipe("smithing.bronze_bar"), false);
  for (const id of ["oak", "copper", "tin"]) store.getState().addResource(id, 1);
  assert.equal(store.getState().canCraftRecipe("smithing.bronze_bar"), true);
  assert.equal(store.getState().craftRecipe("smithing.bronze_bar"), true);
  for (const id of ["oak", "copper", "tin"]) assert.equal(store.getState().resources[id], 0);
  assert.equal(store.getState().resources.bronze_bar, 1);
  assert.equal(store.getState().discovered.bronze_bar, true);
});

test("upgrades pay costs, apply effects, and cannot be bought twice", () => {
  store.getState().addResource("gold", 25);
  assert.equal(store.getState().buyUpgrade("wood.amount.plus1"), true);
  assert.equal(store.getState().resources.gold, 0);
  assert.equal(store.getState().getStat("prod.oak.amount"), 1);
  assert.equal(store.getState().buyUpgrade("wood.amount.plus1"), false);
});

test("gathering catches up, grants XP, and retains partial progress", (t) => {
  t.mock.method(Date, "now", () => 10000);
  store.getState().setActiveNodeId("tree.oak");
  t.mock.method(Date, "now", () => 17500);
  store.getState().tick(0);
  assert.equal(store.getState().resources.oak, 2);
  assert.equal(store.getState().resources.xp, 10);
  assert.equal(store.getState().gather.gatherProgress01, 0.5);
  store.getState().setActiveNodeId(null);
  assert.equal(store.getState().gather.gatherProgress01, 0);
});

test("fishing awards inventory that can be sold", (t) => {
  t.mock.method(Date, "now", () => 10000);
  t.mock.method(Math, "random", () => 0.01);
  store.getState().setActiveNodeId("fish.fishtank");
  t.mock.method(Date, "now", () => 16000);
  store.getState().tick(0);
  assert.equal(store.getState().resources.worm, 2);
  assert.equal(store.getState().resources.xp, 12);
  assert.equal(store.getState().discovered.worm, true);
  assert.equal(store.getState().sellResource("worm"), 2);
  assert.equal(store.getState().resources.gold, 2);
});

test("locked nodes grant nothing and invalid nodes stop safely", (t) => {
  t.mock.method(Date, "now", () => 10000);
  store.getState().setActiveNodeId("tree.birch");
  t.mock.method(Date, "now", () => 20000);
  store.getState().tick(0);
  assert.equal(store.getState().resources.birch, 0);
  assert.equal(store.getState().resources.xp, 0);
  store.getState().setActiveNodeId("missing");
  store.getState().tick(0);
  assert.equal(store.getState().gather.activeNodeId, null);
});
