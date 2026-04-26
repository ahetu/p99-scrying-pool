import { ItemData, ParsedStats, UpgradeItem } from "./types";
import { getClassWeights, isMeleeClass, isCasterClass, isMeleeRole, ClassWeights } from "./classStatWeights";
import { getFilteredItemsForSlot, getProcSpellData } from "./itemDatabase";
import { isRaidItem } from "./raidClassifier";

const WEAPON_SLOTS = new Set(["primary", "secondary", "range"]);

const UNOBTAINABLE_ITEMS = new Set([
  "adarra's bow of the unseen",
]);

const ROGUE_BACKSTAB_WEIGHT = 55;
const ROGUE_NON_PIERCING_PENALTY = 0.15;

const DUAL_WIELD_NON_WEAPON_PENALTY = 0.12;
const DUAL_WIELD_CLASSES = new Set(["Rogue", "Ranger", "Monk"]);

const BARD_LOW_DELAY_BONUS = 2.0;
const BARD_DELAY_BASELINE = 30;

const WEAPON_SLOT_STAT_DISCOUNT = 0.05;

function isWeaponSlot(slotId: string): boolean {
  return WEAPON_SLOTS.has(slotId);
}

/**
 * Haste scoring with diminishing returns and context awareness.
 *
 * P99 mechanics:
 * - Only the highest worn haste item applies (they don't stack)
 * - Worn haste caps at 41% in Velious
 * - Going from 0->21% is far more impactful than 36%->41%
 *
 * Diminishing returns tiers:
 *   0-21%:  full value per point
 *   21-36%: 50% value per point
 *   36-41%: 25% value per point
 */
function hasteEffectiveValue(hastePercent: number): number {
  if (hastePercent <= 0) return 0;
  const capped = Math.min(hastePercent, 41);
  let value = 0;

  const tier1 = Math.min(capped, 21);
  value += tier1;

  if (capped > 21) {
    const tier2 = Math.min(capped, 36) - 21;
    value += tier2 * 0.5;
  }

  if (capped > 36) {
    const tier3 = capped - 36;
    value += tier3 * 0.25;
  }

  return value;
}

function getHasteBonus(
  stats: ParsedStats,
  weights: ClassWeights,
  currentEquippedHaste: number
): number {
  if (!stats.haste || stats.haste <= 0) return 0;
  if (weights.hasteMultiplier <= 0) return 0;

  const itemHaste = Math.min(stats.haste, 41);

  if (itemHaste <= currentEquippedHaste) return 0;

  const newValue = hasteEffectiveValue(itemHaste);
  const oldValue = hasteEffectiveValue(currentEquippedHaste);
  const marginalValue = newValue - oldValue;

  return marginalValue * weights.hasteMultiplier;
}

/**
 * Effect scoring for P99 Velious-era worn/combat/clicky effects.
 *
 * Uses startsWith() for type matching since the database stores compound
 * types like "Combat, Casting Time: Instant" or "Must Equip, Casting Time: 10.0".
 */
/**
 * Returns a short, class-aware note explaining why an item's effect
 * contributes significantly to its score. Only generates notes for
 * effects worth ≥15 points — low-value effects don't need explanation.
 */
function getEffectNote(stats: ParsedStats, className: string, slotId: string, role?: string): string | null {
  if (!stats.effect) return null;
  const effectLower = stats.effect.toLowerCase();
  const type = (stats.effectType ?? "").toLowerCase();
  const melee = isMeleeRole(className, role);

  const isWorn = type.startsWith("worn");
  const isCombatProc = type.startsWith("combat");
  const isMustEquip = type.startsWith("must equip");
  const isAnySlot = type.startsWith("any slot");

  if (isWorn) {
    if (effectLower.includes("flowing thought")) {
      if (!isCasterClass(className) && className !== "Paladin" && className !== "Shadow Knight" && className !== "Ranger") {
        return null;
      }
      const tierMatch = effectLower.match(/flowing thought\s+(\w+)/i);
      const tierStr = tierMatch ? ` ${tierMatch[1].toUpperCase()}` : "";
      return `Flowing Thought${tierStr} — worn mana regen`;
    }

    if (effectLower.includes("regeneration") || effectLower.includes("regrowth")) {
      if (className === "Shaman") return "Worn HP regen — fuels Cannibalize for mana";
      return melee ? "Worn HP regeneration" : "Worn HP regeneration";
    }

    if (effectLower.includes("aura of battle")) {
      return melee ? "Aura of Battle — ATK buff" : null;
    }

    if (effectLower.includes("seething fury")) {
      return melee ? "Seething Fury — melee proc buff" : null;
    }

    if (effectLower.includes("rubicite aura")) {
      return melee ? "Rubicite Aura — AC buff" : null;
    }

    return null;
  }

  if (isCombatProc) {
    if (!melee || slotId === "range") return null;
    if (effectLower.includes("haste")) return "Combat proc: haste";
    return "Combat proc effect";
  }

  if (isMustEquip || isAnySlot) {
    if (effectLower.includes("haste")) {
      return melee ? "Haste clicky" : null;
    }
    return null;
  }

  return null;
}

function getEffectBonus(stats: ParsedStats, className: string, weights: ClassWeights, slotId: string, role?: string): number {
  if (!stats.effect) return 0;
  const effectLower = stats.effect.toLowerCase();
  const type = (stats.effectType ?? "").toLowerCase();
  const melee = isMeleeRole(className, role);

  const isWorn = type.startsWith("worn");
  const isCombatProc = type.startsWith("combat");
  const isMustEquip = type.startsWith("must equip");
  const isAnySlot = type.startsWith("any slot");

  if (isWorn) {
    if (effectLower.includes("flowing thought")) {
      if (!isCasterClass(className) && className !== "Paladin" && className !== "Shadow Knight" && className !== "Ranger") {
        return 2;
      }
      const tierMatch = effectLower.match(/flowing thought\s+(\w+)/);
      const tierMap: Record<string, number> = { i: 40, ii: 55, iii: 70, iv: 85, v: 100 };
      const tier = tierMatch ? tierMap[tierMatch[1].toLowerCase()] ?? 40 : 40;
      return tier;
    }

    if (effectLower.includes("regeneration") || effectLower.includes("regrowth")) {
      return melee ? 35 : 20;
    }

    if (effectLower.includes("aura of battle")) {
      return melee ? 25 : 3;
    }

    if (effectLower.includes("deadeye")) {
      return melee ? 15 : 2;
    }

    if (effectLower.includes("see invisible") || effectLower.includes("truesight") || effectLower.includes("ultravision")) {
      return 5;
    }

    if (effectLower.includes("serpent sight") || effectLower.includes("heat sight")) {
      return 4;
    }

    if (effectLower.includes("enduring breath")) {
      return 1;
    }

    if (effectLower.includes("endure magic")) {
      return 6;
    }

    if (effectLower.includes("seething fury")) {
      return melee ? 30 : 3;
    }

    if (effectLower.includes("rubicite aura")) {
      return melee ? 20 : 10;
    }

    return 8;
  }

  if (isCombatProc) {
    if (slotId === "range") return 0;
    if (effectLower.includes("haste")) {
      return melee ? 10 : 2;
    }
    if (!melee) return 3;
    const spellData = getProcSpellData(stats.effect!);
    if (!spellData) return 6;
    if (spellData.damage <= 0) return 1;
    const base = Math.sqrt(spellData.damage) * 0.1;
    return spellData.isLifetap ? base * 1.3 : base;
  }

  if (isMustEquip || isAnySlot) {
    if (effectLower.includes("haste")) {
      return melee ? 15 : 2;
    }

    if (effectLower.includes("spirit of wolf") || effectLower.includes("levitation") || effectLower.includes("gate")) {
      return 8;
    }

    if (effectLower.includes("invisib")) {
      return 6;
    }

    return 5;
  }

  return 3;
}

/**
 * Monk weight penalty with tiered severity.
 *
 * Monks lose their entire class AC bonus (~60+ AC) when total weight
 * exceeds 14 + level. Since we can't know total weight, we penalize
 * per-item weight on a steep curve that discourages heavy items.
 */
function getMonkWeightPenalty(weight: number | null): number {
  if (!weight || weight <= 0) return 0;

  if (weight <= 1.0) return 0;
  if (weight <= 3.0) return (weight - 1.0) * 1;
  if (weight <= 5.0) return 2.0 + (weight - 3.0) * 6;
  return 2.0 + 12.0 + (weight - 5.0) * 18;
}

export function scoreItem(
  stats: ParsedStats,
  className: string,
  slotId: string,
  currentEquippedHaste: number = 0,
  role?: string
): number {
  const weights = getClassWeights(className, role);
  let score = 0;

  score += (stats.hp ?? 0) * weights.hp;
  score += (stats.mana ?? 0) * weights.mana;
  score += (stats.ac ?? 0) * weights.ac;
  score += (stats.str ?? 0) * weights.str;
  score += (stats.sta ?? 0) * weights.sta;
  score += (stats.dex ?? 0) * weights.dex;
  score += (stats.agi ?? 0) * weights.agi;
  score += (stats.wis ?? 0) * weights.wis;
  score += (stats.int ?? 0) * weights.int;
  score += (stats.cha ?? 0) * weights.cha;

  score += (stats.svFire ?? 0) * weights.svFire;
  score += (stats.svCold ?? 0) * weights.svCold;
  score += (stats.svDisease ?? 0) * weights.svDisease;
  score += (stats.svMagic ?? 0) * weights.svMagic;
  score += (stats.svPoison ?? 0) * weights.svPoison;

  if (isWeaponSlot(slotId)) {
    score *= WEAPON_SLOT_STAT_DISCOUNT;
  }

  let finalMultiplier = 1.0;
  const isActualWeapon = stats.damage !== null && stats.delay !== null;

  const shouldDualWield =
    DUAL_WIELD_CLASSES.has(className) ||
    (className === "Warrior" && role === "dps");

  const melee = isMeleeRole(className, role);

  if (isWeaponSlot(slotId)) {
    if (melee) {
      if (className === "Rogue" && slotId === "primary") {
        const isPiercing = stats.skill?.toLowerCase() === "piercing";
        if (isPiercing) {
          score += (stats.damage ?? 0) * ROGUE_BACKSTAB_WEIGHT;
        } else if (isActualWeapon) {
          finalMultiplier = ROGUE_NON_PIERCING_PENALTY;
        } else {
          finalMultiplier = DUAL_WIELD_NON_WEAPON_PENALTY;
        }
      } else if (className === "Bard") {
        if (isActualWeapon) {
          if (stats.ratio) score += stats.ratio * weights.weaponRatio;
          const delay = stats.delay ?? 30;
          score += Math.max(0, BARD_DELAY_BASELINE - delay) * BARD_LOW_DELAY_BONUS;
        }
      } else {
        if (isActualWeapon) {
          if (stats.ratio) score += stats.ratio * weights.weaponRatio;
        }
      }
    }

    if (slotId === "secondary" && shouldDualWield && !isActualWeapon) {
      finalMultiplier = DUAL_WIELD_NON_WEAPON_PENALTY;
    }
  }

  if (className === "Monk") {
    score -= getMonkWeightPenalty(stats.weight);
  }

  score += getHasteBonus(stats, weights, currentEquippedHaste);
  score += getEffectBonus(stats, className, weights, slotId, role);

  score *= finalMultiplier;

  return Math.round(score * 100) / 100;
}

function extractKeyStats(stats: ParsedStats): Record<string, number> {
  const pairs: [string, number | null][] = [
    ["hp", stats.hp], ["mana", stats.mana], ["ac", stats.ac],
    ["str", stats.str], ["sta", stats.sta], ["dex", stats.dex],
    ["agi", stats.agi], ["wis", stats.wis], ["int", stats.int],
    ["cha", stats.cha],
    ["svFire", stats.svFire], ["svCold", stats.svCold],
    ["svMagic", stats.svMagic], ["svPoison", stats.svPoison],
    ["svDisease", stats.svDisease],
  ];

  if (stats.damage !== null) pairs.unshift(["dmg", stats.damage]);
  if (stats.delay !== null) pairs.push(["delay", stats.delay]);
  if (stats.haste !== null) pairs.push(["haste", stats.haste]);

  const result: Record<string, number> = {};
  for (const [key, val] of pairs) {
    if (val !== null && val !== 0) result[key] = val;
  }
  return result;
}

function computeStatDiffs(
  candidateStats: ParsedStats,
  currentStats: ParsedStats | null
): Record<string, number> {
  if (!currentStats) return extractKeyStats(candidateStats);

  const keys: (keyof ParsedStats)[] = [
    "hp", "mana", "ac", "str", "sta", "dex", "agi", "wis", "int", "cha",
    "svFire", "svCold", "svMagic", "svPoison", "svDisease",
    "damage", "haste",
  ];

  const diffs: Record<string, number> = {};
  for (const key of keys) {
    const cand = (candidateStats[key] as number | null) ?? 0;
    const curr = (currentStats[key] as number | null) ?? 0;
    const diff = cand - curr;
    if (diff !== 0) diffs[key] = diff;
  }

  const candDelay = candidateStats.delay ?? 0;
  const currDelay = currentStats.delay ?? 0;
  if (candDelay !== 0 || currDelay !== 0) {
    const delayDiff = candDelay - currDelay;
    if (delayDiff !== 0) diffs["speed"] = -delayDiff;
  }

  return diffs;
}

function getItemFlags(stats: ParsedStats): string[] {
  const flags: string[] = [];
  if (stats.noDrop) flags.push("NO DROP");
  if (stats.lore) flags.push("LORE");
  if (stats.magic) flags.push("MAGIC");
  return flags;
}

export function getUpgradesForSlot(
  slotId: string,
  className: string,
  race: string,
  currentItem: ItemData | null,
  equippedLoreItems: Set<string>,
  currentEquippedHaste: number = 0,
  role?: string
): { upgrades: UpgradeItem[]; currentScore: number } {
  const candidates = getFilteredItemsForSlot(slotId, className, race);

  const currentScore = currentItem?.stats
    ? scoreItem(currentItem.stats, className, slotId, currentEquippedHaste, role)
    : 0;

  const upgrades: UpgradeItem[] = [];

  for (const candidate of candidates) {
    if (!candidate.stats) continue;

    if (candidate.stats.noRent || /NO RENT|TEMPORARY/i.test(candidate.statsBlock)) continue;
    if (UNOBTAINABLE_ITEMS.has(candidate.name.toLowerCase())) continue;

    const hasSource = candidate.dropsfrom
      || (candidate.dropmobs && candidate.dropmobs.length > 0)
      || (candidate.relatedquests && candidate.relatedquests.length > 0)
      || candidate.soldby
      || candidate.crafted;
    if (!hasSource) continue;

    if (currentItem && candidate.name.toLowerCase() === currentItem.name.toLowerCase()) {
      continue;
    }

    if (candidate.stats.lore && equippedLoreItems.has(candidate.name.toLowerCase())) {
      continue;
    }

    const candidateScore = scoreItem(candidate.stats, className, slotId, currentEquippedHaste, role);

    const MIN_UPGRADE_DELTA = 1.0;
    if (candidateScore - currentScore < MIN_UPGRADE_DELTA) continue;

    upgrades.push({
      name: candidate.name,
      lucyImgId: candidate.lucyImgId,
      wikiUrl: candidate.wikiUrl,
      dropsfrom: candidate.dropsfrom,
      relatedquests: candidate.relatedquests ?? null,
      soldby: candidate.soldby ?? false,
      crafted: candidate.crafted ?? false,
      isRaid: isRaidItem(candidate.dropsfrom, candidate.dropmobs ?? null, candidate.relatedquests ?? null, candidate.statsBlock),
      score: candidateScore,
      keyStats: extractKeyStats(candidate.stats),
      statDiffs: computeStatDiffs(candidate.stats, currentItem?.stats ?? null),
      flags: getItemFlags(candidate.stats),
      effectNote: getEffectNote(candidate.stats, className, slotId, role),
    });
  }

  upgrades.sort((a, b) => b.score - a.score);

  return { upgrades, currentScore };
}
