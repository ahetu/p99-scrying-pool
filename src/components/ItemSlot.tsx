"use client";

import { useState, useRef, useEffect } from "react";
import { EquippedItem, ItemData } from "@/lib/types";
import { getItemIconUrl } from "@/lib/itemUtils";
import ItemTooltip from "./ItemTooltip";

interface ItemSlotProps {
  slotLabel: string;
  item: EquippedItem | null;
  itemData: ItemData | null;
}

export default function ItemSlot({ slotLabel, item, itemData }: ItemSlotProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<"right" | "left">("right");
  const slotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showTooltip && slotRef.current) {
      const rect = slotRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.right;
      setTooltipPos(spaceRight < 360 ? "left" : "right");
    }
  }, [showTooltip]);

  const hasItem = !!item;
  const hasWikiData = !!itemData;
  const hasIcon = hasWikiData && !!itemData.lucyImgId;

  return (
    <div
      ref={slotRef}
      className="relative group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={
          "w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 " +
          (hasItem
            ? "bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 border border-amber-600/40 hover:border-amber-400/70 hover:shadow-[0_0_15px_rgba(217,119,6,0.2)] cursor-pointer"
            : "bg-zinc-900/30 border border-zinc-800/40")
        }
      >
        {hasIcon ? (
          <img
            src={getItemIconUrl(itemData.lucyImgId!)}
            alt={item!.name}
            width={40}
            height={40}
            className="rounded"
          />
        ) : hasItem ? (
          <span className="text-[7px] text-amber-400/70 text-center leading-tight px-0.5 line-clamp-3 overflow-hidden">
            {item.name}
          </span>
        ) : (
          <span className="text-[8px] text-zinc-700 text-center leading-tight px-0.5 uppercase tracking-wide">
            {slotLabel}
          </span>
        )}
      </div>

      {showTooltip && hasItem && hasWikiData && (
        <div
          className={`absolute z-50 ${
            tooltipPos === "right" ? "left-full ml-3" : "right-full mr-3"
          } top-1/2 -translate-y-1/2`}
          style={{ animation: "fadeIn 0.15s ease-out" }}
        >
          <ItemTooltip item={itemData} />
        </div>
      )}

      {showTooltip && hasItem && !hasWikiData && (
        <div
          className={`absolute z-50 ${
            tooltipPos === "right" ? "left-full ml-3" : "right-full mr-3"
          } top-1/2 -translate-y-1/2`}
          style={{ animation: "fadeIn 0.15s ease-out" }}
        >
          <div className="bg-zinc-900/95 border border-amber-900/30 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
            <p className="text-amber-200 text-xs font-bold">{item.name}</p>
            <p className="text-zinc-500 text-[10px] mt-0.5 italic">Wiki data unavailable</p>
          </div>
        </div>
      )}
    </div>
  );
}
