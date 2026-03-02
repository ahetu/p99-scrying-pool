import { ItemData } from "./types";
import { parseStatsBlock } from "./parseStatsBlock";
import path from "path";
import fs from "fs/promises";

const WIKI_API = "https://wiki.project1999.com/api.php";
const ITEMS_CACHE_DIR = path.join(process.cwd(), "data", "items");

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

  const statsMatch = wikitext.match(/statsblock\s*=\s*([\s\S]*?)(?:\n\s*\||\n\s*\}\})/);
  const statsBlock = statsMatch ? statsMatch[1].trim() : "";

  return { lucyImgId, statsBlock };
}

export async function fetchItemFromWiki(itemName: string): Promise<ItemData | null> {
  const cached = await getCachedItem(itemName);
  if (cached) return cached;

  try {
    const pageTitle = itemName.replace(/ /g, "_");
    const url = `${WIKI_API}?action=parse&page=${encodeURIComponent(pageTitle)}&format=json&prop=wikitext`;

    const response = await fetch(url, {
      headers: { "User-Agent": "NaberialsScryingPool/1.0" },
    });

    if (!response.ok) return null;

    const json = await response.json();
    if (!json.parse?.wikitext?.["*"]) return null;

    const wikitext: string = json.parse.wikitext["*"];
    const { lucyImgId, statsBlock } = extractFromWikitext(wikitext);

    if (!statsBlock) return null;

    const stats = parseStatsBlock(statsBlock);

    const itemData: ItemData = {
      name: itemName,
      lucyImgId,
      statsBlock,
      stats,
      wikiUrl: `https://wiki.project1999.com/${pageTitle}`,
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

  const batchSize = 3;
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
