/**
 * Enriches item-database.json with soldby/crafted booleans by checking
 * wiki page wikitext for non-empty |soldby= and |playercrafted= fields
 * (or [[Category:Player Crafted]]).
 *
 * Only fetches items that currently have no source (dropsfrom, dropmobs,
 * relatedquests all empty) AND don't already have soldby/crafted set.
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
const PROGRESS_PATH = path.join(DATA_DIR, "enrich-sources-progress.json");

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

function hasNonEmptyField(wikitext: string, field: string): boolean {
  const re = new RegExp(`\\|\\s*${field}\\s*=\\s*([\\s\\S]*?)(?:\\n\\s*\\||\\n?\\}\\})`, "i");
  const match = wikitext.match(re);
  if (!match) return false;
  const content = match[1].trim();
  return content.length > 0 && !content.match(/^this item/i);
}

function hasPlayerCraftedCategory(wikitext: string): boolean {
  return /\[\[Category:Player Crafted\]\]/i.test(wikitext);
}

function itemNeedsEnrichment(item: ItemData): boolean {
  if (item.soldby || item.crafted) return false;
  return true;
}

function pageNameFromUrl(url: string): string {
  return url.replace(WIKI_BASE + "/", "");
}

async function main() {
  console.log("===========================================");
  console.log("  Enriching item-database.json with soldby/crafted data");
  console.log("===========================================\n");

  const items: (ItemData & { soldby?: boolean; crafted?: boolean })[] =
    JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  console.log(`  Loaded ${items.length} items\n`);

  // Default missing fields
  for (const item of items) {
    if (item.soldby === undefined) item.soldby = false;
    if (item.crafted === undefined) item.crafted = false;
  }

  let progressSet = new Set<string>();
  try {
    const p = JSON.parse(fs.readFileSync(PROGRESS_PATH, "utf-8"));
    progressSet = new Set(p.completed);
    console.log(`  Resuming: ${progressSet.size} already done\n`);
  } catch { /* fresh start */ }

  const toProcess = items.filter(
    (i) => !progressSet.has(i.name) && itemNeedsEnrichment(i)
  );
  console.log(`  Need to fetch: ${toProcess.length} items\n`);

  let processed = 0;
  let enriched = 0;

  for (let i = 0; i < toProcess.length; i += CONCURRENCY) {
    const batch = toProcess.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (item) => {
        const pageName = pageNameFromUrl(item.wikiUrl);
        const url = `${WIKI_BASE}/index.php?title=${encodeURIComponent(pageName)}&action=raw`;
        const wikitext = await fetchWithRetry(url);
        if (!wikitext) return { item, soldby: false, crafted: false };

        const soldby = hasNonEmptyField(wikitext, "soldby");
        const crafted =
          hasNonEmptyField(wikitext, "playercrafted") ||
          hasPlayerCraftedCategory(wikitext);

        return { item, soldby, crafted };
      })
    );

    for (const { item, soldby, crafted } of results) {
      item.soldby = soldby;
      item.crafted = crafted;
      if (soldby || crafted) enriched++;
      progressSet.add(item.name);
    }

    processed += batch.length;

    if (processed % 100 === 0 || processed === toProcess.length) {
      console.log(
        `  ${processed}/${toProcess.length} fetched, ${enriched} enriched so far`
      );
      fs.writeFileSync(DB_PATH, JSON.stringify(items, null, 2));
      fs.writeFileSync(
        PROGRESS_PATH,
        JSON.stringify({ completed: [...progressSet] })
      );
    }

    if (i + CONCURRENCY < toProcess.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  // Final save
  fs.writeFileSync(DB_PATH, JSON.stringify(items, null, 2));
  console.log(`\n  Done! ${enriched} items enriched with soldby/crafted data.`);

  // Clean up progress file
  try { fs.unlinkSync(PROGRESS_PATH); } catch { /* ok */ }
}

main().catch(console.error);
