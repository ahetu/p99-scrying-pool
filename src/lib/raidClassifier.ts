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
  relatedquests: string[] | null
): boolean {
  if (dropsfrom) {
    const zone = normalizeZone(dropsfrom);
    if (RAID_ZONES.has(zone)) return true;
  }

  if (relatedquests) {
    ensureLoaded();
    for (const quest of relatedquests) {
      if (raidQuestSet!.has(quest)) return true;
    }
  }

  return false;
}
