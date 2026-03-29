/**
 * P99 Velious-era class stat weight profiles.
 *
 * Each weight is a multiplier applied to the raw stat value. HP/Mana weights
 * are proportionally lower because item values are 5-10x larger (e.g., +100 HP
 * vs +10 WIS).
 *
 * Key tuning principle: for casters/healers, +1 of their primary casting stat
 * (WIS/INT) yields ~10 mana. Their primary stat weight should dominate HP/AC
 * so that a +5 WIS item always beats a +25 HP item with random tiebreaker stats.
 * Melee classes keep higher HP/AC weights since survivability IS their job.
 *
 * Stats that are "useless" for a class still get small positive tiebreaker
 * values (0.02-0.05) so that items with bonus stats are correctly preferred
 * over items without, all else being equal.
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

export const ROLE_TOGGLE_CLASSES = new Set(["Warrior", "Paladin", "Shadow Knight"]);

const PROFILES: Record<string, ClassWeights> = {
  Warrior: {
    hp: 1.5, mana: 0.01, ac: 1.2,
    str: 1.5, sta: 1.8, dex: 0.8, agi: 0.6,
    wis: 0.02, int: 0.02, cha: 0.02,
    svFire: 0.2, svCold: 0.15, svDisease: 0.1, svMagic: 0.25, svPoison: 0.1,
    weaponRatio: 25, hasteMultiplier: 30,
  },
  "Warrior:dps": {
    hp: 1.0, mana: 0.01, ac: 0.5,
    str: 2.2, sta: 0.8, dex: 1.8, agi: 0.4,
    wis: 0.02, int: 0.02, cha: 0.02,
    svFire: 0.12, svCold: 0.1, svDisease: 0.06, svMagic: 0.15, svPoison: 0.06,
    weaponRatio: 30, hasteMultiplier: 35,
  },
  Paladin: {
    hp: 1.3, mana: 0.6, ac: 1.0,
    str: 1.0, sta: 1.5, dex: 0.4, agi: 0.5,
    wis: 2.5, int: 0.02, cha: 0.2,
    svFire: 0.2, svCold: 0.15, svDisease: 0.1, svMagic: 0.25, svPoison: 0.1,
    weaponRatio: 18, hasteMultiplier: 25,
  },
  "Paladin:dps": {
    hp: 1.0, mana: 0.5, ac: 0.6,
    str: 2.0, sta: 1.0, dex: 1.0, agi: 0.4,
    wis: 2.5, int: 0.02, cha: 0.1,
    svFire: 0.15, svCold: 0.1, svDisease: 0.08, svMagic: 0.18, svPoison: 0.08,
    weaponRatio: 22, hasteMultiplier: 28,
  },
  "Shadow Knight": {
    hp: 1.3, mana: 0.6, ac: 1.0,
    str: 1.2, sta: 1.5, dex: 0.4, agi: 0.5,
    wis: 0.02, int: 2.5, cha: 0.2,
    svFire: 0.2, svCold: 0.15, svDisease: 0.1, svMagic: 0.25, svPoison: 0.1,
    weaponRatio: 18, hasteMultiplier: 25,
  },
  "Shadow Knight:dps": {
    hp: 1.0, mana: 0.5, ac: 0.6,
    str: 2.2, sta: 1.0, dex: 1.0, agi: 0.4,
    wis: 0.02, int: 2.5, cha: 0.1,
    svFire: 0.15, svCold: 0.1, svDisease: 0.08, svMagic: 0.18, svPoison: 0.08,
    weaponRatio: 22, hasteMultiplier: 28,
  },
  Monk: {
    hp: 1.2, mana: 0.01, ac: 0.6,
    str: 2.2, sta: 1.2, dex: 1.2, agi: 0.5,
    wis: 0.02, int: 0.02, cha: 0.02,
    svFire: 0.15, svCold: 0.1, svDisease: 0.08, svMagic: 0.18, svPoison: 0.08,
    weaponRatio: 20, hasteMultiplier: 30,
  },
  Rogue: {
    hp: 0.8, mana: 0.01, ac: 0.5,
    str: 2.5, sta: 0.8, dex: 1.5, agi: 0.4,
    wis: 0.02, int: 0.02, cha: 0.02,
    svFire: 0.12, svCold: 0.08, svDisease: 0.06, svMagic: 0.15, svPoison: 0.06,
    weaponRatio: 22, hasteMultiplier: 28,
  },
  Ranger: {
    hp: 1.2, mana: 0.3, ac: 0.8,
    str: 1.8, sta: 1.2, dex: 1.0, agi: 0.5,
    wis: 1.5, int: 0.02, cha: 0.03,
    svFire: 0.15, svCold: 0.1, svDisease: 0.08, svMagic: 0.18, svPoison: 0.08,
    weaponRatio: 22, hasteMultiplier: 28,
  },
  Bard: {
    hp: 1.0, mana: 0.2, ac: 0.6,
    str: 0.8, sta: 1.0, dex: 1.5, agi: 0.5,
    wis: 0.03, int: 0.03, cha: 2.5,
    svFire: 0.12, svCold: 0.08, svDisease: 0.06, svMagic: 0.15, svPoison: 0.06,
    weaponRatio: 8, hasteMultiplier: 15,
  },
  Cleric: {
    hp: 0.35, mana: 0.8, ac: 0.25,
    str: 0.04, sta: 0.25, dex: 0.03, agi: 0.1,
    wis: 6.0, int: 0.02, cha: 0.05,
    svFire: 0.15, svCold: 0.12, svDisease: 0.08, svMagic: 0.2, svPoison: 0.08,
    weaponRatio: 0, hasteMultiplier: 0,
  },
  Druid: {
    hp: 0.3, mana: 0.8, ac: 0.15,
    str: 0.04, sta: 0.2, dex: 0.03, agi: 0.1,
    wis: 6.0, int: 0.02, cha: 0.05,
    svFire: 0.15, svCold: 0.12, svDisease: 0.08, svMagic: 0.2, svPoison: 0.08,
    weaponRatio: 0, hasteMultiplier: 0,
  },
  Shaman: {
    hp: 0.45, mana: 0.8, ac: 0.3,
    str: 0.08, sta: 0.35, dex: 0.05, agi: 0.12,
    wis: 5.5, int: 0.02, cha: 0.1,
    svFire: 0.15, svCold: 0.12, svDisease: 0.08, svMagic: 0.2, svPoison: 0.08,
    weaponRatio: 0, hasteMultiplier: 8,
  },
  Enchanter: {
    hp: 0.3, mana: 0.9, ac: 0.12,
    str: 0.03, sta: 0.15, dex: 0.02, agi: 0.08,
    wis: 0.02, int: 6.0, cha: 4.0,
    svFire: 0.15, svCold: 0.12, svDisease: 0.08, svMagic: 0.2, svPoison: 0.08,
    weaponRatio: 0, hasteMultiplier: 0,
  },
  Magician: {
    hp: 0.25, mana: 0.9, ac: 0.12,
    str: 0.03, sta: 0.15, dex: 0.02, agi: 0.08,
    wis: 0.02, int: 6.0, cha: 0.03,
    svFire: 0.15, svCold: 0.12, svDisease: 0.08, svMagic: 0.2, svPoison: 0.08,
    weaponRatio: 0, hasteMultiplier: 0,
  },
  Necromancer: {
    hp: 0.25, mana: 0.9, ac: 0.12,
    str: 0.03, sta: 0.15, dex: 0.02, agi: 0.08,
    wis: 0.02, int: 6.0, cha: 0.03,
    svFire: 0.15, svCold: 0.12, svDisease: 0.08, svMagic: 0.2, svPoison: 0.08,
    weaponRatio: 0, hasteMultiplier: 0,
  },
  Wizard: {
    hp: 0.25, mana: 1.0, ac: 0.12,
    str: 0.03, sta: 0.15, dex: 0.02, agi: 0.08,
    wis: 0.02, int: 6.0, cha: 0.03,
    svFire: 0.15, svCold: 0.12, svDisease: 0.08, svMagic: 0.2, svPoison: 0.08,
    weaponRatio: 0, hasteMultiplier: 0,
  },
};

export function getClassWeights(className: string, role?: string): ClassWeights {
  if (role === "dps" && ROLE_TOGGLE_CLASSES.has(className)) {
    return PROFILES[`${className}:dps`] ?? PROFILES[className] ?? PROFILES["Warrior"];
  }
  return PROFILES[className] ?? PROFILES["Warrior"];
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
