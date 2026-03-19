import { ItemData } from "./types";
import { parseStatsBlock } from "./parseStatsBlock";
import path from "path";
import fs from "fs/promises";

const WIKI_BASE = "https://p99wiki.eqgeeks.org";
const ITEMS_CACHE_DIR = path.join(process.cwd(), "data", "items");
const FETCH_TIMEOUT_MS = 8000;

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 200);
}

async function getCachedItem(itemName: string): Promise<ItemData | null> {
  const filePath = path.join(ITEMS_CACHE_DIR, `${sanitizeFilename(itemName)}.json`);
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as ItemData;
  } catch {
    return null;
  }
}

async function cacheItem(itemName: string, data: ItemData): Promise<void> {
  await fs.mkdir(ITEMS_CACHE_DIR, { recursive: true });
  const filePath = path.join(ITEMS_CACHE_DIR, `${sanitizeFilename(itemName)}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

function extractFromWikitext(wikitext: string): {
  lucyImgId: number | null;
  statsBlock: string;
} {
  const imgMatch = wikitext.match(/lucy_img_ID\s*=\s*(\d+)/);
  const lucyImgId = imgMatch ? parseInt(imgMatch[1], 10) : null;

  const statsMatch =
    wikitext.match(/statsblock\s*=\s*([\s\S]*?)(?:\n\s*\||\n\s*\}\})/) ??
    wikitext.match(/statsblock\s*=\s*([\s\S]*)/);
  const statsBlock = statsMatch ? statsMatch[1].trim() : "";

  return { lucyImgId, statsBlock };
}

export async function fetchItemFromWiki(itemName: string): Promise<ItemData | null> {
  const cached = await getCachedItem(itemName);
  if (cached) return cached;

  try {
    const pageTitle = itemName.replace(/ /g, "_");
    const url = `${WIKI_BASE}/index.php?title=${encodeURIComponent(pageTitle)}&action=raw`;

    const response = await fetch(url, {
      headers: { "User-Agent": "NaberialsScryingPool/1.0" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) return null;

    const wikitext = await response.text();
    if (!wikitext) return null;

    const { lucyImgId, statsBlock } = extractFromWikitext(wikitext);

    const stats = statsBlock ? parseStatsBlock(statsBlock) : null;

    const itemData: ItemData = {
      name: itemName,
      lucyImgId,
      statsBlock,
      stats,
      wikiUrl: `${WIKI_BASE}/${pageTitle}`,
      fetchedAt: new Date().toISOString(),
    };

    await cacheItem(itemName, itemData);
    return itemData;
  } catch (error) {
    console.error(`Failed to fetch item "${itemName}" from wiki:`, error);
    return null;
  }
}

export async function fetchMultipleItems(
  itemNames: string[]
): Promise<Record<string, ItemData | null>> {
  const unique = [...new Set(itemNames)];
  const results: Record<string, ItemData | null> = {};

  const batchSize = 5;
  for (let i = 0; i < unique.length; i += batchSize) {
    const batch = unique.slice(i, i + batchSize);
    const promises = batch.map(async (name) => {
      results[name] = await fetchItemFromWiki(name);
    });
    await Promise.all(promises);

    if (i + batchSize < unique.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return results;
}
