/**
 * P99 Velious-era class stat weight profiles.
 *
 * Each weight is a multiplier applied to the raw stat value.
 *
 * Tuning principles:
 * - Primary stat (STR for melee DPS, STA for tanks, WIS/INT/CHA for casters)
 *   should be 3.5–6.0 to create headroom for clear secondary/tertiary tiers.
 * - HP/Mana appear in large quantities on items (35-150), so per-point weight
 *   stays low (0.25–0.6). For DPS classes, losing 5 of their primary stat
 *   should NEVER be worth gaining only 35 HP.
 * - Resists are on a small item budget (2-10 per item, ~100 endgame total).
 *   Per point, svMagic should be above HP and AC for non-tank classes. A single
 *   uniform resist set is shared across all profiles via the RESISTS constant.
 * - Tank classes (Warrior/Paladin/SK in tank role) keep higher AC weights
 *   since physical mitigation IS their primary role.
 * - Useless stats get small positive tiebreaker values (0.05) so items with
 *   bonus stats are preferred over identical items without.
 */

export interface ClassWeights {
  hp: number;
  mana: number;
  ac: number;
  str: number;
  sta: number;
  dex: number;
  agi: number;
  wis: number;
  int: number;
  cha: number;
  svFire: number;
  svCold: number;
  svDisease: number;
  svMagic: number;
  svPoison: number;
  weaponRatio: number;
  hasteMultiplier: number;
}

export const ROLE_TOGGLE_CLASSES = new Set(["Warrior", "Paladin", "Shadow Knight", "Shaman"]);

const RESISTS = {
  svFire: 0.5, svCold: 0.45, svDisease: 0.3, svMagic: 0.7, svPoison: 0.35,
};

const PROFILES: Record<string, ClassWeights> = {
  Warrior: {
    hp: 0.6, mana: 0, ac: 1.5,
    str: 2.5, sta: 3.5, dex: 1.5, agi: 0.15,
    wis: 0.05, int: 0.05, cha: 0.05,
    ...RESISTS,
    weaponRatio: 65, hasteMultiplier: 30,
  },
  "Warrior:dps": {
    hp: 0.5, mana: 0, ac: 0.4,
    str: 5.0, sta: 1.5, dex: 3.5, agi: 0.15,
    wis: 0.05, int: 0.05, cha: 0.05,
    ...RESISTS,
    weaponRatio: 75, hasteMultiplier: 35,
  },
  Paladin: {
    hp: 0.6, mana: 0.6, ac: 1.2,
    str: 2.0, sta: 3.0, dex: 0.8, agi: 0.15,
    wis: 4.0, int: 0.05, cha: 0.3,
    ...RESISTS,
    weaponRatio: 45, hasteMultiplier: 25,
  },
  "Paladin:dps": {
    hp: 0.5, mana: 0.5, ac: 0.5,
    str: 3.5, sta: 1.5, dex: 1.5, agi: 0.15,
    wis: 4.0, int: 0.05, cha: 0.2,
    ...RESISTS,
    weaponRatio: 55, hasteMultiplier: 28,
  },
  "Shadow Knight": {
    hp: 0.6, mana: 0.6, ac: 1.2,
    str: 2.0, sta: 3.0, dex: 0.8, agi: 0.15,
    wis: 0.05, int: 4.0, cha: 0.3,
    ...RESISTS,
    weaponRatio: 45, hasteMultiplier: 25,
  },
  "Shadow Knight:dps": {
    hp: 0.5, mana: 0.5, ac: 0.5,
    str: 4.0, sta: 1.5, dex: 1.5, agi: 0.15,
    wis: 0.05, int: 4.0, cha: 0.15,
    ...RESISTS,
    weaponRatio: 55, hasteMultiplier: 28,
  },
  Monk: {
    hp: 0.5, mana: 0, ac: 0.5,
    str: 4.5, sta: 2.0, dex: 1.5, agi: 0.2,
    wis: 0.05, int: 0.05, cha: 0.05,
    ...RESISTS,
    weaponRatio: 50, hasteMultiplier: 30,
  },
  Rogue: {
    hp: 0.5, mana: 0, ac: 0.2,
    str: 5.0, sta: 1.0, dex: 2.0, agi: 0.1,
    wis: 0.05, int: 0.05, cha: 0.05,
    ...RESISTS,
    weaponRatio: 55, hasteMultiplier: 28,
  },
  Ranger: {
    hp: 0.5, mana: 0.4, ac: 0.5,
    str: 3.5, sta: 2.0, dex: 1.5, agi: 0.2,
    wis: 3.0, int: 0.05, cha: 0.05,
    ...RESISTS,
    weaponRatio: 55, hasteMultiplier: 28,
  },
  Bard: {
    hp: 0.5, mana: 0.2, ac: 0.4,
    str: 1.2, sta: 2.0, dex: 2.5, agi: 0.15,
    wis: 0.05, int: 0.05, cha: 5.0,
    ...RESISTS,
    weaponRatio: 20, hasteMultiplier: 15,
  },
  Cleric: {
    hp: 0.4, mana: 0.6, ac: 0.3,
    str: 0.1, sta: 0.5, dex: 0.05, agi: 0.1,
    wis: 6.0, int: 0.05, cha: 0.1,
    ...RESISTS,
    weaponRatio: 0, hasteMultiplier: 0,
  },
  Druid: {
    hp: 0.35, mana: 0.6, ac: 0.1,
    str: 0.1, sta: 0.4, dex: 0.05, agi: 0.05,
    wis: 6.0, int: 0.05, cha: 0.1,
    ...RESISTS,
    weaponRatio: 0, hasteMultiplier: 0,
  },
  Shaman: {
    hp: 0.5, mana: 0.5, ac: 0.35,
    str: 0.1, sta: 0.8, dex: 0.1, agi: 0.1,
    wis: 5.5, int: 0.05, cha: 0.15,
    ...RESISTS,
    weaponRatio: 0, hasteMultiplier: 3,
  },
  "Shaman:dps": {
    hp: 0.55, mana: 0.35, ac: 0.5,
    str: 3.5, sta: 2.0, dex: 1.5, agi: 0.3,
    wis: 2.5, int: 0.05, cha: 0.05,
    ...RESISTS,
    weaponRatio: 20, hasteMultiplier: 18,
  },
  Enchanter: {
    hp: 0.35, mana: 0.7, ac: 0.05,
    str: 0.1, sta: 0.2, dex: 0.05, agi: 0.05,
    wis: 0.05, int: 5.0, cha: 6.0,
    ...RESISTS,
    weaponRatio: 0, hasteMultiplier: 0,
  },
  Magician: {
    hp: 0.3, mana: 0.7, ac: 0.05,
    str: 0.1, sta: 0.2, dex: 0.05, agi: 0.05,
    wis: 0.05, int: 6.0, cha: 0.05,
    ...RESISTS,
    weaponRatio: 0, hasteMultiplier: 0,
  },
  Necromancer: {
    hp: 0.3, mana: 0.7, ac: 0.05,
    str: 0.1, sta: 0.2, dex: 0.05, agi: 0.05,
    wis: 0.05, int: 6.0, cha: 0.05,
    ...RESISTS,
    weaponRatio: 0, hasteMultiplier: 0,
  },
  Wizard: {
    hp: 0.25, mana: 0.8, ac: 0.05,
    str: 0.1, sta: 0.2, dex: 0.05, agi: 0.05,
    wis: 0.05, int: 6.0, cha: 0.05,
    ...RESISTS,
    weaponRatio: 0, hasteMultiplier: 0,
  },
};

export function getClassWeights(className: string, role?: string): ClassWeights {
  if (role === "dps" && ROLE_TOGGLE_CLASSES.has(className)) {
    return PROFILES[`${className}:dps`] ?? PROFILES[className] ?? PROFILES["Warrior"];
  }
  return PROFILES[className] ?? PROFILES["Warrior"];
}

const ROLE_LABELS: Record<string, { default: string; alternate: string }> = {
  Shaman: { default: "Healing", alternate: "Melee" },
};

const DEFAULT_ROLE_LABELS = { default: "Tank", alternate: "DPS" };

export function getRoleLabels(className: string): { default: string; alternate: string } {
  return ROLE_LABELS[className] ?? DEFAULT_ROLE_LABELS;
}

export function isMeleeRole(className: string, role?: string): boolean {
  return isMeleeClass(className) || (className === "Shaman" && role === "dps");
}

const MELEE_CLASSES = new Set([
  "Warrior", "Paladin", "Shadow Knight", "Monk", "Rogue", "Ranger", "Bard",
]);

const CASTER_CLASSES = new Set([
  "Cleric", "Druid", "Shaman", "Enchanter", "Magician", "Necromancer", "Wizard",
]);

const HEALER_CLASSES = new Set(["Cleric", "Druid", "Shaman"]);

const INT_CASTER_CLASSES = new Set(["Enchanter", "Magician", "Necromancer", "Wizard"]);

export function isMeleeClass(className: string): boolean {
  return MELEE_CLASSES.has(className);
}

export function isCasterClass(className: string): boolean {
  return CASTER_CLASSES.has(className);
}

export function isHealerClass(className: string): boolean {
  return HEALER_CLASSES.has(className);
}

export function isIntCasterClass(className: string): boolean {
  return INT_CASTER_CLASSES.has(className);
}
