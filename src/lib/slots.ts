export interface SlotDefinition {
  id: string;
  label: string;
  inventoryKey: string;
  column: "left" | "right" | "bottom";
  order: number;
}

export const EQUIPMENT_SLOTS: SlotDefinition[] = [
  // Left column (9) — paired items split across sides
  { id: "ear1", label: "Ear", inventoryKey: "Ear", column: "left", order: 0 },
  { id: "head", label: "Head", inventoryKey: "Head", column: "left", order: 1 },
  { id: "neck", label: "Neck", inventoryKey: "Neck", column: "left", order: 2 },
  { id: "shoulders", label: "Shoulders", inventoryKey: "Shoulders", column: "left", order: 3 },
  { id: "chest", label: "Chest", inventoryKey: "Chest", column: "left", order: 4 },
  { id: "arms", label: "Arms", inventoryKey: "Arms", column: "left", order: 5 },
  { id: "wrist1", label: "Wrist", inventoryKey: "Wrist1", column: "left", order: 6 },
  { id: "legs", label: "Legs", inventoryKey: "Legs", column: "left", order: 7 },
  { id: "finger1", label: "Finger", inventoryKey: "Finger1", column: "left", order: 8 },

  // Right column (9) — mirrors left
  { id: "ear2", label: "Ear", inventoryKey: "Ear2", column: "right", order: 0 },
  { id: "face", label: "Face", inventoryKey: "Face", column: "right", order: 1 },
  { id: "charm", label: "Charm", inventoryKey: "Charm", column: "right", order: 2 },
  { id: "back", label: "Back", inventoryKey: "Back", column: "right", order: 3 },
  { id: "waist", label: "Waist", inventoryKey: "Waist", column: "right", order: 4 },
  { id: "hands", label: "Hands", inventoryKey: "Hands", column: "right", order: 5 },
  { id: "wrist2", label: "Wrist", inventoryKey: "Wrist2", column: "right", order: 6 },
  { id: "feet", label: "Feet", inventoryKey: "Feet", column: "right", order: 7 },
  { id: "finger2", label: "Finger", inventoryKey: "Finger2", column: "right", order: 8 },

  // Bottom row — weapons & ammo
  { id: "primary", label: "Primary", inventoryKey: "Primary", column: "bottom", order: 0 },
  { id: "secondary", label: "Secondary", inventoryKey: "Secondary", column: "bottom", order: 1 },
  { id: "range", label: "Range", inventoryKey: "Range", column: "bottom", order: 2 },
  { id: "ammo", label: "Ammo", inventoryKey: "Ammo", column: "bottom", order: 3 },
];

const INVENTORY_LOCATION_MAP: Record<string, string> = {
  "Charm": "charm",
  "Ear": "ear1",
  "Left Ear": "ear1",
  "Right Ear": "ear2",
  "Head": "head",
  "Face": "face",
  "Neck": "neck",
  "Shoulder": "shoulders",
  "Shoulders": "shoulders",
  "Arms": "arms",
  "Back": "back",
  "Left Wrist": "wrist1",
  "Right Wrist": "wrist2",
  "Wrist": "wrist1",
  "Chest": "chest",
  "Waist": "waist",
  "Legs": "legs",
  "Feet": "feet",
  "Hands": "hands",
  "Left Finger": "finger1",
  "Right Finger": "finger2",
  "Finger": "finger1",
  "Fingers": "finger1",
  "Primary": "primary",
  "Secondary": "secondary",
  "Range": "range",
  "Ammo": "ammo",
};

export function mapInventoryLocationToSlot(location: string): string | null {
  if (INVENTORY_LOCATION_MAP[location]) {
    return INVENTORY_LOCATION_MAP[location];
  }

  for (const [key, value] of Object.entries(INVENTORY_LOCATION_MAP)) {
    if (location.toLowerCase() === key.toLowerCase()) {
      return value;
    }
  }

  return null;
}
