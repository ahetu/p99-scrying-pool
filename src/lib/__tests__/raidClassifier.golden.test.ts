/**
 * Golden-set regression tests for raid classification.
 *
 * Every item here uses REAL data from item-database.json. When a
 * misclassification bug is fixed, add the offending item to this file
 * so it can never regress.
 *
 * To add a new item:
 *   1. Grep item-database.json for the item's exact name
 *   2. Copy its dropsfrom, dropmobs, relatedquests, and statsBlock
 *   3. Add an entry to MUST_BE_RAID or MUST_NOT_BE_RAID
 *   4. Run `npm test` to verify
 */

import { describe, it, expect } from "vitest";
import { isRaidItem } from "../raidClassifier";

interface GoldenItem {
  name: string;
  reason: string;
  dropsfrom: string | null;
  dropmobs: string[] | null;
  relatedquests: string[] | null;
  statsBlock: string | null;
}

// -------------------------------------------------------------------
// Items that MUST be classified as raid. If any of these return false,
// we've regressed — a raid item is leaking into non-raid upgrades.
// -------------------------------------------------------------------
const MUST_BE_RAID: GoldenItem[] = [
  {
    name: "Mask of the Silver Eyes",
    reason: "quest chain involves Dozekar the Cursed (raid NPC in relatedquests)",
    dropsfrom: null,
    dropmobs: null,
    relatedquests: [
      "Request of the Arcane", "Black Tear", "Dozekar the Cursed",
      "White Tear", "Dozekar the Cursed", "Runed Tear",
      "Dozekar the Cursed", "Glowing Drake Orb", "HOT Named)",
    ],
    statsBlock: "MAGIC ITEM  LORE ITEM  NO DROP<br>\nSlot: FACE<br>\nAC: 25<br>\nSTA: +12  WIS: +12  INT: +12  HP: +20  MANA: +80<br>\nSV FIRE: +5  SV DISEASE: +5  SV COLD: +5  SV MAGIC: +5  SV POISON: +5<br>\nEffect: [[Flowing Thought I]] (Worn)  <br>\nWT: 0.5  Size: TINY<br>\nClass: CLR DRU SHM NEC WIZ MAG ENC<br>\nRace: ALL<br>",
  },
  {
    name: "Sanctum Guardian's Earring",
    reason: "quest 'The Spirit of Garzicor' — Garzicor is a raid NPC",
    dropsfrom: null,
    dropmobs: null,
    relatedquests: ["The Spirit of Garzicor"],
    statsBlock: "MAGIC ITEM  LORE ITEM  NO DROP<br>\nSlot: EAR<br>\nAC: 5<br>\nSTR: +10  STA: +10  CHA: +10  HP: +50  MANA: +80<br>\nSV DISEASE: +15  SV POISON: +15<br>\nWT: 0.2  Size: TINY<br>\nClass: CLR DRU MNK SHM<br>\nRace: ALL<br>",
  },
  {
    name: "Crown of the Kromzek Kings",
    reason: "drops from King Tormax (raid NPC)",
    dropsfrom: "Kael Drakkel",
    dropmobs: ["King Tormax"],
    relatedquests: [
      "Custom Plate Helms - Kael Drakkel",
      "Custom Plate Helms - Skyshrine",
      "Custom Plate Helms - Thurgadin",
    ],
    statsBlock: "MAGIC ITEM  LORE ITEM  NO DROP<br>\nSlot: HEAD<br>\nAC: 35<br>\nSTR: +10  WIS: +10  INT: +10  HP: +100<br>\nSV FIRE: +10  SV DISEASE: +10  SV COLD: +10  SV MAGIC: +25  SV POISON: +10<br>\nEffect: [[Truesight]] (Worn)<br>\nWT: 1.0  Size: TINY<br>\nClass: ALL<br>\nRace: ALL<br>",
  },
  {
    name: "Cloak of Flames",
    reason: "dropmobs include Severilous, Lord Nagafen, Talendor (raid NPCs)",
    dropsfrom: "Burning Woods",
    dropmobs: ["Ixiblat Fer", "Severilous", "Lord Nagafen", "Zordakalicus Ragefire", "Talendor"],
    relatedquests: null,
    statsBlock: "MAGIC ITEM<br>\nSlot: BACK<br>\nAC: 10<br>\nDEX: +9  AGI: +9  HP: +50<br>\nSV FIRE: +15<br>\nHaste: +36%  <br>\nWT: 0.1  Size: MEDIUM<br>\nClass: ALL<br>\nRace: ALL<br>",
  },
  {
    name: "Blade of Carnage",
    reason: "drops from The Avatar of War (raid NPC)",
    dropsfrom: "Kael Drakkel",
    dropmobs: ["The Avatar of War"],
    relatedquests: null,
    statsBlock: "MAGIC ITEM  LORE ITEM  <br>\nSlot: PRIMARY SECONDARY<br>\nSkill: 1H Slashing  Atk Delay: 23<br>\nDMG: 15 <br>\nSTR: +15  DEX: +15  STA: +15  HP: +100<br>\nSV FIRE: +3  SV DISEASE: +3  SV COLD: +3  SV MAGIC: +3  SV POISON: +3<br>\nWT: 0.0  Size: TINY<br>\nClass: WAR PAL RNG SHD BRD<br>\nRace: ALL<br>",
  },
  {
    name: "Vyemm's Fang",
    reason: "drops from Temple of Veeshan (pure raid zone)",
    dropsfrom: "Temple of Veeshan",
    dropmobs: ["Lord Vyemm"],
    relatedquests: null,
    statsBlock: "MAGIC ITEM  LORE ITEM  NO DROP  <br>\nSlot: RANGE PRIMARY SECONDARY<br>\nSkill: Piercing  Atk Delay: 17<br>\nDMG: 13   AC: 35<br>\nSTR: +15  AGI: +15  HP: +50<br>\nSV FIRE: +5  SV DISEASE: +5  SV COLD: +5  SV MAGIC: +5  SV POISON: +5<br>\nWT: 0.0  Size: TINY<br>\nClass: SHD BRD ROG<br>\nRace: ALL<br>",
  },
  {
    name: "Nature Walkers Scimitar",
    reason: "Druid Epic Quest (raid quest)",
    dropsfrom: null,
    dropmobs: null,
    relatedquests: ["Druid Epic Quest"],
    statsBlock: "MAGIC ITEM  LORE ITEM  NO DROP<br>\nSlot: PRIMARY<br>\nSkill: 1H Slashing  Atk Delay: 30<br>\nDMG: 20 <br>\nSTR: +15  STA: +15  WIS: +20  HP: +10  MANA: +90<br>\nSV FIRE: +10  SV DISEASE: +10  SV COLD: +10  SV MAGIC: +10  SV POISON: +10<br>\nRequired level of 46.<br>\nEffect:  [[Wrath of Nature]] (Must Equip, Casting Time: 9.0) at Level 50<br>\nWT: 3.0  Size: MEDIUM<br>\nClass: DRU<br>\nRace: HUM ELF HEF HFL<br>",
  },
  {
    name: "Runed Bolster Belt",
    reason: "dropmobs include Gorenaire, Severilous, Lady Vox, Talendor, Faydedar (raid NPCs)",
    dropsfrom: "Dreadlands",
    dropmobs: ["Gorenaire", "Severilous", "Lady Vox", "Talendor", "Faydedar"],
    relatedquests: null,
    statsBlock: "MAGIC ITEM<br>\nSlot: WAIST<br>\nAC: 5<br>\nSTR: +10  DEX: +10  STA: +10<br>\nHaste: +31%  <br>\nWT: 0.1  Size: SMALL<br>\nClass: ALL<br>\nRace: ALL<br>",
  },
  {
    name: "Lodizal Shell Shield",
    reason: "quest involves Lodizal (raid NPC) — relatedquests has scraping artifact 'File:Lodishield.jpg'",
    dropsfrom: null,
    dropmobs: null,
    relatedquests: ["Lodizal Shell Shield Quest", "File:Lodishield.jpg"],
    statsBlock: "MAGIC ITEM  LORE ITEM  <br>\nSlot: BACK SECONDARY<br>\nAC: 23<br>\nSTR: +10  CHA: +5  WIS: +10  AGI: -5<br>\nSV FIRE: +20  SV COLD: +20  SV MAGIC: +10<br>\nEffect:  [[Enduring Breath]] (Worn)<br>\nWT: 5.0  Size: LARGE<br>\nClass: ALL except MNK NEC WIZ MAG ENC<br>\nRace: ALL<br>",
  },
  {
    name: "Crescent Blades of Luclin",
    reason: "dropmobs include Wuoshi (open-world raid dragon in Wakening Land)",
    dropsfrom: "The Wakening Land",
    dropmobs: ["Wuoshi"],
    relatedquests: null,
    statsBlock: "MAGIC ITEM  LORE ITEM  <br>\nSlot: PRIMARY SECONDARY<br>\nSkill: Piercing  Atk Delay: 18<br>\nDMG: 10 <br>\nSV MAGIC: +10<br>\nEffect:  [[Shadow]] (Combat, Casting Time: Instant) at Level 40<br>\nWT: 3.2  Size: MEDIUM<br>\nClass: WAR RNG SHD BRD ROG<br>\nRace: ALL<br>",
  },
  {
    name: "Tobrin's Mystical Eyepatch",
    reason: "dropmobs include Lady Vox, Talendor (raid NPCs)",
    dropsfrom: "Permafrost",
    dropmobs: ["Lady Vox", "Talendor"],
    relatedquests: null,
    statsBlock: "MAGIC ITEM<br>\nSlot: FACE<br>\nWIS: +15  INT: +15<br>\nEffect:  [[See Invisible]] (Worn)<br>\nWT: 0.1  Size: TINY<br>\nClass: ALL<br>\nRace: ALL<br>",
  },
];

// -------------------------------------------------------------------
// Items that MUST NOT be classified as raid. If any of these return
// true, we've regressed — a group item is being hidden from upgrades.
// -------------------------------------------------------------------
const MUST_NOT_BE_RAID: GoldenItem[] = [
  {
    name: "Netted Kelp Cap",
    reason: "Siren's Grotto group drop",
    dropsfrom: "Siren's Grotto",
    dropmobs: ["a neriad maiden", "a neriad mistress", "a neriad sea princess", "an enthralled molkor", "an enthralled ulthork"],
    relatedquests: null,
    statsBlock: "MAGIC ITEM  LORE ITEM<br>\nSlot: HEAD<br>\nAC: 5<br>\nSTR: +7  STA: +8  CHA: -2  INT: +5<br>\nSV FIRE: +3<br>\nWT: 0.3  Size: SMALL<br>\nClass: ALL<br>\nRace: ALL<br>",
  },
  {
    name: "Copper Coldain Insignia Ring",
    reason: "Coldain Ring #1 — group quest, not Ring War",
    dropsfrom: null,
    dropmobs: null,
    relatedquests: ["Coldain Ring #2: Silver Coldain Insignia Ring", "Coldain Ring #1: Copper Coldain Insignia Ring"],
    statsBlock: "MAGIC ITEM  LORE ITEM  NO DROP<br>\nSlot: FINGER<br>\nAC: 1<br>\nSTR: +1<br>\nSV MAGIC: +1<br>\nWT: 1.0  Size: MEDIUM<br>\nClass: ALL<br>\nRace: ALL<br>",
  },
  {
    name: "Sentry Helmet",
    reason: "Skyshrine group drop (Sentry Kale is not a raid NPC)",
    dropsfrom: "Skyshrine",
    dropmobs: ["Sentry Kale"],
    relatedquests: null,
    statsBlock: "MAGIC ITEM  LORE ITEM  NO DROP<br>\nSlot: HEAD<br>\nAC: 9<br>\nINT: +5  AGI: +5  HP: +15  MANA: +15<br>\nSV DISEASE: +4  SV POISON: +4<br>\nWT: 3.5  Size: MEDIUM<br>\nClass: WAR CLR PAL RNG SHD BRD ROG SHM<br>\nRace: ALL<br>",
  },
  {
    name: "Bracer of the Hidden",
    reason: "Lake of Ill Omen group drop",
    dropsfrom: "Lake of Ill Omen",
    dropmobs: ["a Sarnak legionnaire"],
    relatedquests: null,
    statsBlock: "MAGIC ITEM  LORE ITEM<br>\nSlot: WRIST<br>\nAC: 6<br>\nEffect:  [[See Invisible]] (Must Equip, Casting Time: Instant) at Level 10<br>\nWT: 2.0  Size: SMALL<br>\nClass: ALL<br>\nRace: ALL<br>",
  },
  {
    name: "Golden Efreeti Boots",
    reason: "Nagafen's Lair group mob (Efreeti Lord Djarn, not a raid NPC)",
    dropsfrom: "Nagafen's Lair",
    dropmobs: ["Efreeti Lord Djarn"],
    relatedquests: null,
    statsBlock: "MAGIC ITEM<br>\nSlot: FEET<br>\nAC: 5<br>\nWIS: +9  INT: +9<br>\nWT: 2.5  Size: MEDIUM<br>\nClass: ALL<br>\nRace: HUM BAR ERU ELF HIE DEF HEF DWF TRL OGR HFL GNM<br>",
  },
  {
    name: "Stein of Moggok",
    reason: "group quest reward (Exotic Drinks)",
    dropsfrom: null,
    dropmobs: null,
    relatedquests: ["Exotic Drinks"],
    statsBlock: "MAGIC ITEM  LORE ITEM<br>\nSlot: PRIMARY SECONDARY<br>\nCharges: 3<br>\nDEX: +5  INT: +10  HP: +10<br>\nSV DISEASE: +25<br>\nEffect:  [[Light Healing]] (Any Slot, Casting Time: Instant)<br>\nWT: 2.5  Size: SMALL<br>\nClass: ALL<br>\nRace: ALL<br>",
  },
  {
    name: "Wu's Fighting Gauntlets",
    reason: "no drop/quest data — group content",
    dropsfrom: null,
    dropmobs: null,
    relatedquests: null,
    statsBlock: "MAGIC ITEM  QUEST ITEM<br>\nSlot: HANDS<br>\nAC: 4<br>\nWT: 0.1  Size: SMALL<br>\nClass: MNK<br>\nRace: HUM BAR TRL OGR IKS<br>",
  },
  {
    name: "Hierophant's Cloak",
    reason: "Old Sebilis group named (Hierophant Prime Grekal)",
    dropsfrom: "Old Sebilis",
    dropmobs: ["Hierophant Prime Grekal"],
    relatedquests: null,
    statsBlock: "MAGIC ITEM  LORE ITEM<br>\nSlot: BACK<br>\nAC: 10<br>\nSTR: +4  DEX: +4  STA: +4  CHA: +4  WIS: +4  INT: +4  AGI: +4  HP: +75  MANA: +75<br>\nWT: 1.0  Size: MEDIUM<br>\nClass: ALL<br>\nRace: ALL<br>",
  },
  {
    name: "Breath of Harmony",
    reason: "Old Sebilis group drop (blood of chottal)",
    dropsfrom: "Old Sebilis",
    dropmobs: ["blood of chottal"],
    relatedquests: null,
    statsBlock: "MAGIC ITEM  LORE ITEM<br>\nSlot: PRIMARY<br>\nSkill: 1H Slashing  Atk Delay: 18<br>\nDMG: 10 <br>\nEffect:  [[Niv's Melody of Preservation]] (Must Equip, Casting Time: Instant) at Level 50<br>\nWT: 0.8  Size: MEDIUM<br>\nClass: BRD<br>\nRace: ALL<br>",
  },
  {
    name: "Holgresh Elder Beads",
    reason: "Wakening Land group drop",
    dropsfrom: "The Wakening Land",
    dropmobs: null,
    relatedquests: null,
    statsBlock: "LORE ITEM<br>\nSlot: NECK<br>\nSV FIRE: +1  SV COLD: +1  SV MAGIC: +2<br>\nEffect:  [[Eye of Zomm]] (Any Slot, Casting Time: 4.0)<br>\nWT: 0.2  Size: SMALL<br>\nClass: ALL<br>\nClass: NEC WIZ MAG ENC<br>",
  },
  {
    name: "Corroded Breastplate",
    reason: "Kael group drop — zero-stat quest turn-in, shares statsBlock with ToV items but is NOT raid",
    dropsfrom: "Kael Drakkel",
    dropmobs: ["a guardian of Zek", "Adjutant Brunkin", "Trooper Coldstone"],
    relatedquests: [
      "Bard Thurgadin Breastplate", "Cleric Thurgadin Breastplate",
      "Paladin Thurgadin Breastplate", "Shadowknight Thurgadin Breastplate",
      "Warrior Thurgadin Breastplate",
    ],
    statsBlock: "MAGIC ITEM  LORE ITEM  NO DROP<br>\nSlot: CHEST<br>\nWT: 15.0  Size: TINY<br>\nClass: WAR CLR PAL SHD BRD<br>\nRace: ALL<br>",
  },
  {
    name: "Torn Enchanted Silk Robe",
    reason: "Kael group drop — zero-stat quest turn-in, must not be caught by stat-twin",
    dropsfrom: "Kael Drakkel",
    dropmobs: ["a guardian of Zek", "Adjutant Brunkin", "Trooper Coldstone"],
    relatedquests: [
      "Enchanter Thurgadin Armor Quests", "Wizard Thurgadin Armor Quests",
      "Magician Thurgadin Armor Quests", "Necromancer Thurgadin Armor Quests",
    ],
    statsBlock: "MAGIC ITEM  LORE ITEM  NO DROP<br>\nSlot: CHEST<br>\nWT: 5.0  Size: TINY<br>\nClass: NEC WIZ MAG ENC<br>\nRace: ALL<br>",
  },
  {
    name: "Silver Earring",
    reason: "Blackburrow group drop — generic jewelry must not match raid twin index",
    dropsfrom: "Blackburrow",
    dropmobs: ["a gnoll shaman", "Sergeant Slate"],
    relatedquests: ["A Job for Nanrum"],
    statsBlock: "Slot: EAR<br>\nWT: 0.1  Size: TINY<br>\nClass: ALL<br>\nRace: ALL<br>",
  },
];

// -------------------------------------------------------------------
// Test runner
// -------------------------------------------------------------------
describe("raid classifier golden set", () => {
  describe("items that MUST be classified as raid", () => {
    for (const item of MUST_BE_RAID) {
      it(`${item.name} — ${item.reason}`, () => {
        expect(
          isRaidItem(item.dropsfrom, item.dropmobs, item.relatedquests, item.statsBlock),
        ).toBe(true);
      });
    }
  });

  describe("items that MUST NOT be classified as raid", () => {
    for (const item of MUST_NOT_BE_RAID) {
      it(`${item.name} — ${item.reason}`, () => {
        expect(
          isRaidItem(item.dropsfrom, item.dropmobs, item.relatedquests, item.statsBlock),
        ).toBe(false);
      });
    }
  });
});
