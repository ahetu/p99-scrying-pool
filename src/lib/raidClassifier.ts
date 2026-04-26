import fs from "fs";
import path from "path";
import type { ItemData } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const RAID_QUESTS_PATH = path.join(DATA_DIR, "raid-quests.json");
const ITEM_DB_PATH = path.join(DATA_DIR, "item-database.json");

// Zones where ALL content is raid-level (entering requires a raid).
// Mixed zones (Nagafen's Lair, Permafrost, Western Wastes, Dragon
// Necropolis, Icewell Keep) are excluded — raid mobs there are caught
// by RAID_NPCS while group-content drops stay non-raid.
const RAID_ZONES = new Set([
  "Temple of Veeshan",
  "Plane of Hate",
  "Plane of Fear",
  "Plane of Sky",
  "Plane of Growth",
  "Plane of Mischief",
  "Veeshan's Peak",
  "Sleeper's Tomb",
  "Kerafyrm's Lair",
]);

const RAID_NPCS = new Set([
  "Lodizal", "Severilous", "Talendor", "Faydedar", "Gorenaire",
  "Trakanon", "Venril Sathir", "Lord Doljonijiarnimorinar",
  "King Tormax", "Statue of Rallos Zek", "Yelinak", "Lord Yelinak",
  "Cazic Thule", "Innoruuk", "Thought Destroyer",
  "Phinigel Autropos", "The Ishva Mal", "Drusella Sathir",
  "Overking Bathezid", "Dozekar the Cursed", "Lord Kreizenn",
  "Klandicar", "Zlandicar", "Sontalak", "Druushk",
  "Lord Nagafen", "Lady Vox",
  "Kelorek`Dar", "Silverwing", "Xygoz",
  "Velketor the Sorcerer", "Dain Frostreaver IV",
  "The Final Arbiter", "Master Yael",
  "Nortlav the Scalekeeper", "Dagarn the Destroyer",
  "Derakor the Vindicator", "The Avatar of War",
  "Tunare", "Bristlebane", "Rallos Zek",
  "Garzicor",
  // Open-world raid dragons/NPCs in mixed zones
  "Wuoshi", "Eashen of the Sky",
  "Harla Dar", "Cekenar", "Aaryonar", "Jorlleag",
  "Ikatiar the Venom",
  "Tukaarak the Warder",
  "Zordakalicus Ragefire", "Ixiblat Fer",
  // Chardok royals (mixed zone)
  "Prince Selrach Di'zok",
  "Queen Velazul Di'zok", "Queen Velazul Di`zok",
  // Dragon Necropolis raid targets (mixed zone)
  "Vaniki", "Yeldema",
  // Ring War final boss (Great Divide)
  "Narandi the Wretched",
]);

let raidQuestSet: Set<string> | null = null;
let raidStatsSet: Set<string> | null = null;

function ensureLoaded(): void {
  if (raidQuestSet) return;
  try {
    const raw = fs.readFileSync(RAID_QUESTS_PATH, "utf-8");
    const quests: string[] = JSON.parse(raw);
    raidQuestSet = new Set(quests);
  } catch {
    raidQuestSet = new Set();
  }
}

function hasMeaningfulStats(item: ItemData): boolean {
  const s = item.stats;
  if (!s) return false;
  return !!(s.ac || s.hp || s.mana || s.str || s.sta || s.dex || s.agi || s.wis ||
    s.int || s.cha || s.svFire || s.svCold || s.svDisease || s.svMagic || s.svPoison ||
    s.haste || s.damage);
}

function ensureTwinIndex(): void {
  if (raidStatsSet) return;
  raidStatsSet = new Set();
  try {
    const items: ItemData[] = JSON.parse(fs.readFileSync(ITEM_DB_PATH, "utf-8"));
    for (const item of items) {
      if (!hasMeaningfulStats(item)) continue;
      if (isRaidItem(item.dropsfrom, item.dropmobs ?? null, item.relatedquests ?? null)) {
        raidStatsSet.add(item.statsBlock);
      }
    }
  } catch {
    // leave empty on failure
  }
}

function normalizeZone(raw: string): string {
  return raw
    .replace(/^\[\[/, "")
    .replace(/\]\]$/, "")
    .replace(/<br\s*\/?>$/i, "")
    .replace(/^\*\s*/, "")
    .replace(/\}\}$/, "")
    .trim();
}

function normalizeMobName(name: string): string {
  return name
    .replace(/^(the|a|an)\s+/i, "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim();
}

const normalizedRaidNpcs = new Set(
  [...RAID_NPCS].map(normalizeMobName)
);

export function isRaidItem(
  dropsfrom: string | null,
  dropmobs: string[] | null,
  relatedquests: string[] | null,
  statsBlock?: string | null,
): boolean {
  if (dropsfrom) {
    const zone = normalizeZone(dropsfrom);
    if (RAID_ZONES.has(zone)) return true;
  }

  if (dropmobs) {
    for (const mob of dropmobs) {
      if (normalizedRaidNpcs.has(normalizeMobName(mob))) return true;
    }
  }

  if (relatedquests && relatedquests.length > 0) {
    ensureLoaded();
    const quests = relatedquests.filter(q => !q.startsWith("File:"));
    if (quests.length > 0 && quests.every((quest) => raidQuestSet!.has(quest))) return true;

    for (const entry of quests) {
      if (normalizedRaidNpcs.has(normalizeMobName(entry))) return true;
    }
  }

  const hasKnownSource = dropsfrom || (dropmobs && dropmobs.length > 0);
  if (statsBlock && !hasKnownSource) {
    ensureTwinIndex();
    if (raidStatsSet!.has(statsBlock)) return true;
  }

  return false;
}
