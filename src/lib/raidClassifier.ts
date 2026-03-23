import fs from "fs";
import path from "path";

const RAID_QUESTS_PATH = path.join(process.cwd(), "data", "raid-quests.json");

const RAID_ZONES = new Set([
  "Temple of Veeshan",
  "Plane of Hate",
  "Plane of Fear",
  "Plane of Sky",
  "Plane of Growth",
  "Plane of Mischief",
  "Veeshan's Peak",
  "Sleeper's Tomb",
  "Western Wastes",
  "Dragon Necropolis",
  "Icewell Keep",
  "Nagafen's Lair",
  "Permafrost",
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
]);

let raidQuestSet: Set<string> | null = null;

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

function normalizeZone(raw: string): string {
  return raw
    .replace(/^\[\[/, "")
    .replace(/<br\s*\/?>$/i, "")
    .replace(/^\*\s*/, "")
    .replace(/\}\}$/, "")
    .trim();
}

export function isRaidItem(
  dropsfrom: string | null,
  dropmobs: string[] | null,
  relatedquests: string[] | null
): boolean {
  if (dropsfrom) {
    const zone = normalizeZone(dropsfrom);
    if (RAID_ZONES.has(zone)) return true;
  }

  if (dropmobs) {
    for (const mob of dropmobs) {
      if (RAID_NPCS.has(mob)) return true;
    }
  }

  if (relatedquests) {
    ensureLoaded();
    for (const quest of relatedquests) {
      if (raidQuestSet!.has(quest)) return true;
    }
  }

  return false;
}
