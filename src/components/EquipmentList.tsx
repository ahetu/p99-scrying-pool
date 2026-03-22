"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Character, ItemData, UpgradeItem } from "@/lib/types";
import { getItemIconUrl } from "@/lib/itemUtils";
import ItemTooltip from "./ItemTooltip";
import { useVirtualizer } from "@tanstack/react-virtual";

interface EquipmentListProps {
  character: Character;
  items: Record<string, ItemData | null>;
}

interface SlotUpgradeData {
  upgrades: UpgradeItem[];
  currentScore: number;
  total: number;
  dbAvailable: boolean;
}

export default function EquipmentList({ character, items }: EquipmentListProps) {
  const entries = Object.entries(character.equipment).filter(
    ([, item]) => item !== null
  );

  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [upgradeCache, setUpgradeCache] = useState<Record<string, SlotUpgradeData>>({});
  const [loadingSlots, setLoadingSlots] = useState<Set<string>>(new Set());

  const loreItems = entries
    .filter(([, item]) => {
      if (!item) return false;
      const data = items[item.name];
      return data?.stats?.lore;
    })
    .map(([, item]) => item!.name);

  const currentMaxHaste = entries.reduce((max, [, item]) => {
    if (!item) return max;
    const data = items[item.name];
    const haste = data?.stats?.haste ?? 0;
    return Math.max(max, haste);
  }, 0);

  const fetchUpgrades = useCallback(
    async (slotId: string) => {
      if (upgradeCache[slotId]) return;

      setLoadingSlots((prev) => new Set(prev).add(slotId));

      const equippedItem = character.equipment[slotId];
      const params = new URLSearchParams({
        slot: slotId,
        class: character.className,
        race: character.race,
      });
      if (equippedItem) params.set("currentItem", equippedItem.name);
      if (loreItems.length > 0) params.set("loreItems", loreItems.join("|"));
      if (currentMaxHaste > 0) params.set("currentHaste", String(currentMaxHaste));

      try {
        const resp = await fetch(`/api/upgrades?${params}`);
        const data: SlotUpgradeData = await resp.json();
        setUpgradeCache((prev) => ({ ...prev, [slotId]: data }));
      } catch {
        setUpgradeCache((prev) => ({
          ...prev,
          [slotId]: { upgrades: [], currentScore: 0, total: 0, dbAvailable: false },
        }));
      } finally {
        setLoadingSlots((prev) => {
          const next = new Set(prev);
          next.delete(slotId);
          return next;
        });
      }
    },
    [character, items, loreItems, upgradeCache]
  );

  const toggleSlot = useCallback(
    (slotId: string) => {
      if (expandedSlot === slotId) {
        setExpandedSlot(null);
      } else {
        setExpandedSlot(slotId);
        fetchUpgrades(slotId);
      }
    },
    [expandedSlot, fetchUpgrades]
  );

  return (
    <div className="card-fantasy rounded-xl">
      <div className="divide-y divide-zinc-800/30">
        {entries.map(([slotId, item]) => {
          const itemData = item ? items[item.name] : null;
          const isExpanded = expandedSlot === slotId;
          const isLoading = loadingSlots.has(slotId);
          const slotData = upgradeCache[slotId];

          return (
            <div key={slotId}>
              <EquipmentRow
                slotId={slotId}
                itemName={item?.name || ""}
                itemData={itemData}
                isExpanded={isExpanded}
                upgradeCount={slotData?.total}
                onToggle={() => toggleSlot(slotId)}
              />
              {isExpanded && (
                <UpgradePanel
                  slotData={slotData}
                  isLoading={isLoading}
                  currentScore={slotData?.currentScore ?? 0}
                />
              )}
            </div>
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
  isExpanded,
  upgradeCount,
  onToggle,
}: {
  slotId: string;
  itemName: string;
  itemData: ItemData | null;
  isExpanded: boolean;
  upgradeCount?: number;
  onToggle: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={`relative flex items-center gap-3 px-5 py-3 transition-colors group cursor-pointer select-none ${
        isExpanded ? "bg-amber-900/10" : "hover:bg-amber-900/5"
      }`}
      onClick={onToggle}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Expand chevron */}
      <svg
        className={`w-3 h-3 text-zinc-600 transition-transform flex-shrink-0 ${
          isExpanded ? "rotate-90" : ""
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
          clipRule="evenodd"
        />
      </svg>

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

      <span className="text-amber-200/90 text-sm group-hover:text-amber-100 transition-colors">
        {itemName}
      </span>

      <div className="ml-auto flex items-center gap-2">
        {upgradeCount !== undefined && upgradeCount > 0 && (
          <span className="text-[10px] bg-amber-900/30 text-amber-400/70 px-1.5 py-0.5 rounded-full tabular-nums">
            {upgradeCount} upgrade{upgradeCount !== 1 ? "s" : ""}
          </span>
        )}
        {itemData?.wikiUrl && (
          <a
            href={itemData.wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-700 hover:text-amber-500 transition-colors text-[10px] uppercase tracking-wide z-10"
            onClick={(e) => e.stopPropagation()}
          >
            wiki
          </a>
        )}
      </div>

      {showTooltip && itemData && !isExpanded && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 pointer-events-none">
          <ItemTooltip item={itemData} />
        </div>
      )}
    </div>
  );
}

function UpgradePanel({
  slotData,
  isLoading,
  currentScore,
}: {
  slotData?: SlotUpgradeData;
  isLoading: boolean;
  currentScore: number;
}) {
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div className="px-8 py-6 bg-zinc-950/40 border-t border-zinc-800/30">
        <div className="flex items-center gap-2 text-zinc-500 text-xs">
          <div className="w-3 h-3 border-2 border-zinc-600 border-t-amber-500 rounded-full animate-spin" />
          Finding upgrades...
        </div>
      </div>
    );
  }

  if (!slotData || !slotData.dbAvailable) {
    return (
      <div className="px-8 py-4 bg-zinc-950/40 border-t border-zinc-800/30">
        <p className="text-zinc-600 text-xs italic">
          Item database not available. Run the scraper to enable upgrade recommendations.
        </p>
      </div>
    );
  }

  const filtered = search
    ? slotData.upgrades.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase())
      )
    : slotData.upgrades;

  return (
    <div className="bg-zinc-950/40 border-t border-zinc-800/30">
      {/* Search bar */}
      <div className="px-5 pt-3 pb-2 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search upgrades..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-zinc-900/80 border border-zinc-800/50 rounded-md px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-amber-800/50 transition-colors"
        />
        <span className="text-[10px] text-zinc-600 tabular-nums whitespace-nowrap">
          {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="px-8 pb-4">
          <p className="text-zinc-600 text-xs italic">
            {search ? "No items match your search." : "No upgrades found for this slot."}
          </p>
        </div>
      ) : (
        <VirtualUpgradeList upgrades={filtered} currentScore={currentScore} />
      )}
    </div>
  );
}

function VirtualUpgradeList({
  upgrades,
  currentScore,
}: {
  upgrades: UpgradeItem[];
  currentScore: number;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: upgrades.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className="max-h-[400px] overflow-auto px-2 pb-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const upgrade = upgrades[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <UpgradeRow
                upgrade={upgrade}
                currentScore={currentScore}
                rank={virtualRow.index + 1}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UpgradeRow({
  upgrade,
  currentScore,
  rank,
}: {
  upgrade: UpgradeItem;
  currentScore: number;
  rank: number;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const scoreDiff = upgrade.score - currentScore;
  const isUpgrade = scoreDiff > 0;

  const topDiffs = Object.entries(upgrade.statDiffs)
    .filter(([, v]) => v !== 0)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
    .slice(0, 4);

  return (
    <div
      className="relative flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-zinc-800/40 transition-colors group mx-1"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Rank */}
      <span className="text-zinc-700 text-[10px] w-6 text-right tabular-nums flex-shrink-0">
        #{rank}
      </span>

      {/* Icon */}
      {upgrade.lucyImgId ? (
        <img
          src={getItemIconUrl(upgrade.lucyImgId)}
          alt=""
          width={20}
          height={20}
          className="rounded flex-shrink-0"
        />
      ) : (
        <div className="w-5 h-5 rounded bg-zinc-800 flex-shrink-0" />
      )}

      {/* Name + drop source */}
      <div className="flex-1 min-w-0">
        <a
          href={upgrade.wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-200/80 text-xs hover:text-amber-100 transition-colors truncate block"
          onClick={(e) => e.stopPropagation()}
        >
          {upgrade.name}
        </a>
        {upgrade.dropsfrom && (
          <span className="text-zinc-600 text-[10px] truncate block">
            Drops in: {upgrade.dropsfrom}
          </span>
        )}
      </div>

      {/* Stat pills */}
      <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
        {topDiffs.map(([stat, diff]) => (
          <span
            key={stat}
            className={`text-[10px] px-1 py-0.5 rounded tabular-nums ${
              diff > 0
                ? "bg-emerald-900/30 text-emerald-400/80"
                : "bg-red-900/20 text-red-400/60"
            }`}
          >
            {diff > 0 ? "+" : ""}
            {diff} {formatStatLabel(stat)}
          </span>
        ))}
      </div>

      {/* Flags */}
      {upgrade.flags.includes("NO DROP") && (
        <span className="text-[9px] text-zinc-600 uppercase tracking-wider flex-shrink-0">
          ND
        </span>
      )}

      {/* Score */}
      <span
        className={`text-[11px] font-semibold tabular-nums flex-shrink-0 min-w-[50px] text-right ${
          isUpgrade ? "text-emerald-400" : "text-zinc-500"
        }`}
      >
        {isUpgrade ? "+" : ""}
        {scoreDiff.toFixed(1)}
      </span>

      {showTooltip && (
        <div className="absolute right-0 bottom-full mb-2 z-50 pointer-events-none">
          <UpgradeTooltipCompact upgrade={upgrade} />
        </div>
      )}
    </div>
  );
}

const STAT_LABELS: Record<string, string> = {
  hp: "HP", mana: "MANA", ac: "AC",
  str: "STR", sta: "STA", dex: "DEX", agi: "AGI",
  wis: "WIS", int: "INT", cha: "CHA",
  svFire: "SV FIRE", svCold: "SV COLD", svMagic: "SV MAGIC",
  svPoison: "SV POISON", svDisease: "SV DISEASE",
  dmg: "DMG", damage: "DMG", delay: "DELAY", haste: "HASTE", speed: "SPEED",
};

function formatStatLabel(stat: string): string {
  return STAT_LABELS[stat] ?? stat.toUpperCase();
}

function UpgradeTooltipCompact({ upgrade }: { upgrade: UpgradeItem }) {
  const statEntries = Object.entries(upgrade.keyStats)
    .filter(([, v]) => v !== 0)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a));

  return (
    <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-amber-500/50 rounded-lg shadow-2xl shadow-black/80 p-3 min-w-[220px] max-w-[300px] text-[12px] glow-amber">
      <div className="flex items-start gap-2 mb-2 pb-2 border-b border-amber-900/30">
        {upgrade.lucyImgId && (
          <img
            src={getItemIconUrl(upgrade.lucyImgId)}
            alt=""
            width={32}
            height={32}
            className="border border-amber-700/40 rounded bg-zinc-800 flex-shrink-0"
          />
        )}
        <div>
          <span className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent font-bold text-xs leading-tight block">
            {upgrade.name}
          </span>
          {upgrade.dropsfrom && (
            <span className="text-zinc-500 text-[10px] block mt-0.5">
              Drops in: {upgrade.dropsfrom}
            </span>
          )}
        </div>
      </div>

      {upgrade.flags.length > 0 && (
        <div className="text-zinc-500 text-[10px] uppercase tracking-wide mb-1">
          {upgrade.flags.join(" · ")}
        </div>
      )}

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 tabular-nums">
        {statEntries.map(([stat, val]) => (
          <span key={stat}>
            <span className="text-zinc-500">{formatStatLabel(stat)}:</span>{" "}
            <span className={val < 0 ? "text-red-400 font-semibold" : "text-amber-100 font-semibold"}>
              {val > 0 ? "+" : ""}{val}
            </span>
          </span>
        ))}
      </div>

      <div className="text-amber-500/60 text-[10px] mt-1.5">
        Score: {upgrade.score.toFixed(1)}
      </div>
    </div>
  );
}
