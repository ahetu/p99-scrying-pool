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
  stats: ParsedStats;
  wikiUrl: string;
  fetchedAt: string;
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
