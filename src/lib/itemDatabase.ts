import { ItemData, INTERNAL_SLOT_TO_WIKI, FULL_CLASS_TO_ABBREV, FULL_RACE_TO_ABBREV } from "./types";
import { fetchItemFromWiki } from "./wikiItemLookup";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "item-database.json");

const SLOT_NORMALIZE: Record<string, string> = {
  FINGER: "FINGERS",
  SECONDAY: "SECONDARY",
};

let nameIndex: Map<string, ItemData> | null = null;
let slotIndex: Map<string, ItemData[]> | null = null;
let dbAvailable = false;

function ensureLoaded(): void {
  if (nameIndex) return;

  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const items: ItemData[] = JSON.parse(raw);

    nameIndex = new Map();
    slotIndex = new Map();

    for (const item of items) {
      nameIndex.set(item.name.toLowerCase(), item);
      if (!item.stats) continue;
      for (const slot of item.stats.slots) {
        const upper = SLOT_NORMALIZE[slot.toUpperCase()] ?? slot.toUpperCase();
        if (!slotIndex.has(upper)) slotIndex.set(upper, []);
        slotIndex.get(upper)!.push(item);
      }
    }

    dbAvailable = true;
  } catch {
    nameIndex = new Map();
    slotIndex = new Map();
    dbAvailable = false;
  }
}

export function getItemByName(name: string): ItemData | null {
  ensureLoaded();
  return nameIndex!.get(name.toLowerCase()) ?? null;
}

export async function getItemByNameWithFallback(name: string): Promise<ItemData | null> {
  const dbItem = getItemByName(name);
  if (dbItem) return dbItem;
  return fetchItemFromWiki(name);
}

export function getItemsForSlot(wikiSlot: string): ItemData[] {
  ensureLoaded();
  return slotIndex!.get(wikiSlot.toUpperCase()) ?? [];
}

export function getItemsForInternalSlot(internalSlot: string): ItemData[] {
  const wikiSlot = INTERNAL_SLOT_TO_WIKI[internalSlot];
  if (!wikiSlot) return [];
  return getItemsForSlot(wikiSlot);
}

export function getFilteredItemsForSlot(
  internalSlot: string,
  className: string,
  race: string
): ItemData[] {
  const classAbbrev = FULL_CLASS_TO_ABBREV[className] ?? className.toUpperCase().slice(0, 3);
  const raceAbbrev = FULL_RACE_TO_ABBREV[race] ?? race.toUpperCase().slice(0, 3);

  return getItemsForInternalSlot(internalSlot).filter((item) => {
    if (!item.stats) return false;

    const { classes, races } = item.stats;

    const classOk =
      classes.length === 0 ||
      classes.includes("ALL") ||
      classes.includes(classAbbrev);

    const raceOk =
      races.length === 0 ||
      races.includes("ALL") ||
      races.includes(raceAbbrev);

    return classOk && raceOk;
  });
}

export function isDatabaseLoaded(): boolean {
  ensureLoaded();
  return dbAvailable;
}

export function getDatabaseSize(): number {
  ensureLoaded();
  return nameIndex!.size;
}
