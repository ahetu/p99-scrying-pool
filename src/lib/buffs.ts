export interface BuffStats {
  ac?: number;
  hp?: number;
  mana?: number;
  str?: number;
  sta?: number;
  agi?: number;
  dex?: number;
  wis?: number;
  int?: number;
  cha?: number;
  svFire?: number;
  svCold?: number;
  svDisease?: number;
  svMagic?: number;
  svPoison?: number;
}

export interface BuffDefinition {
  id: string;
  name: string;
  casterTag: string;
  category: "hpac" | "hp" | "ac" | "stats" | "mana" | "haste" | "resists" | "self";
  stats: BuffStats;
  conflicts: string[];
  /** If set, only show this buff when the character's class matches */
  classRestriction?: string[];
}

// ── External buffs (available to all classes) ───────────────────────

const EXTERNAL_BUFFS: BuffDefinition[] = [
  // HP / AC line (pick one)
  {
    id: "aegolism",
    name: "Aegolism",
    casterTag: "CLR",
    category: "hpac",
    stats: { hp: 1100, ac: 54 },
    conflicts: ["potg", "symbolOfMarzin", "bulwarkOfFaith"],
  },
  {
    id: "potg",
    name: "Protection of the Glades",
    casterTag: "DRU",
    category: "hpac",
    stats: { hp: 470, ac: 24 },
    conflicts: ["aegolism"],
  },

  // Symbol line (blocked by Aegolism)
  {
    id: "symbolOfMarzin",
    name: "Symbol of Marzin",
    casterTag: "CLR",
    category: "hp",
    stats: { hp: 700 },
    conflicts: ["aegolism"],
  },

  // AC slot 4 (blocked by Aegolism)
  {
    id: "bulwarkOfFaith",
    name: "Bulwark of Faith",
    casterTag: "CLR",
    category: "ac",
    stats: { ac: 37 },
    conflicts: ["aegolism"],
  },

  // Shaman buffs
  {
    id: "focusOfSpirit",
    name: "Focus of Spirit",
    casterTag: "SHM",
    category: "stats",
    stats: { hp: 405, str: 67, dex: 60 },
    conflicts: [
      "armorOfProtection",
      "shieldOfTheMagi_ENC",
      "shieldOfTheMagi_WIZ",
      "shieldOfTheMagi_MAG",
      "shieldOfTheMagi_NEC",
    ],
  },
  {
    id: "riotousHealth",
    name: "Riotous Health",
    casterTag: "SHM",
    category: "stats",
    stats: { sta: 50 },
    conflicts: [],
  },
  {
    id: "deliriouslyNimble",
    name: "Deliriously Nimble",
    casterTag: "SHM",
    category: "stats",
    stats: { agi: 52 },
    conflicts: [],
  },

  // Enchanter mana
  {
    id: "giftOfBrilliance",
    name: "Gift of Brilliance",
    casterTag: "ENC",
    category: "mana",
    stats: { mana: 150 },
    conflicts: [],
  },

  // Haste line (pick one — only the stat components)
  {
    id: "visionsOfGrandeur",
    name: "Visions of Grandeur",
    casterTag: "ENC",
    category: "haste",
    stats: { agi: 40, dex: 25 },
    conflicts: ["speedOfTheShissar"],
  },
  {
    id: "speedOfTheShissar",
    name: "Speed of the Shissar",
    casterTag: "ENC",
    category: "haste",
    stats: { agi: 40, ac: 12 },
    conflicts: ["visionsOfGrandeur"],
  },

  // Resist buffs
  {
    id: "resistFire",
    name: "Resist Fire",
    casterTag: "CLR",
    category: "resists",
    stats: { svFire: 40 },
    conflicts: [],
  },
  {
    id: "resistCold",
    name: "Resist Cold",
    casterTag: "CLR",
    category: "resists",
    stats: { svCold: 40 },
    conflicts: [],
  },
  {
    id: "groupResistMagic",
    name: "Group Resist Magic",
    casterTag: "ENC",
    category: "resists",
    stats: { svMagic: 55 },
    conflicts: [],
  },
  {
    id: "talismanOfShadoo",
    name: "Talisman of Shadoo",
    casterTag: "SHM",
    category: "resists",
    stats: { svPoison: 45 },
    conflicts: [],
  },
  {
    id: "talismanOfJasinth",
    name: "Talisman of Jasinth",
    casterTag: "SHM",
    category: "resists",
    stats: { svDisease: 45 },
    conflicts: [],
  },
];

// ── Class self-buffs ────────────────────────────────────────────────

const SELF_BUFFS: BuffDefinition[] = [
  {
    id: "armorOfProtection",
    name: "Armor of Protection",
    casterTag: "CLR",
    category: "self",
    stats: { hp: 225, ac: 15 },
    conflicts: ["focusOfSpirit"],
    classRestriction: ["Cleric"],
  },
  {
    id: "shieldOfTheMagi_ENC",
    name: "Shield of the Magi",
    casterTag: "ENC",
    category: "self",
    stats: { hp: 250, ac: 45, svMagic: 24 },
    conflicts: ["focusOfSpirit"],
    classRestriction: ["Enchanter"],
  },
  {
    id: "shieldOfTheMagi_WIZ",
    name: "Shield of the Magi",
    casterTag: "WIZ",
    category: "self",
    stats: { hp: 250, ac: 45, svMagic: 24 },
    conflicts: ["focusOfSpirit"],
    classRestriction: ["Wizard"],
  },
  {
    id: "shieldOfTheMagi_MAG",
    name: "Shield of the Magi",
    casterTag: "MAG",
    category: "self",
    stats: { hp: 250, ac: 45, svMagic: 24 },
    conflicts: ["focusOfSpirit"],
    classRestriction: ["Magician"],
  },
  {
    id: "shieldOfTheMagi_NEC",
    name: "Shield of the Magi",
    casterTag: "NEC",
    category: "self",
    stats: { hp: 250, ac: 45, svMagic: 24 },
    conflicts: ["focusOfSpirit"],
    classRestriction: ["Necromancer"],
  },
  {
    id: "elementalArmor",
    name: "Elemental Armor",
    casterTag: "WIZ",
    category: "self",
    stats: { svFire: 30, svCold: 30 },
    conflicts: [],
    classRestriction: ["Wizard", "Magician"],
  },
  {
    id: "armorOfFaith",
    name: "Armor of Faith",
    casterTag: "PAL",
    category: "self",
    stats: { ac: 25 },
    conflicts: [],
    classRestriction: ["Paladin"],
  },
  {
    id: "divineStrength",
    name: "Divine Strength",
    casterTag: "PAL",
    category: "self",
    stats: { hp: 200 },
    conflicts: [],
    classRestriction: ["Paladin"],
  },
  {
    id: "callOfEarth",
    name: "Call of Earth",
    casterTag: "RNG",
    category: "self",
    stats: { ac: 25 },
    conflicts: [],
    classRestriction: ["Ranger"],
  },
  {
    id: "strengthOfNature",
    name: "Strength of Nature",
    casterTag: "RNG",
    category: "self",
    stats: { hp: 75 },
    conflicts: [],
    classRestriction: ["Ranger"],
  },
];

export const ALL_BUFFS: BuffDefinition[] = [...EXTERNAL_BUFFS, ...SELF_BUFFS];

const BUFF_MAP = new Map(ALL_BUFFS.map((b) => [b.id, b]));

export function getBuffById(id: string): BuffDefinition | undefined {
  return BUFF_MAP.get(id);
}

export function getExternalBuffs(): BuffDefinition[] {
  return EXTERNAL_BUFFS;
}

export function getSelfBuffs(className: string): BuffDefinition[] {
  return SELF_BUFFS.filter(
    (b) => !b.classRestriction || b.classRestriction.includes(className)
  );
}

export function computeBuffStats(activeIds: Set<string>): BuffStats {
  const totals: BuffStats = {};
  for (const id of activeIds) {
    const buff = BUFF_MAP.get(id);
    if (!buff) continue;
    for (const [key, val] of Object.entries(buff.stats)) {
      const k = key as keyof BuffStats;
      totals[k] = (totals[k] || 0) + (val as number);
    }
  }
  return totals;
}

/**
 * Given the current active set and a buff being toggled ON,
 * returns the set of buff IDs that must be turned OFF.
 */
export function getConflicts(buffId: string, activeIds: Set<string>): string[] {
  const buff = BUFF_MAP.get(buffId);
  if (!buff) return [];
  return buff.conflicts.filter((c) => activeIds.has(c));
}

/**
 * Returns IDs of buffs that would block this buff from being active,
 * regardless of whether they're currently on.
 */
export function getBlockedBy(buffId: string, activeIds: Set<string>): string | null {
  const buff = BUFF_MAP.get(buffId);
  if (!buff) return null;
  for (const conflictId of buff.conflicts) {
    if (activeIds.has(conflictId)) {
      return BUFF_MAP.get(conflictId)?.name ?? conflictId;
    }
  }
  return null;
}
