/**
 * Enriches the existing item-database.json with dropsfrom data
 * by fetching the raw wikitext for each item and extracting the
 * Itempage template's dropsfrom field.
 *
 * Much faster than a full re-scrape since we skip enumeration.
 */

import { parseStatsBlock } from "../src/lib/parseStatsBlock";
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
const PROGRESS_PATH = path.join(DATA_DIR, "enrich-progress.json");

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

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
      if (attempt === retries) return null;
      await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }
  return null;
}

function extractDropsfrom(wikitext: string): string | null {
  const match = wikitext.match(/\|\s*dropsfrom\s*=\s*([^\n|]+)/);
  if (!match) return null;
  const val = match[1].trim().replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1");
  return val || null;
}

async function main() {
  console.log("===========================================");
  console.log("  Enriching item-database.json with dropsfrom + haste");
  console.log("===========================================\n");

  const items: ItemData[] = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  console.log(`  Loaded ${items.length} items\n`);

  let progressSet = new Set<string>();
  try {
    const p = JSON.parse(fs.readFileSync(PROGRESS_PATH, "utf-8"));
    progressSet = new Set(p.completed);
    console.log(`  Resuming: ${progressSet.size} already done\n`);
  } catch { /* fresh start */ }

  const toProcess = items.filter((i) => !progressSet.has(i.name));
  console.log(`  Need to fetch: ${toProcess.length} items\n`);

  const startTime = Date.now();
  let processed = 0;
  let enriched = 0;
  let hasteFixed = 0;

  for (let i = 0; i < toProcess.length; i += CONCURRENCY) {
    const batch = toProcess.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (item) => {
        const pageTitle = item.name.replace(/ /g, "_");
        const url = `${WIKI_BASE}/index.php?title=${encodeURIComponent(pageTitle)}&action=raw`;
        const wikitext = await fetchWithRetry(url);
        return { item, wikitext };
      })
    );

    for (const { item, wikitext } of results) {
      processed++;
      if (wikitext) {
        const df = extractDropsfrom(wikitext);
        if (df) {
          item.dropsfrom = df;
          enriched++;
        } else if (!item.dropsfrom) {
          item.dropsfrom = null;
        }
        // Re-parse stats to pick up haste
        if (item.statsBlock) {
          item.stats = parseStatsBlock(item.statsBlock);
        }
        if (item.stats?.haste) hasteFixed++;
      }
      progressSet.add(item.name);
    }

    if (processed % 100 === 0 || i + CONCURRENCY >= toProcess.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const pct = ((processed / toProcess.length) * 100).toFixed(1);
      const rate = Math.max(0.1, processed / ((Date.now() - startTime) / 1000));
      const eta = ((toProcess.length - processed) / rate).toFixed(0);
      console.log(
        `  [${pct}%] ${processed}/${toProcess.length} | ${enriched} drops found | ${hasteFixed} haste | ${elapsed}s elapsed ~${eta}s left`
      );
    }

    if (processed % 500 === 0) {
      fs.writeFileSync(PROGRESS_PATH, JSON.stringify({ completed: [...progressSet] }));
      fs.writeFileSync(DB_PATH, JSON.stringify(items, null, 2));
    }

    if (i + CONCURRENCY < toProcess.length) await sleep(BATCH_DELAY_MS);
  }

  // Also ensure all items that weren't re-fetched have the field
  for (const item of items) {
    if (!("dropsfrom" in item)) (item as any).dropsfrom = null;
    if (item.stats && !("haste" in item.stats)) (item.stats as any).haste = null;
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(items, null, 2));
  try { fs.unlinkSync(PROGRESS_PATH); } catch { /* ok */ }

  console.log("\n===========================================");
  console.log("  Enrichment Complete!");
  console.log("===========================================");
  console.log(`  Items processed:    ${processed}`);
  console.log(`  Drop sources found: ${enriched}`);
  console.log(`  Haste items found:  ${hasteFixed}`);
  console.log(`  Time elapsed:       ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
