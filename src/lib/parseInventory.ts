import { EquippedItem } from "./types";
import { mapInventoryLocationToSlot } from "./slots";

interface RawInventoryRow {
  location: string;
  name: string;
  id: number;
  count: number;
  slots: number;
}

export function parseInventoryFile(
  text: string
): Record<string, EquippedItem | null> {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error("Inventory file appears empty or malformed");
  }

  const headerLine = lines[0];
  const separator = headerLine.includes("\t") ? "\t" : /\s{2,}/;

  const rows: RawInventoryRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(separator).map((s: string) => s.trim());
    if (parts.length < 3) continue;

    rows.push({
      location: parts[0],
      name: parts[1],
      id: parseInt(parts[2], 10) || 0,
      count: parseInt(parts[3], 10) || 1,
      slots: parseInt(parts[4], 10) || 0,
    });
  }

  const equipment: Record<string, EquippedItem | null> = {};

  const earCount: Record<string, number> = {};
  const wristCount: Record<string, number> = {};
  const fingerCount: Record<string, number> = {};

  for (const row of rows) {
    if (row.location.includes("-") || row.location.includes("Pack") ||
        row.location.includes("Bank") || row.location.includes("SharedBank") ||
        row.location.includes("Slot") || row.location.startsWith("General") ||
        row.location === "Held") {
      continue;
    }

    if (row.name === "Empty" && row.id === 0) continue;

    let slotId = mapInventoryLocationToSlot(row.location);
    if (!slotId) continue;

    if (slotId === "ear1") {
      earCount["ear"] = (earCount["ear"] || 0) + 1;
      if (earCount["ear"] > 1) slotId = "ear2";
    } else if (slotId === "wrist1") {
      wristCount["wrist"] = (wristCount["wrist"] || 0) + 1;
      if (wristCount["wrist"] > 1) slotId = "wrist2";
    } else if (slotId === "finger1") {
      fingerCount["finger"] = (fingerCount["finger"] || 0) + 1;
      if (fingerCount["finger"] > 1) slotId = "finger2";
    }

    equipment[slotId] = {
      name: row.name,
      itemId: row.id,
      slot: slotId,
    };
  }

  return equipment;
}
