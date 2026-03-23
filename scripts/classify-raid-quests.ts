/**
 * Classifies quests as raid or non-raid by fetching their wiki pages.
 *
 * Classification signals (in priority order):
 *  1. Quest name matches "<Class> Epic Quest" → raid
 *  2. Quest name contains a RAID_ZONE name → raid
 *  3. Quest name matches a RAID_NPC name → raid
 *  4. Wiki page structured fields: Start Zone, Related Zones, Related NPCs
 *  5. Wiki page contains [[link]] to a RAID_ZONE
 *  6. Stub/404 pages: parent page resolution (e.g. PoSky class tests)
 *  7. Coldain Ring #10 → raid (the actual Ring War; #1-9 are group content)
 *
 * Output: data/raid-quests.json (array of quest names classified as raid)
 */

import type { ItemData } from "../src/lib/types";
import fs from "fs";
import path from "path";

const WIKI_BASE = "https://p99wiki.eqgeeks.org";
const UA = "NaberialsScryingPool/1.0";
const CONCURRENCY = 8;
const BATCH_DELAY_MS = 150;
const FETCH_TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "item-database.json");
const OUTPUT_PATH = path.join(DATA_DIR, "raid-quests.json");
const PROGRESS_PATH = path.join(DATA_DIR, "classify-raid-progress.json");

// Zones where ALL content is raid-level. Mixed zones (Nagafen's Lair,
// Permafrost, Western Wastes, Dragon Necropolis, Icewell Keep) are excluded;
// raid mobs there are caught by RAID_NPCS instead.
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
]);

const EQ_CLASSES = [
  "Bard", "Cleric", "Druid", "Enchanter", "Magician", "Monk",
  "Necromancer", "Paladin", "Ranger", "Rogue", "Shadow Knight",
  "Shadowknight", "Shaman", "Warrior", "Wizard",
];

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(title: string): Promise<string | null> {
  const url = `${WIKI_BASE}/index.php?title=${encodeURIComponent(title.replace(/ /g, "_"))}&action=raw`;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (resp.status === 404) return null;
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.text();
    } catch {
      if (attempt === MAX_RETRIES) return null;
      await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }
  return null;
}

function extractRelatedZones(wikitext: string): string[] {
  const match = wikitext.match(/Related Zones.*?\n\|(.*)/);
  if (!match) return [];
  const raw = match[1];
  const zones: string[] = [];
  const re = /\[\[([^\]|]+)/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    zones.push(m[1].trim());
  }
  return zones;
}

function extractRelatedNpcs(wikitext: string): string[] {
  const match = wikitext.match(/Related NPCs[^\n]*\n\|(.*)/);
  if (!match) return [];
  const raw = match[1];
  const npcs: string[] = [];
  const re = /\[\[([^\]|]+)/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    npcs.push(m[1].trim());
  }
  return npcs;
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

function extractStartZone(wikitext: string): string | null {
  const match = wikitext.match(/Start Zone[^\n]*\n\|[^\S\n]*\[\[([^\]|]+)/);
  if (!match) return null;
  return match[1].trim();
}

function wikiLinksToRaidZone(wikitext: string): boolean {
  const re = /\[\[([^\]|]+)/g;
  let m;
  while ((m = re.exec(wikitext)) !== null) {
    if (RAID_ZONES.has(m[1].trim())) return true;
  }
  return false;
}

function classifyFromPage(wikitext: string): boolean {
  const startZone = extractStartZone(wikitext);
  if (startZone && RAID_ZONES.has(startZone)) return true;

  const relatedZones = extractRelatedZones(wikitext);
  for (const zone of relatedZones) {
    if (RAID_ZONES.has(zone)) return true;
  }

  const relatedNpcs = extractRelatedNpcs(wikitext);
  for (const npc of relatedNpcs) {
    if (normalizedRaidNpcs.has(normalizeMobName(npc))) return true;
  }

  if (wikiLinksToRaidZone(wikitext)) return true;

  return false;
}

function getParentPageName(questName: string): string | null {
  for (const cls of EQ_CLASSES) {
    if (questName.startsWith(`${cls} Test of `)) {
      return `${cls} Plane of Sky Tests`;
    }
  }
  if (questName.startsWith("Crusader's Test of ")) {
    return "Paladin Plane of Sky Tests";
  }
  const coldainMatch = questName.match(/^Coldain Ring #(\d+)/);
  if (coldainMatch) {
    const ring = parseInt(coldainMatch[1], 10);
    if (ring >= 10) return null; // Ring 10 is the actual Ring War raid
  }
  return null;
}

interface ProgressData {
  classified: Record<string, boolean>;
}

async function main() {
  console.log("===========================================");
  console.log("  Classifying quests as raid / non-raid");
  console.log("===========================================\n");

  const items: ItemData[] = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  const allQuests = new Set<string>();
  for (const item of items) {
    if (item.relatedquests) {
      for (const q of item.relatedquests) allQuests.add(q);
    }
  }
  console.log(`  Unique quest names: ${allQuests.size}\n`);

  let progress: ProgressData = { classified: {} };
  try {
    progress = JSON.parse(fs.readFileSync(PROGRESS_PATH, "utf-8"));
    console.log(`  Resuming: ${Object.keys(progress.classified).length} already done\n`);
  } catch { /* fresh start */ }

  const toProcess = [...allQuests].filter((q) => !(q in progress.classified));
  console.log(`  Need to fetch: ${toProcess.length} quest pages\n`);

  const parentPageCache = new Map<string, string | null>();
  const startTime = Date.now();
  let processed = 0;
  let raidCount = 0;

  for (let i = 0; i < toProcess.length; i += CONCURRENCY) {
    const batch = toProcess.slice(i, i + CONCURRENCY);

    const results = await Promise.all(
      batch.map(async (questName) => {
        const wikitext = await fetchPage(questName);
        return { questName, wikitext };
      })
    );

    for (const { questName, wikitext } of results) {
      processed++;
      let isRaid = false;

      if (/^.+ Epic Quest$/.test(questName)) {
        isRaid = true;
      } else if ([...RAID_ZONES].some((z) => questName.includes(z))) {
        isRaid = true;
      } else if (normalizedRaidNpcs.has(normalizeMobName(questName))) {
        isRaid = true;
      } else if (wikitext && wikitext.length > 100) {
        isRaid = classifyFromPage(wikitext);
      } else {
        const parentName = getParentPageName(questName);
        if (parentName) {
          if ([...RAID_ZONES].some((z) => parentName.includes(z))) {
            isRaid = true;
          } else {
            if (!parentPageCache.has(parentName)) {
              const parentText = await fetchPage(parentName);
              parentPageCache.set(parentName, parentText);
            }
            const parentText = parentPageCache.get(parentName);
            if (parentText && parentText.length > 100) {
              isRaid = classifyFromPage(parentText);
            }
          }
        }

        const coldainMatch = questName.match(/^Coldain Ring #(\d+)/);
        if (coldainMatch && parseInt(coldainMatch[1], 10) >= 10) {
          isRaid = true;
        }
      }

      progress.classified[questName] = isRaid;
      if (isRaid) raidCount++;
    }

    if (processed % 50 === 0 || i + CONCURRENCY >= toProcess.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const pct = ((processed / toProcess.length) * 100).toFixed(1);
      const rate = Math.max(0.1, processed / ((Date.now() - startTime) / 1000));
      const eta = ((toProcess.length - processed) / rate).toFixed(0);
      console.log(
        `  [${pct}%] ${processed}/${toProcess.length} | ${raidCount} raid quests | ${elapsed}s elapsed ~${eta}s left`
      );
    }

    if (processed % 200 === 0) {
      fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress));
    }

    if (i + CONCURRENCY < toProcess.length) await sleep(BATCH_DELAY_MS);
  }

  const raidQuests = Object.entries(progress.classified)
    .filter(([, isRaid]) => isRaid)
    .map(([name]) => name)
    .sort();

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(raidQuests, null, 2));
  try { fs.unlinkSync(PROGRESS_PATH); } catch { /* ok */ }

  const totalClassified = Object.keys(progress.classified).length;
  console.log("\n===========================================");
  console.log("  Classification Complete!");
  console.log("===========================================");
  console.log(`  Total quests classified: ${totalClassified}`);
  console.log(`  Raid quests:            ${raidQuests.length}`);
  console.log(`  Non-raid quests:        ${totalClassified - raidQuests.length}`);
  console.log(`  Output: ${OUTPUT_PATH}`);
  console.log(`  Time elapsed:           ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
