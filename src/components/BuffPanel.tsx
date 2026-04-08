"use client";

import { BuffDefinition, BuffStats, getExternalBuffs, getSelfBuffs, getBlockedBy } from "@/lib/buffs";

interface BuffPanelProps {
  className: string;
  activeBuffs: Set<string>;
  onToggle: (buffId: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  hpac: "HP / AC",
  hp: "HP",
  ac: "AC",
  stats: "Stats",
  mana: "Mana",
  haste: "Haste",
  resists: "Resists",
};

const CATEGORY_ORDER = ["hpac", "hp", "ac", "stats", "mana", "haste", "resists"];

function groupByCategory(buffs: BuffDefinition[]): [string, BuffDefinition[]][] {
  const groups = new Map<string, BuffDefinition[]>();
  for (const buff of buffs) {
    const cat = buff.category === "self" ? "self" : buff.category;
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(buff);
  }
  return CATEGORY_ORDER
    .filter((cat) => groups.has(cat))
    .map((cat) => [cat, groups.get(cat)!]);
}

function formatStats(stats: BuffStats): string {
  const parts: string[] = [];
  if (stats.hp) parts.push(`+${stats.hp} HP`);
  if (stats.ac) parts.push(`+${stats.ac} AC`);
  if (stats.mana) parts.push(`+${stats.mana} Mana`);
  if (stats.str) parts.push(`+${stats.str} STR`);
  if (stats.sta) parts.push(`+${stats.sta} STA`);
  if (stats.agi) parts.push(`+${stats.agi} AGI`);
  if (stats.dex) parts.push(`+${stats.dex} DEX`);
  if (stats.wis) parts.push(`+${stats.wis} WIS`);
  if (stats.int) parts.push(`+${stats.int} INT`);
  if (stats.svMagic) parts.push(`+${stats.svMagic} MR`);
  if (stats.svFire) parts.push(`+${stats.svFire} FR`);
  if (stats.svCold) parts.push(`+${stats.svCold} CR`);
  if (stats.svPoison) parts.push(`+${stats.svPoison} PR`);
  if (stats.svDisease) parts.push(`+${stats.svDisease} DR`);
  return parts.join("  ");
}

function BuffRow({
  buff,
  active,
  blockedByName,
  onToggle,
}: {
  buff: BuffDefinition;
  active: boolean;
  blockedByName: string | null;
  onToggle: (id: string) => void;
}) {
  const blocked = !!blockedByName && !active;

  return (
    <label
      className={`flex items-start gap-1.5 py-[3px] cursor-pointer group transition-opacity ${
        blocked ? "opacity-40" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={active}
        onChange={() => onToggle(buff.id)}
        className="mt-[3px] accent-amber-500 w-3 h-3 rounded cursor-pointer flex-shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] leading-tight ${active ? "text-amber-200" : "text-zinc-400"} group-hover:text-amber-200 transition-colors`}>
            {buff.name}
          </span>
          <span className="text-[9px] text-zinc-600 uppercase flex-shrink-0">{buff.casterTag}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-zinc-600 leading-tight">{formatStats(buff.stats)}</span>
          {blocked && (
            <span className="text-[8px] text-red-400/70 flex items-center gap-0.5 flex-shrink-0">
              <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
              </svg>
              {blockedByName}
            </span>
          )}
        </div>
      </div>
    </label>
  );
}

export default function BuffPanel({ className, activeBuffs, onToggle }: BuffPanelProps) {
  const external = getExternalBuffs();
  const self = getSelfBuffs(className);
  const grouped = groupByCategory(external);

  return (
    <div className="space-y-2">
      {grouped.map(([cat, buffs]) => (
        <div key={cat}>
          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-0.5 font-bold">
            {CATEGORY_LABELS[cat]}
          </div>
          {buffs.map((buff) => (
            <BuffRow
              key={buff.id}
              buff={buff}
              active={activeBuffs.has(buff.id)}
              blockedByName={getBlockedBy(buff.id, activeBuffs)}
              onToggle={onToggle}
            />
          ))}
        </div>
      ))}

      {self.length > 0 && (
        <>
          <div className="border-t border-amber-900/20 pt-2 mt-2">
            <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-0.5 font-bold">
              Self Buffs
            </div>
            {self.map((buff) => (
              <BuffRow
                key={buff.id}
                buff={buff}
                active={activeBuffs.has(buff.id)}
                blockedByName={getBlockedBy(buff.id, activeBuffs)}
                onToggle={onToggle}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
