/**
 * Scrapes all equippable items from the P99 wiki into a local database.
 *
 * Strategy:
 *   1. Enumerate item titles from slot/weapon wiki categories (with pagination)
 *   2. Deduplicate across categories
 *   3. Fetch each item's raw wikitext via action=raw
 *   4. Parse with the same extractFromWikitext + parseStatsBlock used by the app
 *   5. Filter to items with valid equipment slots
 *   6. Write to data/item-database.json
 *
 * Usage:
 *   npm run scrape           # resume from where we left off
 *   npm run scrape -- --fresh  # full re-scrape from scratch
 */

import { parseStatsBlock } from "../src/lib/parseStatsBlock";
import type { ItemData, ParsedStats } from "../src/lib/types";
import fs from "fs";
import path from "path";

const WIKI_BASE = "https://p99wiki.eqgeeks.org";
const UA = "NaberialsScryingPool/1.0";
const CONCURRENCY = 5;
const BATCH_DELAY_MS = 200;
const FETCH_TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "item-database.json");
const PROGRESS_PATH = path.join(DATA_DIR, "scrape-progress.json");
const ERRORS_PATH = path.join(DATA_DIR, "scrape-errors.json");
const STATS_PATH = path.join(DATA_DIR, "scrape-stats.json");

const EQUIPMENT_CATEGORIES = [
  "Arms", "Back", "Chest", "Ear", "Face", "Feet", "Fingers",
  "Hands", "Head", "Legs", "Neck", "Shoulders", "Waist", "Wrist",
];

const WEAPON_CATEGORIES = [
  "1H_Blunt", "2H_Blunt", "1H_Slashing", "2H_Slashing",
  "Piercing", "2H_Piercing", "Archery", "Throwing",
  "Bard_Instrument", "Hand_to_Hand",
];

const OTHER_CATEGORIES = ["Primary", "Secondary", "Range", "Ammo"];

const ALL_CATEGORIES = [
  ...EQUIPMENT_CATEGORIES,
  ...WEAPON_CATEGORIES,
  ...OTHER_CATEGORIES,
];

// --- HTTP helpers ---

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<string | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!resp.ok) {
        if (resp.status === 404) return null;
        throw new Error(`HTTP ${resp.status}`);
      }
      return await resp.text();
    } catch (err) {
      if (attempt === retries) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  FAIL (${retries} attempts): ${url} — ${msg}`);
        return null;
      }
      const delay = 1000 * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Category scraping ---

function extractItemTitles(html: string): string[] {
  const titles: string[] = [];
  const regex = /<li><a href="\/[^"]*" title="([^"]*)">[^<]+<\/a><\/li>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const title = match[1]
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    if (!title.startsWith("Category:")) {
      titles.push(title);
    }
  }
  return titles;
}

function extractNextPageUrl(html: string): string | null {
  const match = html.match(/<a href="([^"]*)"[^>]*>next page<\/a>/);
  if (!match) return null;
  return match[1].replace(/&amp;/g, "&");
}

async function getAllCategoryMembers(categoryName: string): Promise<string[]> {
  const allTitles: string[] = [];
  let url: string | null = `${WIKI_BASE}/Category:${categoryName}`;

  while (url) {
    const html = await fetchWithRetry(url);
    if (!html) break;

    const titles = extractItemTitles(html);
    allTitles.push(...titles);

    const nextPath = extractNextPageUrl(html);
    if (nextPath) {
      url = `${WIKI_BASE}${nextPath}`;
      await sleep(150);
    } else {
      url = null;
    }
  }

  return allTitles;
}

// --- Wikitext parsing (same logic as wikiItemLookup.ts) ---

function extractFromWikitext(wikitext: string): {
  lucyImgId: number | null;
  statsBlock: string;
  dropsfrom: string | null;
} {
  const imgMatch = wikitext.match(/lucy_img_ID\s*=\s*(\d+)/);
  const lucyImgId = imgMatch ? parseInt(imgMatch[1], 10) : null;

  const statsMatch =
    wikitext.match(/statsblock\s*=\s*([\s\S]*?)(?:\n\s*\||\n\s*\}\})/) ??
    wikitext.match(/statsblock\s*=\s*([\s\S]*)/);
  const statsBlock = statsMatch ? statsMatch[1].trim() : "";

  const dropsMatch = wikitext.match(/\|\s*dropsfrom\s*=\s*([^\n|]+)/);
  let dropsfrom: string | null = null;
  if (dropsMatch) {
    dropsfrom = dropsMatch[1].trim().replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1");
    if (!dropsfrom) dropsfrom = null;
  }

  return { lucyImgId, statsBlock, dropsfrom };
}

function isRedirect(wikitext: string): string | null {
  const match = wikitext.match(/^#REDIRECT\s*\[\[([^\]]+)\]\]/i);
  return match ? match[1].trim() : null;
}

// --- Progress tracking ---

interface ScrapeProgress {
  completedItems: string[];
  startedAt: string;
}

function loadProgress(): ScrapeProgress {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, "utf-8"));
  } catch {
    return { completedItems: [], startedAt: new Date().toISOString() };
  }
}

function saveProgress(progress: ScrapeProgress): void {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress));
}

// --- Post-processing / normalization ---

const VALID_SLOTS = new Set([
  "PRIMARY", "SECONDARY", "HEAD", "FACE", "EAR", "NECK",
  "SHOULDERS", "CHEST", "ARMS", "BACK", "WRIST", "WAIST",
  "HANDS", "LEGS", "FEET", "FINGERS", "RANGE", "AMMO", "CHARM",
]);

const SLOT_FIXES: Record<string, string> = {
  SECONDAY: "SECONDARY",
  FINGER: "FINGERS",
  SHOULDER: "SHOULDERS",
};

const CLASS_FIXES: Record<string, string> = { MKN: "MNK" };

const ALL_CLASS_ABBREVS = [
  "BRD", "CLR", "DRU", "ENC", "MAG", "MNK",
  "NEC", "PAL", "RNG", "ROG", "SHD", "SHM", "WAR", "WIZ",
];

const ALL_RACE_ABBREVS = [
  "BAR", "DEF", "DWF", "ELF", "ERU", "GNM",
  "HEF", "HFL", "HIE", "HUM", "IKS", "OGR", "TRL",
];

function normalizeSlots(slots: string[]): string[] {
  return slots
    .map((s) => {
      const upper = s.toUpperCase();
      return SLOT_FIXES[upper] ?? upper;
    })
    .filter((s) => VALID_SLOTS.has(s));
}

function parseExceptList(raw: string[], allValues: string[]): string[] {
  const upper = raw.map((s) => {
    const u = s.toUpperCase();
    return CLASS_FIXES[u] ?? u;
  });
  const exceptIdx = upper.indexOf("EXCEPT");
  if (exceptIdx === -1) {
    if (upper.includes("ALL")) return ["ALL"];
    return upper.filter((s) => s !== "NONE" && s.length <= 3);
  }
  const exclusions = new Set(upper.slice(exceptIdx + 1));
  if (upper.includes("ALL")) {
    return allValues.filter((v) => !exclusions.has(v));
  }
  return upper.slice(0, exceptIdx).filter((s) => s !== "NONE" && !exclusions.has(s));
}

function extractHaste(statsBlock: string): number | null {
  const match = statsBlock.match(/Haste:\s*\+?(\d+)%/i);
  return match ? parseInt(match[1], 10) : null;
}

function normalizeItem(item: ItemData): ItemData | null {
  if (!item.stats) return null;
  const normalizedSlots = normalizeSlots(item.stats.slots);
  if (normalizedSlots.length === 0) return null;

  return {
    ...item,
    stats: {
      ...item.stats,
      slots: normalizedSlots,
      classes: parseExceptList(item.stats.classes, ALL_CLASS_ABBREVS),
      races: parseExceptList(item.stats.races, ALL_RACE_ABBREVS),
    },
  };
}

// --- Main scraper ---

async function enumerateAllItems(): Promise<string[]> {
  const allNames = new Set<string>();

  console.log(`\nPhase 1: Enumerating items from ${ALL_CATEGORIES.length} categories...\n`);

  for (const cat of ALL_CATEGORIES) {
    const members = await getAllCategoryMembers(cat);
    const before = allNames.size;
    for (const m of members) allNames.add(m);
    const newCount = allNames.size - before;
    console.log(
      `  Category:${cat.padEnd(16)} => ${members.length.toString().padStart(4)} items (${newCount} new, ${allNames.size} total unique)`
    );
    await sleep(100);
  }

  console.log(`\nTotal unique item titles: ${allNames.size}`);
  return [...allNames].sort();
}

async function fetchAndParseItem(itemName: string): Promise<ItemData | null> {
  const pageTitle = itemName.replace(/ /g, "_");
  const url = `${WIKI_BASE}/index.php?title=${encodeURIComponent(pageTitle)}&action=raw`;

  const wikitext = await fetchWithRetry(url);
  if (!wikitext) return null;

  // Handle redirects (one level deep)
  const redirectTarget = isRedirect(wikitext);
  if (redirectTarget) {
    const redirectTitle = redirectTarget.replace(/ /g, "_");
    const redirectUrl = `${WIKI_BASE}/index.php?title=${encodeURIComponent(redirectTitle)}&action=raw`;
    const redirectText = await fetchWithRetry(redirectUrl);
    if (!redirectText || isRedirect(redirectText)) return null;

    const { lucyImgId, statsBlock, dropsfrom } = extractFromWikitext(redirectText);
    if (!statsBlock) return null;

    const stats = parseStatsBlock(statsBlock);
    if (!stats.slots.length) return null;

    return {
      name: redirectTarget,
      lucyImgId,
      statsBlock,
      dropsfrom,
      stats,
      wikiUrl: `${WIKI_BASE}/${redirectTitle}`,
      fetchedAt: new Date().toISOString(),
    };
  }

  const { lucyImgId, statsBlock, dropsfrom } = extractFromWikitext(wikitext);
  if (!statsBlock) return null;

  const stats = parseStatsBlock(statsBlock);
  if (!stats.slots.length) return null;

  return {
    name: itemName,
    lucyImgId,
    statsBlock,
    dropsfrom,
    stats,
    wikiUrl: `${WIKI_BASE}/${pageTitle}`,
    fetchedAt: new Date().toISOString(),
  };
}

async function main() {
  const isFresh = process.argv.includes("--fresh");

  console.log("===========================================");
  console.log("  P99 Wiki Item Scraper");
  console.log("===========================================");
  console.log(`Mode: ${isFresh ? "FRESH (full re-scrape)" : "RESUME (skip completed)"}`);

  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (isFresh) {
    try { fs.unlinkSync(PROGRESS_PATH); } catch { /* ok */ }
    try { fs.unlinkSync(ERRORS_PATH); } catch { /* ok */ }
  }

  // Phase 1: Enumerate
  const allItemNames = await enumerateAllItems();

  // Phase 2: Fetch and parse
  const progress = isFresh
    ? { completedItems: [], startedAt: new Date().toISOString() }
    : loadProgress();
  const completedSet = new Set(progress.completedItems);
  const toFetch = allItemNames.filter((name) => !completedSet.has(name));

  console.log(`\nPhase 2: Fetching ${toFetch.length} items (${completedSet.size} already done)...\n`);

  const items: ItemData[] = [];
  const errors: Array<{ name: string; error: string }> = [];

  // Load previously completed items from DB if resuming
  if (!isFresh && fs.existsSync(DB_PATH)) {
    try {
      const existing: ItemData[] = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      items.push(...existing);
      console.log(`  Loaded ${existing.length} previously scraped items from database`);
    } catch { /* start fresh if DB is corrupt */ }
  }

  const startTime = Date.now();
  let fetched = 0;
  let found = 0;

  for (let i = 0; i < toFetch.length; i += CONCURRENCY) {
    const batch = toFetch.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (name) => {
        try {
          return { name, data: await fetchAndParseItem(name) };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return { name, data: null, error: msg };
        }
      })
    );

    for (const result of results) {
      fetched++;
      if (result.data) {
        // Deduplicate by name (redirects might resolve to same item)
        const existingIdx = items.findIndex(
          (it) => it.name === result.data!.name
        );
        if (existingIdx === -1) {
          items.push(result.data);
          found++;
        }
      } else if ("error" in result && result.error) {
        errors.push({ name: result.name, error: result.error! });
      }
      completedSet.add(result.name);
    }

    // Progress report
    if (fetched % 50 === 0 || i + CONCURRENCY >= toFetch.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const pct = ((fetched / toFetch.length) * 100).toFixed(1);
      const rate = (fetched / ((Date.now() - startTime) / 1000)).toFixed(1);
      const eta = (((toFetch.length - fetched) / parseFloat(rate))).toFixed(0);
      console.log(
        `  [${pct}%] ${fetched}/${toFetch.length} fetched, ${found} items found, ${errors.length} errors (${elapsed}s elapsed, ~${eta}s remaining, ${rate}/s)`
      );
    }

    // Save progress periodically
    if (fetched % 200 === 0) {
      progress.completedItems = [...completedSet];
      saveProgress(progress);
      fs.writeFileSync(DB_PATH, JSON.stringify(items, null, 2));
    }

    if (i + CONCURRENCY < toFetch.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  // Normalize and deduplicate
  console.log("\nPhase 3: Normalizing data...\n");
  const normalized: ItemData[] = [];
  let removedCount = 0;
  for (const item of items) {
    const result = normalizeItem(item);
    if (result) normalized.push(result);
    else removedCount++;
  }

  const seen = new Map<string, ItemData>();
  for (const item of normalized) {
    const key = item.name.toLowerCase();
    if (!seen.has(key)) seen.set(key, item);
  }
  const final = [...seen.values()];
  const dupeCount = normalized.length - final.length;
  console.log(`  Removed ${removedCount} items with no valid slots, ${dupeCount} duplicates`);

  // Final save
  progress.completedItems = [...completedSet];
  saveProgress(progress);
  fs.writeFileSync(DB_PATH, JSON.stringify(final, null, 2));

  if (errors.length > 0) {
    fs.writeFileSync(ERRORS_PATH, JSON.stringify(errors, null, 2));
  }

  // Compute stats
  const slotCounts: Record<string, number> = {};
  for (const item of final) {
    if (!item.stats) continue;
    for (const slot of item.stats.slots) {
      slotCounts[slot] = (slotCounts[slot] || 0) + 1;
    }
  }

  const classCounts: Record<string, number> = {};
  for (const item of final) {
    if (!item.stats) continue;
    for (const cls of item.stats.classes) {
      classCounts[cls] = (classCounts[cls] || 0) + 1;
    }
  }

  const stats = {
    totalPagesScanned: allItemNames.length,
    equippableItemsFound: final.length,
    fetchErrors: errors.length,
    itemsPerSlot: Object.fromEntries(
      Object.entries(slotCounts).sort(([, a], [, b]) => b - a)
    ),
    itemsPerClass: Object.fromEntries(
      Object.entries(classCounts).sort(([, a], [, b]) => b - a)
    ),
    scrapedAt: new Date().toISOString(),
    elapsedSeconds: Math.round((Date.now() - startTime) / 1000),
  };

  fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2));

  const dbSizeMB = (fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(1);

  console.log("\n===========================================");
  console.log("  Scrape Complete!");
  console.log("===========================================");
  console.log(`  Pages scanned:      ${stats.totalPagesScanned}`);
  console.log(`  Equippable items:   ${stats.equippableItemsFound}`);
  console.log(`  Fetch errors:       ${stats.fetchErrors}`);
  console.log(`  Database size:      ${dbSizeMB} MB`);
  console.log(`  Time elapsed:       ${stats.elapsedSeconds}s`);
  console.log("\n  Items per slot:");
  for (const [slot, count] of Object.entries(stats.itemsPerSlot)) {
    console.log(`    ${slot.padEnd(12)} ${count}`);
  }
  console.log("\n  Top class restrictions:");
  for (const [cls, count] of Object.entries(stats.itemsPerClass).slice(0, 10)) {
    console.log(`    ${cls.padEnd(6)} ${count}`);
  }
  console.log(`\n  Output: ${DB_PATH}`);
  if (errors.length > 0) {
    console.log(`  Errors: ${ERRORS_PATH}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
