"use client";

import { Character, ItemData } from "@/lib/types";
import { getBaseStats, getBonusPointsForClass, calculateMaxMana, calculateMaxHp, getManaStat } from "@/lib/baseStats";

interface StatsSummaryProps {
  character: Character;
  items: Record<string, ItemData | null>;
}

export default function StatsSummary({ character, items }: StatsSummaryProps) {
  const base = getBaseStats(character.race, character.className);
  const bp = character.bonusPoints || { str: 0, sta: 0, agi: 0, dex: 0, wis: 0, int: 0, cha: 0 };
  const hasBonusPoints = character.bonusPoints != null;
  const maxBonus = getBonusPointsForClass(character.className);
  const usedBonus = bp.str + bp.sta + bp.agi + bp.dex + bp.wis + bp.int + bp.cha;

  const gear = {
    ac: 0, hp: 0, mana: 0,
    str: 0, sta: 0, agi: 0, dex: 0, wis: 0, int: 0, cha: 0,
    svFire: 0, svCold: 0, svDisease: 0, svMagic: 0, svPoison: 0,
  };

  for (const [, equipped] of Object.entries(character.equipment)) {
    if (!equipped) continue;
    const itemData = items[equipped.name];
    if (!itemData) continue;
    const s = itemData.stats;
    gear.ac += s.ac || 0;
    gear.hp += s.hp || 0;
    gear.mana += s.mana || 0;
    gear.str += s.str || 0;
    gear.sta += s.sta || 0;
    gear.agi += s.agi || 0;
    gear.dex += s.dex || 0;
    gear.wis += s.wis || 0;
    gear.int += s.int || 0;
    gear.cha += s.cha || 0;
    gear.svFire += s.svFire || 0;
    gear.svCold += s.svCold || 0;
    gear.svDisease += s.svDisease || 0;
    gear.svMagic += s.svMagic || 0;
    gear.svPoison += s.svPoison || 0;
  }

  function total(stat: "str" | "sta" | "agi" | "dex" | "wis" | "int" | "cha") {
    return base[stat] + bp[stat] + gear[stat];
  }

  const totalHp = calculateMaxHp(
    character.className,
    character.level,
    total("sta"),
    gear.hp,
  );

  const manaStat = getManaStat(character.className);
  const totalMana = calculateMaxMana(
    character.className,
    character.level,
    total("wis"),
    total("int"),
    gear.mana,
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h3 className="text-amber-300/80 text-sm font-bold uppercase tracking-wider mb-4 text-center">
        Character Stats
      </h3>
      {!hasBonusPoints && (
        <p className="text-zinc-600 text-[10px] text-center mb-3 italic">
          Creation bonus points not set ({maxBonus} pts available)
        </p>
      )}
      {hasBonusPoints && usedBonus < maxBonus && (
        <p className="text-amber-700/60 text-[10px] text-center mb-3 italic">
          {maxBonus - usedBonus} unspent creation bonus points
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Defense & Resources */}
        <div className="card-fantasy rounded-xl p-4">
          <div className="text-zinc-500 text-[10px] uppercase tracking-widest mb-3 font-bold">
            Defense &amp; Resources
          </div>
          <div className="space-y-2">
            <StatBar label="AC" value={gear.ac} max={300} color="from-blue-500 to-blue-400" gearOnly />
            <StatBar
              label="HP"
              value={totalHp}
              max={5000}
              color="from-green-500 to-emerald-400"
              sub={`${totalHp - gear.hp} base+${gear.hp} items`}
            />
            {manaStat ? (
              <StatBar
                label="Mana"
                value={totalMana}
                max={3000}
                color="from-blue-400 to-cyan-400"
                sub={`${totalMana - gear.mana} base+${gear.mana} items`}
              />
            ) : (
              <StatBar label="Mana" value={0} max={3000} color="from-blue-400 to-cyan-400" sub="N/A" />
            )}
          </div>
        </div>

        {/* Attributes */}
        <div className="card-fantasy rounded-xl p-4">
          <div className="text-zinc-500 text-[10px] uppercase tracking-widest mb-3 font-bold">
            Attributes
          </div>
          <div className="space-y-2">
            {(["str", "sta", "agi", "dex", "wis", "int", "cha"] as const).map((stat) => (
              <StatBar
                key={stat}
                label={stat.toUpperCase()}
                value={total(stat)}
                max={255}
                color="from-amber-500 to-amber-400"
                sub={`${base[stat]}${bp[stat] ? "+" + bp[stat] : ""}+${gear[stat]}`}
              />
            ))}
          </div>
        </div>

        {/* Resistances */}
        <div className="card-fantasy rounded-xl p-4">
          <div className="text-zinc-500 text-[10px] uppercase tracking-widest mb-3 font-bold">
            Resistances
          </div>
          <div className="space-y-2">
            <StatBar label="Fire" value={gear.svFire} max={100} color="from-red-500 to-orange-400" gearOnly />
            <StatBar label="Cold" value={gear.svCold} max={100} color="from-sky-500 to-cyan-400" gearOnly />
            <StatBar label="Disease" value={gear.svDisease} max={100} color="from-green-500 to-lime-400" gearOnly />
            <StatBar label="Magic" value={gear.svMagic} max={100} color="from-purple-500 to-violet-400" gearOnly />
            <StatBar label="Poison" value={gear.svPoison} max={100} color="from-lime-500 to-emerald-400" gearOnly />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBar({
  label,
  value,
  max,
  color,
  sub,
  gearOnly,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  sub?: string;
  gearOnly?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (Math.abs(value) / max) * 100));

  return (
    <div>
      <div className="flex justify-between items-center text-xs mb-0.5">
        <span className="text-zinc-400 text-[10px] uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-1.5">
          {sub && <span className="text-zinc-600 text-[9px]">({sub})</span>}
          <span className="text-amber-100 font-semibold text-[11px]">
            {gearOnly && value > 0 ? "+" : ""}{value}
          </span>
        </div>
      </div>
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
