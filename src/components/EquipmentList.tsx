"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Character, ItemData, UpgradeItem } from "@/lib/types";
import { getItemIconUrl } from "@/lib/itemUtils";
import { getClassWeights } from "@/lib/classStatWeights";
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

const ROLE_TOGGLE_CLASSES = new Set(["Warrior", "Paladin", "Shadow Knight"]);

function cleanZoneName(raw: string): string {
  return raw
    .replace(/^\[\[/, "")
    .replace(/<br\s*\/?>$/i, "")
    .replace(/^\*\s*/, "")
    .replace(/\}\}$/, "")
    .trim();
}

function getStoredRole(className: string): "tank" | "dps" {
  if (typeof window === "undefined") return "tank";
  try {
    const v = localStorage.getItem(`armory-role-${className}`);
    return v === "dps" ? "dps" : "tank";
  } catch {
    return "tank";
  }
}

function getStoredRaidFilter(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem("armory-show-raid") !== "false";
  } catch {
    return true;
  }
}

export default function EquipmentList({ character, items }: EquipmentListProps) {
  const entries = useMemo(
    () => Object.entries(character.equipment).filter(([, item]) => item !== null),
    [character.equipment]
  );

  const hasRoleToggle = ROLE_TOGGLE_CLASSES.has(character.className);
  const [role, setRole] = useState<"tank" | "dps">(() => getStoredRole(character.className));
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [upgradeCache, setUpgradeCache] = useState<Record<string, SlotUpgradeData>>({});
  const [loadingSlots, setLoadingSlots] = useState<Set<string>>(new Set());
  const [showRaid, setShowRaid] = useState(getStoredRaidFilter);
  const inFlightRef = useRef(new Set<string>());
  const prefetchStartedRef = useRef(false);

  const handleRoleChange = useCallback(
    (newRole: "tank" | "dps") => {
      setRole(newRole);
      try {
        localStorage.setItem(`armory-role-${character.className}`, newRole);
      } catch { /* noop */ }
      setUpgradeCache({});
      setExpandedSlot(null);
      inFlightRef.current.clear();
      prefetchStartedRef.current = false;
    },
    [character.className]
  );

  const handleRaidToggle = useCallback(() => {
    setShowRaid((prev) => {
      const next = !prev;
      try { localStorage.setItem("armory-show-raid", String(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

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
      if (upgradeCache[slotId] || inFlightRef.current.has(slotId)) return;
      inFlightRef.current.add(slotId);

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
      if (hasRoleToggle) params.set("role", role);

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
        inFlightRef.current.delete(slotId);
        setLoadingSlots((prev) => {
          const next = new Set(prev);
          next.delete(slotId);
          return next;
        });
      }
    },
    [character, items, loreItems, upgradeCache, role, hasRoleToggle, currentMaxHaste]
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

  useEffect(() => {
    if (prefetchStartedRef.current) return;
    prefetchStartedRef.current = true;
    entries.forEach(([slotId]) => fetchUpgrades(slotId));
  }, [entries, fetchUpgrades]);

  return (
    <div className="card-fantasy rounded-xl">
      {hasRoleToggle && (
        <div className="flex items-center gap-3 px-5 py-2.5 border-b border-zinc-800/30">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Gear Role</span>
          <div className="flex rounded-md overflow-hidden border border-zinc-700/50">
            <button
              onClick={() => handleRoleChange("tank")}
              className={`px-3 py-1 text-[11px] font-medium transition-colors ${
                role === "tank"
                  ? "bg-amber-900/40 text-amber-300 border-r border-zinc-700/50"
                  : "bg-zinc-900/60 text-zinc-500 hover:text-zinc-300 border-r border-zinc-700/50"
              }`}
            >
              Tank
            </button>
            <button
              onClick={() => handleRoleChange("dps")}
              className={`px-3 py-1 text-[11px] font-medium transition-colors ${
                role === "dps"
                  ? "bg-amber-900/40 text-amber-300"
                  : "bg-zinc-900/60 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              DPS
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-zinc-800/30">
        {entries.map(([slotId, item]) => {
          const itemData = item ? items[item.name] : null;
          const isExpanded = expandedSlot === slotId;
          const isLoading = loadingSlots.has(slotId);
          const slotData = upgradeCache[slotId];
          const filteredCount = slotData
            ? slotData.upgrades.filter(
                (u) => u.score > slotData.currentScore && (showRaid || !u.isRaid)
              ).length
            : undefined;

          return (
            <div key={slotId}>
              <EquipmentRow
                slotId={slotId}
                itemName={item?.name || ""}
                itemData={itemData}
                isExpanded={isExpanded}
                upgradeCount={filteredCount}
                isLoadingUpgrades={!slotData}
                onToggle={() => toggleSlot(slotId)}
              />
              {isExpanded && (
                <UpgradePanel
                  slotData={slotData}
                  isLoading={isLoading}
                  currentScore={slotData?.currentScore ?? 0}
                  className={character.className}
                  showRaid={showRaid}
                  onRaidToggle={handleRaidToggle}
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
  isLoadingUpgrades,
  onToggle,
}: {
  slotId: string;
  itemName: string;
  itemData: ItemData | null;
  isExpanded: boolean;
  upgradeCount?: number;
  isLoadingUpgrades?: boolean;
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
        {isLoadingUpgrades ? (
          <div className="w-3 h-3 border border-zinc-700 border-t-amber-500/50 rounded-full animate-spin" />
        ) : upgradeCount !== undefined && upgradeCount > 0 ? (
          <span className="text-[10px] bg-amber-900/30 text-amber-400/70 px-1.5 py-0.5 rounded-full tabular-nums">
            {upgradeCount} upgrade{upgradeCount !== 1 ? "s" : ""}
          </span>
        ) : null}
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
  className,
  showRaid,
  onRaidToggle,
}: {
  slotData?: SlotUpgradeData;
  isLoading: boolean;
  currentScore: number;
  className: string;
  showRaid: boolean;
  onRaidToggle: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = slotData?.upgrades ?? [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(q));
    }
    if (!showRaid) {
      list = list.filter((u) => !u.isRaid);
    }
    return list;
  }, [slotData?.upgrades, search, showRaid]);

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

  return (
    <div className="bg-zinc-950/40 border-t border-zinc-800/30">
      {/* Search bar + raid toggle */}
      <div className="px-5 pt-3 pb-2 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search upgrades..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-zinc-900/80 border border-zinc-800/50 rounded-md px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-amber-800/50 transition-colors"
        />
        <button
          onClick={(e) => { e.stopPropagation(); onRaidToggle(); }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors border whitespace-nowrap ${
            showRaid
              ? "bg-zinc-900/60 border-zinc-700/50 text-zinc-400 hover:text-zinc-300"
              : "bg-amber-900/30 border-amber-700/40 text-amber-400"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${showRaid ? "bg-zinc-600" : "bg-amber-400"}`} />
          {showRaid ? "Raid: On" : "Raid: Off"}
        </button>
        <span className="text-[10px] text-zinc-600 tabular-nums whitespace-nowrap">
          {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Score explanation */}
      <div className="px-5 pb-2">
        <p className="text-[10px] text-zinc-600 leading-relaxed">
          Ranked by a <span className="text-zinc-500">weighted score</span> based on your class&apos;s stat priorities.{" "}
          <span className="text-emerald-500/70">Green</span> = upgrade over equipped,{" "}
          <span className="text-zinc-500">gray</span> = downgrade.
        </p>
      </div>

      {/* Column legend */}
      <div className="px-5 pb-1 flex items-center text-[9px] text-zinc-600 uppercase tracking-wider">
        <span className="w-6 mr-2.5" />
        <span className="w-5 mr-2.5" />
        <span className="flex-1">Item</span>
        <span className="hidden sm:block mr-1">Stat changes vs. equipped</span>
        <span className="min-w-[50px] text-right">Score</span>
      </div>

      {filtered.length === 0 ? (
        <div className="px-8 pb-4">
          <p className="text-zinc-600 text-xs italic">
            {search ? "No items match your search." : !showRaid ? "No non-raid items found. Try enabling raid loot." : "No upgrades found for this slot."}
          </p>
        </div>
      ) : (
        <VirtualUpgradeList upgrades={filtered} currentScore={currentScore} className={className} />
      )}
    </div>
  );
}

function VirtualUpgradeList({
  upgrades,
  currentScore,
  className,
}: {
  upgrades: UpgradeItem[];
  currentScore: number;
  className: string;
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
                className={className}
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
  className,
}: {
  upgrade: UpgradeItem;
  currentScore: number;
  rank: number;
  className: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const scoreDiff = upgrade.score - currentScore;
  const isUpgrade = scoreDiff > 0;
  const raid = upgrade.isRaid;

  const weights = getClassWeights(className);
  const topDiffs = Object.entries(upgrade.statDiffs)
    .filter(([, v]) => v !== 0)
    .sort(([a, av], [b, bv]) => {
      const wa = (weights[a as keyof typeof weights] as number) ?? 0;
      const wb = (weights[b as keyof typeof weights] as number) ?? 0;
      return Math.abs(bv) * wb - Math.abs(av) * wa;
    })
    .slice(0, 4);

  const sourceLines: string[] = [];
  if (upgrade.dropsfrom) sourceLines.push(`Drops: ${cleanZoneName(upgrade.dropsfrom)}`);
  if (upgrade.relatedquests?.length) sourceLines.push(`Quest: ${upgrade.relatedquests[0]}`);

  useEffect(() => {
    if (showTooltip && rowRef.current) {
      const rect = rowRef.current.getBoundingClientRect();
      setTooltipPos({ top: rect.top - 8, left: rect.right });
    }
  }, [showTooltip]);

  return (
    <div
      ref={rowRef}
      className="relative flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors group mx-1 hover:bg-zinc-800/40"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Row content wrapper -- dims for downgrades without affecting the tooltip */}
      <div className={`flex items-center gap-2.5 flex-1 min-w-0 ${
        isUpgrade ? "" : "opacity-[0.38]"
      }`}>
        {/* Rank */}
        <span className={`text-[10px] w-6 text-right tabular-nums flex-shrink-0 ${
          isUpgrade ? "text-zinc-700" : "text-zinc-700"
        }`}>
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

        {/* Name + source */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <a
              href={upgrade.wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs transition-colors truncate block ${
                isUpgrade
                  ? "text-amber-200/80 hover:text-amber-100"
                  : "text-zinc-500 hover:text-zinc-400"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {upgrade.name}
            </a>
            {raid && (
              <span className="text-[8px] text-red-400/60 uppercase tracking-wider flex-shrink-0">
                raid
              </span>
            )}
          </div>
          {sourceLines.length > 0 && (
            <span className={`text-[10px] truncate block ${
              isUpgrade ? "text-zinc-600" : "text-zinc-600"
            }`}>
              {sourceLines.join(" · ")}
            </span>
          )}
        </div>

        {/* Stat pills -- only for upgrades */}
        {isUpgrade && (
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
        )}

        {/* Flags */}
        {upgrade.flags.includes("NO DROP") && (
          <span className={`text-[9px] uppercase tracking-wider flex-shrink-0 ${
            isUpgrade ? "text-zinc-600" : "text-zinc-600"
          }`}>
            ND
          </span>
        )}

        {/* Score */}
        <span
          className={`text-[11px] font-semibold tabular-nums flex-shrink-0 min-w-[50px] text-right ${
            isUpgrade ? "text-emerald-400" : "text-zinc-600"
          }`}
        >
          {isUpgrade ? "+" : ""}
          {scoreDiff.toFixed(1)}
        </span>
      </div>

      {showTooltip && tooltipPos && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ top: tooltipPos.top, left: tooltipPos.left, transform: "translate(-100%, -100%)" }}
        >
          <UpgradeTooltipCompact upgrade={upgrade} />
        </div>,
        document.body
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

  const sourceLines: string[] = [];
  if (upgrade.dropsfrom) sourceLines.push(`Drops: ${cleanZoneName(upgrade.dropsfrom)}`);
  if (upgrade.relatedquests?.length) {
    upgrade.relatedquests.forEach((q) => sourceLines.push(`Quest: ${q}`));
  }

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
          {sourceLines.map((line, i) => (
            <span key={i} className="text-zinc-500 text-[10px] block mt-0.5">
              {line}
            </span>
          ))}
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
