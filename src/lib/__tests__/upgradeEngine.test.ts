import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ItemData, ParsedStats } from "../types";

function makeStats(overrides: Partial<ParsedStats> = {}): ParsedStats {
  return {
    magic: false, lore: false, noDrop: false, noRent: false,
    expendable: false, quest: false,
    slots: ["FINGERS"], skill: null,
    damage: null, delay: null, ratio: null,
    ac: null, hp: null, mana: null,
    str: null, sta: null, dex: null, agi: null,
    wis: null, int: null, cha: null,
    svFire: null, svCold: null, svDisease: null,
    svMagic: null, svPoison: null,
    haste: null, effect: null, effectType: null,
    weight: null, size: null,
    classes: ["ALL"], races: ["ALL"],
    ...overrides,
  };
}

function makeItem(name: string, overrides: Partial<ItemData> = {}): ItemData {
  return {
    name,
    lucyImgId: null,
    statsBlock: "",
    dropsfrom: "Some Zone",
    dropmobs: ["some mob"],
    relatedquests: null,
    soldby: false,
    crafted: false,
    stats: makeStats({ hp: 10 }),
    wikiUrl: `https://p99wiki.eqgeeks.org/${name.replace(/ /g, "_")}`,
    fetchedAt: new Date().toISOString(),
    ...overrides,
  };
}

vi.mock("../itemDatabase", () => ({
  getFilteredItemsForSlot: vi.fn(() => []),
}));

vi.mock("../raidClassifier", () => ({
  isRaidItem: vi.fn(() => false),
}));

import { getUpgradesForSlot, scoreItem } from "../upgradeEngine";
import { getFilteredItemsForSlot } from "../itemDatabase";
import { isRaidItem } from "../raidClassifier";

const mockGetFiltered = vi.mocked(getFilteredItemsForSlot);
const mockIsRaid = vi.mocked(isRaidItem);

beforeEach(() => {
  vi.clearAllMocks();
  mockIsRaid.mockReturnValue(false);
});

describe("upgradeEngine filters", () => {
  // -------------------------------------------------------
  // Temporary / NO RENT items must be excluded.
  // Prevents summoned/session-only items from appearing.
  // -------------------------------------------------------
  describe("noRent (temporary) items are excluded", () => {
    it("filters out items with noRent: true", () => {
      const temporaryItem = makeItem("Shaded Torch", {
        stats: makeStats({ noRent: true, hp: 50 }),
      });

      mockGetFiltered.mockReturnValue([temporaryItem]);

      const { upgrades } = getUpgradesForSlot(
        "primary", "Monk", "Human", null, new Set(), 0
      );

      expect(upgrades).toHaveLength(0);
    });

    it("keeps items with noRent: false", () => {
      const normalItem = makeItem("Normal Ring", {
        stats: makeStats({ noRent: false, hp: 10 }),
      });

      mockGetFiltered.mockReturnValue([normalItem]);

      const { upgrades } = getUpgradesForSlot(
        "finger1", "Monk", "Human", null, new Set(), 0
      );

      expect(upgrades).toHaveLength(1);
    });

    it("filters out items with TEMPORARY in raw statsBlock even if noRent is false", () => {
      const staleItem = makeItem("Summoned: Hammer of Wrath", {
        statsBlock: "MAGIC ITEM  TEMPORARY\nSlot: PRIMARY\nWT: 0.1",
        stats: makeStats({ noRent: false, hp: 30 }),
      });

      mockGetFiltered.mockReturnValue([staleItem]);

      const { upgrades } = getUpgradesForSlot(
        "primary", "Warrior", "Human", null, new Set(), 0
      );

      expect(upgrades).toHaveLength(0);
    });

    it("filters out items with NO RENT in raw statsBlock even if noRent is false", () => {
      const staleItem = makeItem("Some NoRent Item", {
        statsBlock: "MAGIC ITEM  NO RENT\nSlot: FINGERS\nWT: 0.5",
        stats: makeStats({ noRent: false, hp: 20 }),
      });

      mockGetFiltered.mockReturnValue([staleItem]);

      const { upgrades } = getUpgradesForSlot(
        "finger1", "Warrior", "Human", null, new Set(), 0
      );

      expect(upgrades).toHaveLength(0);
    });
  });

  // -------------------------------------------------------
  // Source filtering: items must have at least one of
  // dropsfrom, dropmobs, relatedquests, soldby, or crafted.
  // Crafted/sold items pass; phantom items are excluded.
  // -------------------------------------------------------
  describe("source-based filtering", () => {
    it("includes crafted items even with no drop/quest source", () => {
      const craftedItem = makeItem("Platinum Star Ruby Veil", {
        dropsfrom: null,
        dropmobs: null,
        relatedquests: null,
        crafted: true,
        stats: makeStats({ dex: 9, cha: 9 }),
      });

      mockGetFiltered.mockReturnValue([craftedItem]);

      const { upgrades } = getUpgradesForSlot(
        "face", "Enchanter", "Dark Elf", null, new Set(), 0
      );

      expect(upgrades).toHaveLength(1);
      expect(upgrades[0].name).toBe("Platinum Star Ruby Veil");
      expect(upgrades[0].crafted).toBe(true);
    });

    it("includes merchant-sold items even with no drop/quest source", () => {
      const soldItem = makeItem("Vendor Ring", {
        dropsfrom: null,
        dropmobs: null,
        relatedquests: null,
        soldby: true,
        stats: makeStats({ hp: 10 }),
      });

      mockGetFiltered.mockReturnValue([soldItem]);

      const { upgrades } = getUpgradesForSlot(
        "finger1", "Warrior", "Human", null, new Set(), 0
      );

      expect(upgrades).toHaveLength(1);
    });

    it("excludes phantom items with no source at all", () => {
      const phantomItem = makeItem("Priceless Velium Knuckledusters", {
        dropsfrom: null,
        dropmobs: null,
        relatedquests: null,
        soldby: false,
        crafted: false,
        stats: makeStats({ hp: 25, str: 5, dex: 5 }),
      });

      mockGetFiltered.mockReturnValue([phantomItem]);

      const { upgrades } = getUpgradesForSlot(
        "primary", "Monk", "Human", null, new Set(), 0
      );

      expect(upgrades).toHaveLength(0);
    });

    it("keeps items with a drop zone", () => {
      const droppableItem = makeItem("Droppable Ring", {
        dropsfrom: "Nagafen's Lair",
        dropmobs: null,
        relatedquests: null,
        stats: makeStats({ hp: 10 }),
      });

      mockGetFiltered.mockReturnValue([droppableItem]);

      const { upgrades } = getUpgradesForSlot(
        "finger1", "Warrior", "Human", null, new Set(), 0
      );

      expect(upgrades).toHaveLength(1);
    });
  });

  // -------------------------------------------------------
  // Upgrade count must reflect only items that actually
  // score higher than the currently equipped item.
  // -------------------------------------------------------
  describe("upgrade count accuracy", () => {
    it("only includes items scoring at least 1.0 above current", () => {
      const betterItem = makeItem("Better Ring", {
        stats: makeStats({ hp: 100, ac: 20 }),
      });
      const sidegrade = makeItem("Sidegrade Ring", {
        stats: makeStats({ hp: 15, ac: 5, dex: 1 }),
      });

      const currentItem = makeItem("Equipped Ring", {
        stats: makeStats({ hp: 15, ac: 5 }),
      });

      mockGetFiltered.mockReturnValue([betterItem, sidegrade]);

      const { upgrades } = getUpgradesForSlot(
        "finger1", "Warrior", "Human", currentItem, new Set(), 0
      );

      expect(upgrades).toHaveLength(1);
      expect(upgrades[0].name).toBe("Better Ring");
    });
  });
});

describe("parseStatsBlock noRent detection", () => {
  it("detects TEMPORARY as noRent", async () => {
    const { parseStatsBlock } = await import("../parseStatsBlock");
    const stats = parseStatsBlock("MAGIC ITEM  TEMPORARY\nSlot: PRIMARY\nWT: 0.1  Size: SMALL\nClass: ALL\nRace: ALL");
    expect(stats.noRent).toBe(true);
  });

  it("detects NO RENT as noRent", async () => {
    const { parseStatsBlock } = await import("../parseStatsBlock");
    const stats = parseStatsBlock("MAGIC ITEM  NO RENT\nSlot: PRIMARY\nWT: 0.1  Size: SMALL\nClass: ALL\nRace: ALL");
    expect(stats.noRent).toBe(true);
  });

  it("normal items are not noRent", async () => {
    const { parseStatsBlock } = await import("../parseStatsBlock");
    const stats = parseStatsBlock("MAGIC ITEM  LORE ITEM\nSlot: PRIMARY\nWT: 0.1  Size: SMALL\nClass: ALL\nRace: ALL");
    expect(stats.noRent).toBe(false);
  });
});
