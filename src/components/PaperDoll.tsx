"use client";

import { Character, ItemData } from "@/lib/types";
import { EQUIPMENT_SLOTS } from "@/lib/slots";
import ItemSlot from "./ItemSlot";

interface PaperDollProps {
  character: Character;
  items: Record<string, ItemData | null>;
}

export default function PaperDoll({ character, items }: PaperDollProps) {
  const leftSlots = EQUIPMENT_SLOTS.filter((s) => s.column === "left").sort(
    (a, b) => a.order - b.order
  );
  const rightSlots = EQUIPMENT_SLOTS.filter((s) => s.column === "right").sort(
    (a, b) => a.order - b.order
  );
  const bottomSlots = EQUIPMENT_SLOTS.filter((s) => s.column === "bottom").sort(
    (a, b) => a.order - b.order
  );

  function getItemData(slotId: string): ItemData | null {
    const equipped = character.equipment[slotId];
    if (!equipped) return null;
    return items[equipped.name] || null;
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-start gap-4 sm:gap-8">
        {/* Left column */}
        <div className="flex flex-col gap-2 items-end">
          {leftSlots.map((slot) => (
            <ItemSlot
              key={slot.id}
              slotLabel={slot.label}
              item={character.equipment[slot.id] || null}
              itemData={getItemData(slot.id)}
            />
          ))}
        </div>

        {/* Center silhouette */}
        <div className="w-36 sm:w-48 flex flex-col items-center justify-center py-6">
          <div className="relative w-full aspect-[3/5] flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-amber-800/8 via-amber-900/5 to-transparent border border-amber-800/15" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-zinc-950/50 to-transparent" />
            <div className="text-center z-10">
              <div className="text-5xl sm:text-6xl opacity-20 mb-3">
                &#x2694;
              </div>
              <div className="bg-gradient-to-r from-amber-200 to-amber-100 bg-clip-text text-transparent font-bold text-sm sm:text-base">
                {character.name}
              </div>
              <div className="text-zinc-500 text-xs mt-0.5">
                Lv {character.level} {character.race}
              </div>
              <div className="text-amber-500/70 text-xs">
                {character.className}
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-2 items-start">
          {rightSlots.map((slot) => (
            <ItemSlot
              key={slot.id}
              slotLabel={slot.label}
              item={character.equipment[slot.id] || null}
              itemData={getItemData(slot.id)}
            />
          ))}
        </div>
      </div>

      {/* Bottom row - weapons */}
      <div className="flex gap-2 justify-center">
        {bottomSlots.map((slot) => (
          <ItemSlot
            key={slot.id}
            slotLabel={slot.label}
            item={character.equipment[slot.id] || null}
            itemData={getItemData(slot.id)}
          />
        ))}
      </div>
    </div>
  );
}
