"use client";

import { useState } from "react";
import { Character, ItemData } from "@/lib/types";
import { getItemIconUrl } from "@/lib/itemUtils";
import ItemTooltip from "./ItemTooltip";

interface EquipmentListProps {
  character: Character;
  items: Record<string, ItemData | null>;
}

export default function EquipmentList({ character, items }: EquipmentListProps) {
  const entries = Object.entries(character.equipment).filter(
    ([, item]) => item !== null
  );

  return (
    <div className="card-fantasy rounded-xl">
      <div className="divide-y divide-zinc-800/30">
        {entries.map(([slotId, item]) => {
          const itemData = item ? items[item.name] : null;
          return (
            <EquipmentRow
              key={slotId}
              slotId={slotId}
              itemName={item?.name || ""}
              itemData={itemData}
            />
          );
        })}
      </div>
    </div>
  );
}

function EquipmentRow({
  slotId,
  itemName,
  itemData,
}: {
  slotId: string;
  itemName: string;
  itemData: ItemData | null;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative flex items-center gap-3 px-5 py-3 hover:bg-amber-900/5 transition-colors group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="text-zinc-600 text-[10px] w-20 flex-shrink-0 capitalize uppercase tracking-wide">
        {slotId.replace(/(\d)/, " $1")}
      </span>
      {itemData?.lucyImgId && (
        <img
          src={getItemIconUrl(itemData.lucyImgId)}
          alt=""
          width={20}
          height={20}
          className="rounded flex-shrink-0"
        />
      )}
      <span className="text-amber-200/90 text-sm group-hover:text-amber-100 transition-colors cursor-default">
        {itemName}
      </span>
      {itemData?.wikiUrl && (
        <a
          href={itemData.wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-zinc-700 hover:text-amber-500 transition-colors text-[10px] uppercase tracking-wide z-10"
        >
          wiki
        </a>
      )}

      {showTooltip && itemData && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50">
          <ItemTooltip item={itemData} />
        </div>
      )}
    </div>
  );
}
