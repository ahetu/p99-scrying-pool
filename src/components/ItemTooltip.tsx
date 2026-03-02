"use client";

import { ItemData } from "@/lib/types";
import { getItemIconUrl } from "@/lib/itemUtils";

interface ItemTooltipProps {
  item: ItemData;
}

export default function ItemTooltip({ item }: ItemTooltipProps) {
  const s = item.stats;

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
    <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-amber-500/50 rounded-lg shadow-2xl shadow-black/80 p-3.5 min-w-[270px] max-w-[340px] font-mono text-xs leading-relaxed glow-amber">
      {/* Header */}
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

      {flags.length > 0 && (
        <div className="text-zinc-500 text-[10px] tracking-wide">{flags.join(" ")}</div>
      )}

      {s.slots.length > 0 && (
        <div className="text-zinc-300 mt-0.5">
          Slot: <span className="text-zinc-200">{s.slots.join(" ")}</span>
        </div>
      )}

      {s.skill && (
        <div className="text-zinc-300">
          Skill: {s.skill}
          {s.delay !== null && <span className="ml-3">Atk Delay: {s.delay}</span>}
        </div>
      )}

      {s.damage !== null && (
        <div className="text-zinc-200">
          DMG: <span className="text-red-300">{s.damage}</span>
          {s.ratio !== null && (
            <span className="text-zinc-600 ml-2">(Ratio: {s.ratio})</span>
          )}
        </div>
      )}

      {s.ac !== null && s.ac !== 0 && (
        <div className={`font-semibold ${s.ac < 0 ? "text-red-400" : "text-blue-300"}`}>AC: {s.ac}</div>
      )}

      {(s.hp !== null || s.mana !== null) && (
        <div className="mt-0.5">
          {s.hp !== null && s.hp !== 0 && (
            <span className={s.hp < 0 ? "text-red-400" : "text-green-400"}>HP: {s.hp > 0 ? "+" : ""}{s.hp} </span>
          )}
          {s.mana !== null && s.mana !== 0 && (
            <span className={s.mana < 0 ? "text-red-400" : "text-blue-400"}>MANA: {s.mana > 0 ? "+" : ""}{s.mana}</span>
          )}
        </div>
      )}

      {activeStats.length > 0 && (
        <div className="text-amber-200/90 mt-0.5">
          {activeStats.map(([label, val], i) => (
            <span key={label}>
              {i > 0 && " "}
              {label}: <span className={val! < 0 ? "text-red-400" : "text-amber-100"}>{val! > 0 ? "+" : ""}{val}</span>
            </span>
          ))}
        </div>
      )}

      {activeSaves.length > 0 && (
        <div className="mt-0.5">
          {activeSaves.map(([label, val], i) => (
            <span key={label} className={val! < 0 ? "text-red-400" : "text-purple-300/80"}>
              {i > 0 && " "}
              {label}: {val! > 0 ? "+" : ""}{val}
            </span>
          ))}
        </div>
      )}

      {s.effect && (
        <div className="text-emerald-300 mt-0.5">
          Effect: {s.effect}
          {s.effectType && <span className="text-zinc-500"> ({s.effectType})</span>}
        </div>
      )}

      <div className="divider-ornate my-1.5" />

      <div className="text-zinc-500 flex justify-between">
        {s.weight !== null && <span>WT: {s.weight}</span>}
        {s.size && <span>Size: {s.size}</span>}
      </div>

      {s.classes.length > 0 && (
        <div className="text-zinc-500 mt-0.5">Class: {s.classes.join(" ")}</div>
      )}
      {s.races.length > 0 && (
        <div className="text-zinc-500">Race: {s.races.join(" ")}</div>
      )}
    </div>
  );
}
