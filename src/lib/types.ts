export interface BonusPointAllocation {
  str: number;
  sta: number;
  agi: number;
  dex: number;
  wis: number;
  int: number;
  cha: number;
}

export interface Character {
  id: string;
  name: string;
  className: string;
  level: number;
  race: string;
  server: string;
  equipment: Record<string, EquippedItem | null>;
  bonusPoints?: BonusPointAllocation;
  createdAt: string;
  updatedAt: string;
}

export interface EquippedItem {
  name: string;
  itemId: number;
  slot: string;
}

export interface ItemData {
  name: string;
  lucyImgId: number | null;
  statsBlock: string;
  dropsfrom: string | null;
  stats: ParsedStats | null;
  wikiUrl: string;
  fetchedAt: string;
}

export interface UpgradeItem {
  name: string;
  lucyImgId: number | null;
  wikiUrl: string;
  dropsfrom: string | null;
  score: number;
  keyStats: Record<string, number>;
  statDiffs: Record<string, number>;
  flags: string[];
}

export interface ParsedStats {
  magic: boolean;
  lore: boolean;
  noDrop: boolean;
  noRent: boolean;
  expendable: boolean;
  quest: boolean;

  slots: string[];
  skill: string | null;
  damage: number | null;
  delay: number | null;
  ratio: number | null;
  ac: number | null;
  hp: number | null;
  mana: number | null;

  str: number | null;
  sta: number | null;
  dex: number | null;
  agi: number | null;
  wis: number | null;
  int: number | null;
  cha: number | null;

  svFire: number | null;
  svCold: number | null;
  svDisease: number | null;
  svMagic: number | null;
  svPoison: number | null;

  haste: number | null;
  effect: string | null;
  effectType: string | null;

  weight: number | null;
  size: string | null;
  classes: string[];
  races: string[];
}

export interface CharacterSummary {
  id: string;
  name: string;
  className: string;
  level: number;
  race: string;
  server: string;
  createdAt: string;
}

export const EQ_CLASSES = [
  "Bard",
  "Cleric",
  "Druid",
  "Enchanter",
  "Magician",
  "Monk",
  "Necromancer",
  "Paladin",
  "Ranger",
  "Rogue",
  "Shadow Knight",
  "Shaman",
  "Warrior",
  "Wizard",
] as const;

export const EQ_RACES = [
  "Barbarian",
  "Dark Elf",
  "Dwarf",
  "Erudite",
  "Gnome",
  "Half Elf",
  "Halfling",
  "High Elf",
  "Human",
  "Iksar",
  "Ogre",
  "Troll",
  "Wood Elf",
] as const;

export const EQ_SERVERS = ["P1999 Green", "P1999 Blue"] as const;

export const CLASS_ABBREV_TO_FULL: Record<string, string> = {
  ALL: "ALL", BRD: "Bard", CLR: "Cleric", DRU: "Druid",
  ENC: "Enchanter", MAG: "Magician", MNK: "Monk", NEC: "Necromancer",
  PAL: "Paladin", RNG: "Ranger", ROG: "Rogue", SHD: "Shadow Knight",
  SHM: "Shaman", WAR: "Warrior", WIZ: "Wizard",
};

export const FULL_CLASS_TO_ABBREV: Record<string, string> = Object.fromEntries(
  Object.entries(CLASS_ABBREV_TO_FULL).map(([k, v]) => [v, k])
);

export const RACE_ABBREV_TO_FULL: Record<string, string> = {
  ALL: "ALL", BAR: "Barbarian", DEF: "Dark Elf", DWF: "Dwarf",
  ELF: "Wood Elf", ERU: "Erudite", GNM: "Gnome", HEF: "Half Elf",
  HFL: "Halfling", HIE: "High Elf", HUM: "Human", IKS: "Iksar",
  OGR: "Ogre", TRL: "Troll",
};

export const FULL_RACE_TO_ABBREV: Record<string, string> = Object.fromEntries(
  Object.entries(RACE_ABBREV_TO_FULL).map(([k, v]) => [v, k])
);

export const WIKI_SLOT_TO_INTERNAL: Record<string, string[]> = {
  FINGERS: ["finger1", "finger2"], EAR: ["ear1", "ear2"],
  WRIST: ["wrist1", "wrist2"], HEAD: ["head"], FACE: ["face"],
  NECK: ["neck"], SHOULDERS: ["shoulders"], CHEST: ["chest"],
  ARMS: ["arms"], BACK: ["back"], HANDS: ["hands"],
  WAIST: ["waist"], LEGS: ["legs"], FEET: ["feet"],
  PRIMARY: ["primary"], SECONDARY: ["secondary"],
  RANGE: ["range"], AMMO: ["ammo"], CHARM: ["charm"],
};

export const INTERNAL_SLOT_TO_WIKI: Record<string, string> = Object.fromEntries(
  Object.entries(WIKI_SLOT_TO_INTERNAL).flatMap(([wiki, internals]) =>
    internals.map((i) => [i, wiki])
  )
);
