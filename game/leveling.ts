export type LevelInfo = {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress01: number; // 0..1
};

// Simple curve: required XP grows gradually.
// You can change this later without rewriting UI.
export function getLevelInfo(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp));

  let level = 1;
  let xpToNext = xpRequiredForLevel(level + 1);
  let xpSoFarForThisLevel = xpRequiredForLevel(level);

  while (xp >= xpToNext) {
    level += 1;
    xpSoFarForThisLevel = xpRequiredForLevel(level);
    xpToNext = xpRequiredForLevel(level + 1);
  }

  const xpIntoLevel = xp - xpSoFarForThisLevel;
  const xpForNextLevel = xpToNext - xpSoFarForThisLevel;

  return {
    level,
    xpIntoLevel,
    xpForNextLevel,
    progress01: xpForNextLevel <= 0 ? 1 : xpIntoLevel / xpForNextLevel,
  };
}

// Total XP required to *reach* a given level.
// Level 1 => 0 XP, Level 2 => 50 XP, etc.
function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;

  // Tunable curve:
  // - early levels quick
  // - later levels grow
  const L = level - 1;
  return Math.floor(50 * L + 25 * L * L); // quadratic growth
}
