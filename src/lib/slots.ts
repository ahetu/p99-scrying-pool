export interface SlotDefinition {
  id: string;
  label: string;
  inventoryKey: string;
  column: "left" | "right" | "bottom";
  order: number;
}

export const EQUIPMENT_SLOTS: SlotDefinition[] = [
  { id: "charm", label: "Charm", inventoryKey: "Charm", column: "left", order: 0 },
  { id: "ear1", label: "Ear", inventoryKey: "Ear", column: "left", order: 1 },
  { id: "head", label: "Head", inventoryKey: "Head", column: "left", order: 2 },
  { id: "face", label: "Face", inventoryKey: "Face", column: "left", order: 3 },
  { id: "neck", label: "Neck", inventoryKey: "Neck", column: "left", order: 4 },
  { id: "shoulders", label: "Shoulders", inventoryKey: "Shoulders", column: "left", order: 5 },
  { id: "arms", label: "Arms", inventoryKey: "Arms", column: "left", order: 6 },
  { id: "back", label: "Back", inventoryKey: "Back", column: "left", order: 7 },
  { id: "wrist1", label: "Wrist", inventoryKey: "Wrist1", column: "left", order: 8 },
  { id: "wrist2", label: "Wrist", inventoryKey: "Wrist2", column: "left", order: 9 },

  { id: "ear2", label: "Ear", inventoryKey: "Ear2", column: "right", order: 0 },
  { id: "chest", label: "Chest", inventoryKey: "Chest", column: "right", order: 1 },
  { id: "waist", label: "Waist", inventoryKey: "Waist", column: "right", order: 2 },
  { id: "legs", label: "Legs", inventoryKey: "Legs", column: "right", order: 3 },
  { id: "feet", label: "Feet", inventoryKey: "Feet", column: "right", order: 4 },
  { id: "hands", label: "Hands", inventoryKey: "Hands", column: "right", order: 5 },
  { id: "finger1", label: "Finger", inventoryKey: "Finger1", column: "right", order: 6 },
  { id: "finger2", label: "Finger", inventoryKey: "Finger2", column: "right", order: 7 },

  { id: "primary", label: "Primary", inventoryKey: "Primary", column: "bottom", order: 0 },
  { id: "secondary", label: "Secondary", inventoryKey: "Secondary", column: "bottom", order: 1 },
  { id: "range", label: "Range", inventoryKey: "Range", column: "bottom", order: 2 },
  { id: "ammo", label: "Ammo", inventoryKey: "Ammo", column: "bottom", order: 3 },
];

const INVENTORY_LOCATION_MAP: Record<string, string> = {
  "Charm": "charm",
  "Left Ear": "ear1",
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
  "Right Ear": "ear2",
  "Chest": "chest",
  "Waist": "waist",
  "Legs": "legs",
  "Feet": "feet",
  "Hands": "hands",
  "Left Finger": "finger1",
  "Right Finger": "finger2",
  "Finger": "finger1",
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
