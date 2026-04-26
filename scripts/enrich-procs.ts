/**
 * Builds data/proc-spells.json by scraping P99 wiki spell pages for
 * combat proc effects found in item-database.json.
 *
 * For each unique combat proc spell name, fetches the spell's wiki page
 * and extracts damage from SpellSlotRow entries and lifetap status from
 * target_type.
 */

import type { ItemData } from "../src/lib/types";
import fs from "fs";
import path from "path";

const WIKI_BASE = "https://wiki.project1999.com";
const UA = "NaberialsScryingPool/1.0";
const BATCH_DELAY_MS = 200;
const FETCH_TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "item-database.json");
const OUTPUT_PATH = path.join(DATA_DIR, "proc-spells.json");

interface ProcSpellData {
  damage: number;
  isLifetap: boolean;
}

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

function parseSpellPage(wikitext: string): ProcSpellData {
  let damage = 0;

  const hitpointMatches = wikitext.matchAll(
    /Decrease Hitpoints? by (\d+)/gi
  );
  for (const m of hitpointMatches) {
    damage += parseInt(m[1], 10);
  }

  const hpCastMatches = wikitext.matchAll(
    /Decrease HP when cast by (\d+)/gi
  );
  for (const m of hpCastMatches) {
    damage += parseInt(m[1], 10);
  }

  const isLifetap = /target_type\s*=\s*Lifetap/i.test(wikitext);

  return { damage, isLifetap };
}

function getUniqueProcs(items: ItemData[]): string[] {
  const procs = new Set<string>();
  for (const item of items) {
    if (!item.stats?.effect || !item.stats.effectType) continue;
    if (!item.stats.effectType.toLowerCase().startsWith("combat")) continue;
    procs.add(item.stats.effect);
  }
  return [...procs].sort();
}

async function main() {
  console.log("===========================================");
  console.log("  Building proc-spells.json from wiki spell pages");
  console.log("===========================================\n");

  const items: ItemData[] = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  const procNames = getUniqueProcs(items);
  console.log(`  Found ${procNames.length} unique combat proc spells\n`);

  const result: Record<string, ProcSpellData> = {};
  let fetched = 0;
  let failed = 0;

  for (const name of procNames) {
    const pageTitle = name.replace(/ /g, "_");
    const url = `${WIKI_BASE}/index.php?title=${encodeURIComponent(pageTitle)}&action=raw`;
    const wikitext = await fetchWithRetry(url);

    if (!wikitext) {
      console.log(`  MISS: ${name} (page not found or fetch failed)`);
      result[name] = { damage: 0, isLifetap: false };
      failed++;
    } else {
      const data = parseSpellPage(wikitext);
      result[name] = data;
      const tag = data.isLifetap ? " (lifetap)" : "";
      console.log(`  ${name}: ${data.damage} damage${tag}`);
    }

    fetched++;
    if (fetched < procNames.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
  console.log(
    `\n  Done! Wrote ${Object.keys(result).length} spells to proc-spells.json` +
    (failed > 0 ? ` (${failed} failed lookups)` : "")
  );
}

main().catch(console.error);
