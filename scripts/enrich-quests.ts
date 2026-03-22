/**
 * Enriches item-database.json with relatedquests data by fetching
 * raw wikitext for each item and extracting the Itempage template's
 * relatedquests field.
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
const PROGRESS_PATH = path.join(DATA_DIR, "enrich-quests-progress.json");

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

function extractRelatedQuests(wikitext: string): string[] | null {
  const match = wikitext.match(/relatedquests\s*=\s*([\s\S]*?)(?:\n\||\n\}\})/);
  if (!match) return null;

  const raw = match[1].trim();
  if (!raw) return null;

  const quests: string[] = [];
  const linkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let m;
  while ((m = linkRegex.exec(raw)) !== null) {
    const display = (m[2] ?? m[1]).trim();
    if (display) quests.push(display);
  }

  return quests.length > 0 ? quests : null;
}

async function main() {
  console.log("===========================================");
  console.log("  Enriching item-database.json with quest data");
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
        const quests = extractRelatedQuests(wikitext);
        if (quests) {
          (item as any).relatedquests = quests;
          enriched++;
        } else if (!item.relatedquests) {
          (item as any).relatedquests = null;
        }
      }
      progressSet.add(item.name);
    }

    if (processed % 100 === 0 || i + CONCURRENCY >= toProcess.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const pct = ((processed / toProcess.length) * 100).toFixed(1);
      const rate = Math.max(0.1, processed / ((Date.now() - startTime) / 1000));
      const eta = ((toProcess.length - processed) / rate).toFixed(0);
      console.log(
        `  [${pct}%] ${processed}/${toProcess.length} | ${enriched} quests found | ${elapsed}s elapsed ~${eta}s left`
      );
    }

    if (processed % 500 === 0) {
      fs.writeFileSync(PROGRESS_PATH, JSON.stringify({ completed: [...progressSet] }));
      fs.writeFileSync(DB_PATH, JSON.stringify(items, null, 2));
    }

    if (i + CONCURRENCY < toProcess.length) await sleep(BATCH_DELAY_MS);
  }

  for (const item of items) {
    if (!("relatedquests" in item)) (item as any).relatedquests = null;
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(items, null, 2));
  try { fs.unlinkSync(PROGRESS_PATH); } catch { /* ok */ }

  console.log("\n===========================================");
  console.log("  Quest Enrichment Complete!");
  console.log("===========================================");
  console.log(`  Items processed:    ${processed}`);
  console.log(`  Quest sources found: ${enriched}`);
  console.log(`  Time elapsed:       ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
