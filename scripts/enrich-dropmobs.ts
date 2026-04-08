/**
 * Targeted enrichment: re-fetches wiki pages for items whose dropsfrom
 * is a zone known to have both group and raid content, extracts the
 * specific mob name(s), and tags items from raid mobs.
 *
 * Adds a `dropmobs` field (string[] | null) to each enriched item.
 */

import type { ItemData } from "../src/lib/types";
import fs from "fs";
import path from "path";

const WIKI_BASE = "https://wiki.project1999.com";
const UA = "NaberialsScryingPool/1.0";
const CONCURRENCY = 8;
const BATCH_DELAY_MS = 150;
const FETCH_TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "item-database.json");

// No zone filter -- enrich ALL items with dropsfrom to get mob names

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
    } catch {
      if (attempt === retries) return null;
      await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }
  return null;
}

function extractDropMobs(wikitext: string): string[] {
  const match = wikitext.match(/\|\s*dropsfrom\s*=([\s\S]*?)(?:\n\s*\||\}\})/);
  if (!match) return [];
  const block = match[1];
  const mobs: string[] = [];
  const re = /\*\s*\[\[([^\]|]+)/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    mobs.push(m[1].trim());
  }
  return mobs;
}

async function main() {
  console.log("===========================================");
  console.log("  Enriching items with drop mob names");
  console.log("===========================================\n");

  const items: (ItemData & { dropmobs?: string[] | null })[] = JSON.parse(
    fs.readFileSync(DB_PATH, "utf-8")
  );

  const toProcess = items.filter(
    (i) => i.dropsfrom && !i.dropmobs
  );
  console.log(`  Items from mixed zones: ${toProcess.length}\n`);

  const startTime = Date.now();
  let processed = 0;
  let enriched = 0;

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
        const mobs = extractDropMobs(wikitext);
        if (mobs.length > 0) {
          (item as any).dropmobs = mobs;
          enriched++;
        } else {
          (item as any).dropmobs = null;
        }
      }
    }

    if (processed % 50 === 0 || i + CONCURRENCY >= toProcess.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const pct = ((processed / toProcess.length) * 100).toFixed(1);
      console.log(
        `  [${pct}%] ${processed}/${toProcess.length} | ${enriched} mob names found | ${elapsed}s`
      );
    }

    if (i + CONCURRENCY < toProcess.length) await sleep(BATCH_DELAY_MS);
  }

  for (const item of items) {
    if (!("dropmobs" in item)) (item as any).dropmobs = null;
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(items, null, 2));

  console.log("\n===========================================");
  console.log("  Enrichment Complete!");
  console.log("===========================================");
  console.log(`  Items processed:     ${processed}`);
  console.log(`  Mob names extracted: ${enriched}`);
  console.log(`  Time elapsed:        ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
