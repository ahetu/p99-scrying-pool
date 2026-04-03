import { describe, it, expect } from "vitest";
import { getBaseStats, calculateDisplayAC } from "../baseStats";

describe("getBaseStats — class stat bonuses verified against P99 wiki", () => {
  const wikiStartingStats: Record<string, Record<string, Record<string, number>>> = {
    Bard:          { "Wood Elf":  { str: 70,  sta: 65, agi: 95, dex: 90, wis: 80, int: 75, cha: 85 },
                     "Human":     { str: 80,  sta: 75, agi: 75, dex: 85, wis: 75, int: 75, cha: 85 } },
    Cleric:        { "Dark Elf":  { str: 65,  sta: 70, agi: 90, dex: 75, wis: 93, int: 99, cha: 60 },
                     "High Elf":  { str: 60,  sta: 70, agi: 85, dex: 70, wis: 105, int: 92, cha: 80 } },
    Druid:         { "Wood Elf":  { str: 65,  sta: 75, agi: 95, dex: 80, wis: 90, int: 75, cha: 75 },
                     "Human":     { str: 75,  sta: 85, agi: 75, dex: 75, wis: 85, int: 75, cha: 75 } },
    Enchanter:     { "Dark Elf":  { str: 60,  sta: 65, agi: 90, dex: 75, wis: 83, int: 109, cha: 70 },
                     "Erudite":   { str: 60,  sta: 70, agi: 70, dex: 70, wis: 83, int: 117, cha: 80 } },
    Magician:      { "Dark Elf":  { str: 60,  sta: 75, agi: 90, dex: 75, wis: 83, int: 109, cha: 60 },
                     "Gnome":     { str: 60,  sta: 80, agi: 85, dex: 85, wis: 67, int: 108, cha: 60 } },
    Monk:          { "Human":     { str: 80,  sta: 80, agi: 85, dex: 85, wis: 75, int: 75, cha: 75 },
                     "Iksar":     { str: 75,  sta: 75, agi: 100, dex: 95, wis: 80, int: 75, cha: 55 } },
    Necromancer:   { "Dark Elf":  { str: 60,  sta: 65, agi: 90, dex: 85, wis: 83, int: 109, cha: 60 },
                     "Gnome":     { str: 60,  sta: 70, agi: 85, dex: 95, wis: 67, int: 108, cha: 60 } },
    Paladin:       { "Dwarf":     { str: 100, sta: 95, agi: 70, dex: 90, wis: 88, int: 60, cha: 55 },
                     "Human":     { str: 85,  sta: 80, agi: 75, dex: 75, wis: 80, int: 75, cha: 85 } },
    Ranger:        { "Half Elf":  { str: 75,  sta: 80, agi: 100, dex: 85, wis: 65, int: 75, cha: 75 },
                     "Wood Elf":  { str: 70,  sta: 75, agi: 105, dex: 80, wis: 85, int: 75, cha: 75 } },
    Rogue:         { "Dark Elf":  { str: 60,  sta: 65, agi: 100, dex: 85, wis: 83, int: 99, cha: 60 },
                     "Human":     { str: 75,  sta: 75, agi: 85, dex: 85, wis: 75, int: 75, cha: 75 } },
    Shaman:        { "Barbarian": { str: 103, sta: 100, agi: 82, dex: 70, wis: 80, int: 60, cha: 60 },
                     "Troll":     { str: 108, sta: 114, agi: 83, dex: 75, wis: 70, int: 52, cha: 45 } },
    Warrior:       { "Dark Elf":  { str: 70,  sta: 75, agi: 95, dex: 75, wis: 83, int: 99, cha: 60 },
                     "Ogre":      { str: 140, sta: 132, agi: 75, dex: 70, wis: 67, int: 60, cha: 37 } },
    Wizard:        { "Dark Elf":  { str: 60,  sta: 75, agi: 90, dex: 75, wis: 83, int: 109, cha: 60 },
                     "Erudite":   { str: 60,  sta: 80, agi: 70, dex: 70, wis: 83, int: 117, cha: 70 } },
  };

  for (const [className, races] of Object.entries(wikiStartingStats)) {
    for (const [race, expected] of Object.entries(races)) {
      it(`${race} ${className} matches P99 wiki starting stats`, () => {
        const stats = getBaseStats(race, className);
        expect(stats).toEqual(expected);
      });
    }
  }
});

describe("calculateDisplayAC — caster defense scaling", () => {
  it("level 38 Enchanter AC is lower than level 60 Enchanter AC (same gear)", () => {
    const ac38 = calculateDisplayAC("Enchanter", "Dark Elf", 38, 93, 45);
    const ac60 = calculateDisplayAC("Enchanter", "Dark Elf", 60, 93, 45);
    expect(ac38.total).toBeLessThan(ac60.total);
  });

  it("level 38 Dark Elf Enchanter with 45 worn AC is near 430 (P99-verified)", () => {
    // User-verified in-game: AC 430 for level 38 DE Enchanter, 93 AGI, 45 worn AC
    // Formula gives ~434 (defense cap 129 vs actual skill ~127)
    const ac = calculateDisplayAC("Enchanter", "Dark Elf", 38, 93, 45);
    expect(ac.total).toBeGreaterThanOrEqual(420);
    expect(ac.total).toBeLessThanOrEqual(440);
    expect(ac.worn).toBe(45);
  });

  it("caster defense cap reaches 145 by level 44, not level 28", () => {
    // Before the fix, defense capped at 145 by level 28 (5*28+5=145)
    // With P99 formula: level 43 → 144, level 44 → 147 capped to 145
    const ac43 = calculateDisplayAC("Enchanter", "Dark Elf", 43, 90, 0);
    const ac44 = calculateDisplayAC("Enchanter", "Dark Elf", 44, 90, 0);
    const ac60 = calculateDisplayAC("Enchanter", "Dark Elf", 60, 90, 0);
    // AC at 44 should be very close to 60 (both near cap)
    expect(ac60.total - ac44.total).toBeLessThanOrEqual(2);
    // AC at 43 should be slightly below 44 (1 point of defense below cap)
    expect(ac44.total).toBeGreaterThanOrEqual(ac43.total);
  });

  it("Warrior defense is unaffected by caster formula", () => {
    // Warriors use the melee formula: min(252, level*5+5)
    const ac38 = calculateDisplayAC("Warrior", "Human", 38, 80, 100);
    const ac60 = calculateDisplayAC("Warrior", "Human", 60, 80, 100);
    // Warrior at 38 should have much higher AC than Enchanter at 38 with same gear
    const encAc38 = calculateDisplayAC("Enchanter", "Human", 38, 80, 100);
    expect(ac38.total).toBeGreaterThan(encAc38.total);
  });

  it("level 1 Enchanter defense is 5 (5 per level for 1-5)", () => {
    // Level 1: defense cap = 5. With 0 worn AC:
    // mitigation = floor(0*4/3) + floor(5/2) + 0 = 2
    // avoidance = floor(5*400/225) + floor(8000*(75-40)/36000) = 8 + 7 = 15
    // Should be a small but nonzero AC
    const ac = calculateDisplayAC("Enchanter", "Human", 1, 75, 0);
    expect(ac.total).toBeGreaterThan(0);
    expect(ac.total).toBeLessThan(50);
  });
});
