import fs from "fs";
import path from "path";

const RAID_QUESTS_PATH = path.join(process.cwd(), "data", "raid-quests.json");

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
  relatedquests: string[] | null
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
    const allRaid = relatedquests.every((quest) => raidQuestSet!.has(quest));
    if (allRaid) return true;
  }

  return false;
}
