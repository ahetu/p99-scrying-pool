"use client";

import { useState } from "react";
import { Character, ItemData, BonusPointAllocation } from "@/lib/types";
import { getBaseStats, getBonusPointsForClass, calculateMaxMana, calculateMaxHp, getManaStat, calculateDisplayAC, getBaseResists, getClassResistBonuses } from "@/lib/baseStats";

interface StatsSummaryProps {
  character: Character;
  items: Record<string, ItemData | null>;
}

const EMPTY_BP: BonusPointAllocation = { str: 0, sta: 0, agi: 0, dex: 0, wis: 0, int: 0, cha: 0 };

export default function StatsSummary({ character, items }: StatsSummaryProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [liveBp, setLiveBp] = useState<BonusPointAllocation>(character.bonusPoints || EMPTY_BP);
  const [editBp, setEditBp] = useState<BonusPointAllocation>(liveBp);
  const [editRaw, setEditRaw] = useState<Record<string, string>>({});

  const base = getBaseStats(character.race, character.className);
  const bp = editing ? editBp : liveBp;
  const hasBonusPoints = !editing && (character.bonusPoints != null || liveBp !== EMPTY_BP);
  const maxBonus = getBonusPointsForClass(character.className);
  const usedBonus = bp.str + bp.sta + bp.agi + bp.dex + bp.wis + bp.int + bp.cha;

  function startEditing() {
    setEditBp({ ...liveBp });
    setEditRaw({});
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  function updateEditPoint(stat: keyof BonusPointAllocation, value: number) {
    const clamped = Math.max(0, value);
    const otherUsed = usedBonus - editBp[stat];
    const maxForStat = maxBonus - otherUsed;
    setEditBp((prev) => ({ ...prev, [stat]: Math.min(clamped, maxForStat) }));
  }

  async function saveEdits() {
    setSaving(true);
    try {
      const res = await fetch(`/api/character/${character.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bonusPoints: editBp }),
      });
      if (res.ok) {
        setLiveBp(editBp);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

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
    if (!s) continue;
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

  const ac = calculateDisplayAC(
    character.className,
    character.race,
    character.level,
    total("agi"),
    gear.ac,
  );

  const manaStat = getManaStat(character.className);
  const totalMana = calculateMaxMana(
    character.className,
    character.level,
    total("wis"),
    total("int"),
    gear.mana,
  );

  const racialResists = getBaseResists(character.race);
  const classResists = getClassResistBonuses(character.className, character.level);

  const resists = {
    fire:    { racial: racialResists.fr, classBonus: classResists.fr, gear: gear.svFire },
    cold:    { racial: racialResists.cr, classBonus: classResists.cr, gear: gear.svCold },
    disease: { racial: racialResists.dr, classBonus: classResists.dr, gear: gear.svDisease },
    magic:   { racial: racialResists.mr, classBonus: classResists.mr, gear: gear.svMagic },
    poison:  { racial: racialResists.pr, classBonus: classResists.pr, gear: gear.svPoison },
  };

  const remainingBonus = maxBonus - usedBonus;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-center gap-3 mb-4">
        <h3 className="text-amber-300/80 text-sm font-bold uppercase tracking-wider">
          Character Stats
        </h3>
        {!editing && (
          <button
            onClick={startEditing}
            className="text-zinc-600 hover:text-amber-400 transition-colors text-[10px] uppercase tracking-wide"
          >
            Edit Points
          </button>
        )}
      </div>

      {editing && (
        <div className="bg-zinc-900/60 border border-amber-900/20 rounded-lg p-4 mb-4" style={{ animation: "fadeIn 0.2s ease-out" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-zinc-400 text-[10px]">
              Allocate your {maxBonus} creation bonus points
              <span className={`ml-2 font-bold ${remainingBonus < 0 ? "text-red-400" : remainingBonus === 0 ? "text-green-400" : "text-amber-400"}`}>
                {remainingBonus} remaining
              </span>
            </p>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-3">
            {(["str", "sta", "agi", "dex", "wis", "int", "cha"] as const).map((stat) => {
              const display = stat in editRaw ? editRaw[stat] : String(editBp[stat]);
              return (
                <div key={stat} className="text-center">
                  <label className="text-zinc-500 text-[9px] uppercase tracking-wide block mb-1">{stat}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={display}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setEditRaw((prev) => ({ ...prev, [stat]: raw }));
                      if (raw !== "") {
                        updateEditPoint(stat, parseInt(raw, 10));
                      }
                    }}
                    onBlur={() => {
                      if (editRaw[stat] === "") {
                        updateEditPoint(stat, 0);
                      }
                      setEditRaw((prev) => {
                        const next = { ...prev };
                        delete next[stat];
                        return next;
                      });
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700/50 rounded px-1 py-1.5 text-amber-200 text-center text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/50 [appearance:textfield]"
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={cancelEditing}
              className="text-zinc-500 hover:text-zinc-300 text-xs px-3 py-1 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveEdits}
              disabled={saving || remainingBonus < 0}
              className="bg-amber-600/80 hover:bg-amber-600 disabled:opacity-40 text-zinc-950 text-xs font-bold px-4 py-1 rounded transition-colors"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {!editing && !hasBonusPoints && (
        <button
          onClick={() => setEditing(true)}
          className="w-full mb-4 py-2.5 px-4 rounded-lg border border-amber-600/30 bg-amber-900/15 hover:bg-amber-900/30 hover:border-amber-500/50 transition-all cursor-pointer text-center"
        >
          <p className="text-amber-400/90 text-xs font-semibold flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-amber-500/80 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            Set Creation Bonus Points
          </p>
          <p className="text-zinc-500 text-[10px] mt-0.5">
            {maxBonus} points available — stats may be inaccurate without these
          </p>
        </button>
      )}
      {!editing && hasBonusPoints && usedBonus < maxBonus && (
        <button
          onClick={() => setEditing(true)}
          className="w-full mb-4 py-2 px-4 rounded-lg border border-amber-700/20 bg-amber-900/10 hover:bg-amber-900/20 hover:border-amber-600/30 transition-all cursor-pointer text-center"
        >
          <p className="text-amber-500/70 text-[10px]">
            {maxBonus - usedBonus} unspent creation bonus points
          </p>
        </button>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Defense & Resources */}
        <div className="card-fantasy rounded-xl p-4">
          <div className="text-zinc-500 text-[10px] uppercase tracking-widest mb-3 font-bold">
            Defense &amp; Resources
          </div>
          <div className="space-y-2">
            <StatBar
              label="AC"
              value={ac.total}
              max={1200}
              color="from-blue-500 to-blue-400"
              sub={`${ac.worn} worn AC`}
            />
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
            {([
              { label: "Magic",   r: resists.magic,   color: "from-purple-500 to-violet-400" },
              { label: "Fire",    r: resists.fire,     color: "from-red-500 to-orange-400" },
              { label: "Cold",    r: resists.cold,     color: "from-sky-500 to-cyan-400" },
              { label: "Poison",  r: resists.poison,   color: "from-lime-500 to-emerald-400" },
              { label: "Disease", r: resists.disease,   color: "from-green-500 to-lime-400" },
            ] as const).map(({ label, r, color }) => {
              const total = r.racial + r.classBonus + r.gear;
              const parts = [`${r.racial}`];
              if (r.classBonus > 0) parts.push(`+${r.classBonus} class`);
              if (r.gear !== 0) parts.push(`${r.gear > 0 ? "+" : ""}${r.gear} gear`);
              return (
                <StatBar
                  key={label}
                  label={label}
                  value={total}
                  max={200}
                  color={color}
                  sub={parts.join(" ")}
                />
              );
            })}
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
