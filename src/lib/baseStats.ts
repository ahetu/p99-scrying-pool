interface StatBlock {
  str: number;
  sta: number;
  agi: number;
  dex: number;
  wis: number;
  int: number;
  cha: number;
}

const RACE_BASE_STATS: Record<string, StatBlock> = {
  "Barbarian":  { str: 103, sta: 95,  agi: 82,  dex: 70, wis: 70, int: 60,  cha: 55 },
  "Dark Elf":   { str: 60,  sta: 65,  agi: 90,  dex: 75, wis: 83, int: 99,  cha: 60 },
  "Dwarf":      { str: 90,  sta: 90,  agi: 70,  dex: 90, wis: 83, int: 60,  cha: 45 },
  "Erudite":    { str: 60,  sta: 70,  agi: 70,  dex: 70, wis: 83, int: 107, cha: 70 },
  "Gnome":      { str: 60,  sta: 70,  agi: 85,  dex: 85, wis: 67, int: 98,  cha: 60 },
  "Half Elf":   { str: 70,  sta: 70,  agi: 90,  dex: 85, wis: 60, int: 75,  cha: 75 },
  "Halfling":   { str: 70,  sta: 75,  agi: 95,  dex: 90, wis: 80, int: 67,  cha: 50 },
  "High Elf":   { str: 55,  sta: 65,  agi: 85,  dex: 70, wis: 95, int: 92,  cha: 80 },
  "Human":      { str: 75,  sta: 75,  agi: 75,  dex: 75, wis: 75, int: 75,  cha: 75 },
  "Iksar":      { str: 70,  sta: 70,  agi: 90,  dex: 85, wis: 80, int: 75,  cha: 55 },
  "Ogre":       { str: 130, sta: 122, agi: 70,  dex: 70, wis: 67, int: 60,  cha: 37 },
  "Troll":      { str: 108, sta: 109, agi: 83,  dex: 75, wis: 60, int: 52,  cha: 40 },
  "Wood Elf":   { str: 65,  sta: 65,  agi: 95,  dex: 80, wis: 80, int: 75,  cha: 75 },
};

const CLASS_STAT_BONUSES: Record<string, StatBlock> = {
  "Bard":          { str: 5,  sta: 0,  agi: 0,  dex: 0,  wis: 0,  int: 0,  cha: 10 },
  "Cleric":        { str: 5,  sta: 5,  agi: 0,  dex: 0,  wis: 10, int: 0,  cha: 0 },
  "Druid":         { str: 0,  sta: 0,  agi: 0,  dex: 0,  wis: 10, int: 0,  cha: 0 },
  "Enchanter":     { str: 0,  sta: 0,  agi: 0,  dex: 0,  wis: 0,  int: 10, cha: 0 },
  "Magician":      { str: 0,  sta: 0,  agi: 0,  dex: 0,  wis: 0,  int: 10, cha: 0 },
  "Monk":          { str: 5,  sta: 5,  agi: 10, dex: 10, wis: 0,  int: 0,  cha: 0 },
  "Necromancer":   { str: 0,  sta: 0,  agi: 0,  dex: 10, wis: 0,  int: 0,  cha: 0 },
  "Paladin":       { str: 10, sta: 5,  agi: 0,  dex: 0,  wis: 5,  int: 0,  cha: 10 },
  "Ranger":        { str: 5,  sta: 10, agi: 0,  dex: 0,  wis: 5,  int: 0,  cha: 0 },
  "Rogue":         { str: 0,  sta: 0,  agi: 0,  dex: 10, wis: 0,  int: 0,  cha: 0 },
  "Shadow Knight": { str: 10, sta: 5,  agi: 0,  dex: 0,  wis: 0,  int: 10, cha: 5 },
  "Shaman":        { str: 0,  sta: 5,  agi: 0,  dex: 0,  wis: 10, int: 0,  cha: 0 },
  "Warrior":       { str: 10, sta: 10, agi: 5,  dex: 0,  wis: 0,  int: 0,  cha: 0 },
  "Wizard":        { str: 0,  sta: 0,  agi: 0,  dex: 0,  wis: 0,  int: 10, cha: 0 },
};

const CLASS_BONUS_POINTS: Record<string, number> = {
  "Bard": 25, "Cleric": 30, "Druid": 30, "Enchanter": 30,
  "Magician": 30, "Monk": 20, "Necromancer": 30, "Paladin": 20,
  "Ranger": 20, "Rogue": 30, "Shadow Knight": 20, "Shaman": 30,
  "Warrior": 25, "Wizard": 30,
};

export function getBaseStats(race: string, className: string): StatBlock {
  const raceStats = RACE_BASE_STATS[race];
  const classBonus = CLASS_STAT_BONUSES[className];

  if (!raceStats || !classBonus) {
    return { str: 75, sta: 75, agi: 75, dex: 75, wis: 75, int: 75, cha: 75 };
  }

  return {
    str: raceStats.str + classBonus.str,
    sta: raceStats.sta + classBonus.sta,
    agi: raceStats.agi + classBonus.agi,
    dex: raceStats.dex + classBonus.dex,
    wis: raceStats.wis + classBonus.wis,
    int: raceStats.int + classBonus.int,
    cha: raceStats.cha + classBonus.cha,
  };
}

export function getBonusPointsForClass(className: string): number {
  return CLASS_BONUS_POINTS[className] || 25;
}

/**
 * HP Level Multiplier by class and level.
 * Source: https://www.project1999.com/forums/archive/index.php/t-51964.html
 */
function getHpLevelMultiplier(className: string, level: number): number {
  switch (className) {
    case "Warrior":
      if (level >= 60) return 30;
      if (level >= 57) return 29;
      if (level >= 53) return 28;
      if (level >= 40) return 27;
      if (level >= 30) return 25;
      if (level >= 20) return 23;
      return 22;
    case "Paladin":
    case "Shadow Knight":
      if (level >= 60) return 26;
      if (level >= 56) return 25;
      if (level >= 51) return 24;
      if (level >= 45) return 23;
      if (level >= 35) return 22;
      return 21;
    case "Ranger":
      if (level >= 58) return 21;
      return 20;
    case "Monk":
    case "Rogue":
    case "Bard":
      if (level >= 58) return 20;
      if (level >= 51) return 19;
      return 18;
    case "Cleric":
    case "Druid":
    case "Shaman":
      return 15;
    case "Magician":
    case "Necromancer":
    case "Enchanter":
    case "Wizard":
      return 12;
    default:
      return 15;
  }
}

/**
 * P99 HP calculation.
 * Formula: floor(ND * (5 + floor(STA * LVL * LM / 300) + floor(LVL * LM)))
 * ND = 1.0 (no Natural Durability AA on P99 classic)
 * Then add item HP.
 */
export function calculateMaxHp(
  className: string,
  level: number,
  totalSta: number,
  itemHp: number,
): number {
  const lm = getHpLevelMultiplier(className, level);
  const baseHp = Math.floor(5 + Math.floor(totalSta * level * lm / 300) + Math.floor(level * lm));
  return baseHp + itemHp;
}

const WIS_CASTERS = new Set(["Cleric", "Druid", "Shaman", "Paladin", "Ranger"]);
const INT_CASTERS = new Set(["Necromancer", "Magician", "Enchanter", "Wizard", "Shadow Knight", "Bard"]);
const NO_MANA = new Set(["Warrior", "Monk", "Rogue"]);

export function getManaStat(className: string): "wis" | "int" | null {
  if (WIS_CASTERS.has(className)) return "wis";
  if (INT_CASTERS.has(className)) return "int";
  return null;
}

/**
 * P99 mana calculation with 200 soft cap.
 * Source: https://www.project1999.com/forums/showthread.php?t=347380
 *
 * 1. MindLesserFactor = max(0, (wisOrInt - 199) / 2)
 * 2. MindFactor = wisOrInt - MindLesserFactor
 * 3. If wisOrInt > 100: baseMana = (((5 * (MindFactor + 20)) / 2) * 3 * level) / 40
 *    Else:              baseMana = (((5 * (MindFactor + 200)) / 2) * 3 * level) / 100
 * 4. Total = floor(baseMana) + itemMana
 */
export function calculateMaxMana(
  className: string,
  level: number,
  totalWis: number,
  totalInt: number,
  itemMana: number,
): number {
  const manaStat = getManaStat(className);
  if (!manaStat) return 0;

  const wisOrInt = manaStat === "wis" ? totalWis : totalInt;

  const mindLesserFactor = Math.max(0, (wisOrInt - 199) / 2);
  const mindFactor = wisOrInt - mindLesserFactor;

  let baseMana: number;
  if (wisOrInt > 100) {
    baseMana = (((5 * (mindFactor + 20)) / 2) * 3 * level) / 40;
  } else {
    baseMana = (((5 * (mindFactor + 200)) / 2) * 3 * level) / 100;
  }

  return Math.floor(baseMana) + itemMana;
}

/**
 * Defense skill cap at level 60 by class.
 * Source: https://wiki.project1999.com/Skills
 */
const CLASS_DEFENSE_CAP_60: Record<string, number> = {
  "Warrior": 252,
  "Paladin": 230,
  "Shadow Knight": 230,
  "Monk": 230,
  "Bard": 230,
  "Rogue": 230,
  "Ranger": 200,
  "Cleric": 200,
  "Druid": 200,
  "Shaman": 200,
  "Necromancer": 145,
  "Wizard": 145,
  "Magician": 145,
  "Enchanter": 145,
};

function getDefenseSkill(className: string, level: number): number {
  const cap60 = CLASS_DEFENSE_CAP_60[className] || 200;
  return Math.min(cap60, Math.floor(level * cap60 / 60));
}

function getAgiAC(agi: number): number {
  if (agi <= 74) return 0;
  if (agi <= 137) return Math.floor((agi - 74) / 3);
  if (agi <= 200) return 21 + Math.floor((agi - 137) / 4);
  return 36 + Math.floor((agi - 200) / 6);
}

/**
 * Estimated displayed AC (unbuffed).
 * Display AC ≈ floor(defense_skill / 3) + AGI_bonus + item_AC
 * Defense skill assumes max for class/level.
 */
export function calculateDisplayAC(
  className: string,
  level: number,
  totalAgi: number,
  itemAC: number,
): { total: number; defense: number; agi: number; items: number } {
  const defenseSkill = getDefenseSkill(className, level);
  const defense = Math.floor(defenseSkill / 3);
  const agi = getAgiAC(totalAgi);
  const total = defense + agi + itemAC;
  return { total, defense, agi, items: itemAC };
}

export type { StatBlock };
