"use client";

import { ItemData } from "@/lib/types";
import { getItemIconUrl } from "@/lib/itemUtils";

interface ItemTooltipProps {
  item: ItemData;
}

export default function ItemTooltip({ item }: ItemTooltipProps) {
  const s = item.stats;

  if (!s) {
    return (
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-amber-500/50 rounded-lg shadow-2xl shadow-black/80 p-4 min-w-[270px] max-w-[340px] font-sans font-medium text-[13px] leading-relaxed glow-amber">
        <div className="flex items-start gap-2.5 mb-2 pb-2 border-b border-amber-900/30">
          {item.lucyImgId && (
            <img
              src={getItemIconUrl(item.lucyImgId)}
              alt={item.name}
              width={40}
              height={40}
              className="border border-amber-700/40 rounded bg-zinc-800 flex-shrink-0"
            />
          )}
          <span className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent font-bold text-sm leading-tight">
            {item.name}
          </span>
        </div>
        <p className="text-zinc-500 text-[11px] italic">Stats could not be parsed from wiki</p>
        {item.wikiUrl && (
          <a href={item.wikiUrl} target="_blank" rel="noopener noreferrer" className="text-amber-400/60 text-[11px] underline mt-1 block">
            View on Wiki
          </a>
        )}
      </div>
    );
  }

  const flags: string[] = [];
  if (s.magic) flags.push("MAGIC ITEM");
  if (s.lore) flags.push("LORE ITEM");
  if (s.noDrop) flags.push("NO DROP");
  if (s.noRent) flags.push("NO RENT");
  if (s.expendable) flags.push("EXPENDABLE");
  if (s.quest) flags.push("QUEST ITEM");

  const statPairs: [string, number | null][] = [
    ["STR", s.str], ["STA", s.sta], ["AGI", s.agi],
    ["DEX", s.dex], ["WIS", s.wis], ["INT", s.int], ["CHA", s.cha],
  ];
  const activeStats = statPairs.filter(([, v]) => v !== null && v !== 0);

  const savePairs: [string, number | null][] = [
    ["SV FIRE", s.svFire], ["SV DISEASE", s.svDisease], ["SV COLD", s.svCold],
    ["SV MAGIC", s.svMagic], ["SV POISON", s.svPoison],
  ];
  const activeSaves = savePairs.filter(([, v]) => v !== null && v !== 0);

  return (
    <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-amber-500/50 rounded-lg shadow-2xl shadow-black/80 p-4 min-w-[270px] max-w-[340px] font-sans font-medium text-[13px] leading-normal glow-amber">
      {/* Header */}
      <div className="flex items-start gap-2.5 mb-2.5 pb-2.5 border-b border-amber-900/30">
        {item.lucyImgId && (
          <img
            src={getItemIconUrl(item.lucyImgId)}
            alt={item.name}
            width={40}
            height={40}
            className="border border-amber-700/40 rounded bg-zinc-800 flex-shrink-0"
          />
        )}
        <span className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent font-bold text-sm leading-tight">
          {item.name}
        </span>
      </div>

      {flags.length > 0 && (
        <div className="text-zinc-500 text-[11px] tracking-wide uppercase">{flags.join(" \u00b7 ")}</div>
      )}

      {s.slots.length > 0 && (
        <div className="text-zinc-400 mt-1">
          Slot: <span className="text-zinc-200">{s.slots.join(" ")}</span>
        </div>
      )}

      {s.skill && (
        <div className="text-zinc-400 mt-0.5">
          Skill: <span className="text-zinc-200">{s.skill}</span>
          {s.delay !== null && <span className="ml-3 text-zinc-400">Atk Delay: <span className="text-zinc-200">{s.delay}</span></span>}
        </div>
      )}

      {s.damage !== null && (
        <div className="text-zinc-400 mt-0.5">
          DMG: <span className="text-red-300 font-semibold tabular-nums">{s.damage}</span>
          {s.ratio !== null && (
            <span className="text-zinc-600 ml-2">(Ratio: {s.ratio})</span>
          )}
        </div>
      )}

      {s.ac !== null && s.ac !== 0 && (
        <div className={`font-semibold mt-0.5 tabular-nums ${s.ac < 0 ? "text-red-400" : "text-blue-300"}`}>AC: {s.ac}</div>
      )}

      {(s.hp !== null || s.mana !== null) && (
        <div className="mt-1 tabular-nums">
          {s.hp !== null && s.hp !== 0 && (
            <span className={`font-semibold ${s.hp < 0 ? "text-red-400" : "text-green-400"}`}>HP: {s.hp > 0 ? "+" : ""}{s.hp} </span>
          )}
          {s.mana !== null && s.mana !== 0 && (
            <span className={`font-semibold ${s.mana < 0 ? "text-red-400" : "text-blue-400"}`}>MANA: {s.mana > 0 ? "+" : ""}{s.mana}</span>
          )}
        </div>
      )}

      {activeStats.length > 0 && (
        <div className="text-amber-200/90 mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 tabular-nums">
          {activeStats.map(([label, val]) => (
            <span key={label}>
              <span className="text-zinc-400">{label}:</span>{" "}
              <span className={`font-semibold ${val! < 0 ? "text-red-400" : "text-amber-100"}`}>{val! > 0 ? "+" : ""}{val}</span>
            </span>
          ))}
        </div>
      )}

      {activeSaves.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 tabular-nums">
          {activeSaves.map(([label, val]) => (
            <span key={label}>
              <span className="text-zinc-400">{label}:</span>{" "}
              <span className={`font-semibold ${val! < 0 ? "text-red-400" : "text-purple-300"}`}>{val! > 0 ? "+" : ""}{val}</span>
            </span>
          ))}
        </div>
      )}

      {s.effect && (
        <div className="text-emerald-300 mt-1.5">
          Effect: <span className="font-semibold">{s.effect}</span>
          {s.effectType && <span className="text-zinc-500 font-normal"> ({s.effectType})</span>}
        </div>
      )}

      <div className="divider-ornate my-2" />

      <div className="text-zinc-500 text-[11px] flex justify-between">
        {s.weight !== null && <span>WT: {s.weight}</span>}
        {s.size && <span>Size: {s.size}</span>}
      </div>

      {s.classes.length > 0 && (
        <div className="text-zinc-500 text-[11px] mt-0.5">Class: {s.classes.join(" ")}</div>
      )}
      {s.races.length > 0 && (
        <div className="text-zinc-500 text-[11px]">Race: {s.races.join(" ")}</div>
      )}
    </div>
  );
}
