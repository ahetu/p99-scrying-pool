import { describe, it, expect } from "vitest";
import { isRaidItem } from "../raidClassifier";

describe("raidClassifier", () => {
  // -------------------------------------------------------
  // Hybrid zones: items from group mobs in mixed zones must
  // NOT be flagged as raid. Raid mobs there are caught by
  // RAID_NPCS instead.
  // -------------------------------------------------------
  describe("hybrid zones are not treated as fully-raid", () => {
    it("Nagafen's Lair group drop is not raid", () => {
      expect(isRaidItem("Nagafen's Lair", ["Efreeti Lord Djarn"], null)).toBe(false);
    });

    it("Permafrost group drop is not raid", () => {
      expect(isRaidItem("Permafrost", ["a goblin wizard"], null)).toBe(false);
    });

    it("Western Wastes group drop is not raid", () => {
      expect(isRaidItem("Western Wastes", ["a Chetari guard"], null)).toBe(false);
    });

    it("Dragon Necropolis group drop is not raid", () => {
      expect(isRaidItem("Dragon Necropolis", ["a Chetari hunter"], null)).toBe(false);
    });

    it("Icewell Keep group drop (Royal Guards) is not raid", () => {
      expect(isRaidItem("Icewell Keep", ["Royal Guardsman Braxis"], null)).toBe(false);
    });
  });

  // -------------------------------------------------------
  // Purely-raid zones: everything from these zones is raid.
  // -------------------------------------------------------
  describe("purely-raid zones are correctly flagged", () => {
    const raidZones = [
      "Temple of Veeshan",
      "Plane of Hate",
      "Plane of Fear",
      "Plane of Sky",
      "Plane of Growth",
      "Plane of Mischief",
      "Veeshan's Peak",
      "Sleeper's Tomb",
      "Kerafyrm's Lair",
    ];

    for (const zone of raidZones) {
      it(`${zone} drop is raid`, () => {
        expect(isRaidItem(zone, null, null)).toBe(true);
      });
    }
  });

  // -------------------------------------------------------
  // Raid NPC detection with name normalization.
  // -------------------------------------------------------
  describe("mob name normalization", () => {
    it("catches 'The Statue of Rallos Zek' (leading article)", () => {
      expect(isRaidItem(null, ["The Statue of Rallos Zek"], null)).toBe(true);
    });

    it("catches 'Lord Nagafen' without prefix issues", () => {
      expect(isRaidItem("Nagafen's Lair", ["Lord Nagafen"], null)).toBe(true);
    });

    it("catches 'Lady Vox' in a mixed zone", () => {
      expect(isRaidItem("Permafrost", ["Lady Vox"], null)).toBe(true);
    });

    it("catches 'Cazic Thule (God)' with parenthetical suffix", () => {
      expect(isRaidItem(null, ["Cazic Thule (God)"], null)).toBe(true);
    });

    it("does not flag a random group mob", () => {
      expect(isRaidItem(null, ["a gnoll guard"], null)).toBe(false);
    });

    it("catches Garzicor as a raid NPC (Spirit of Garzicor quest)", () => {
      expect(isRaidItem(null, null, ["The Spirit of Garzicor"])).toBe(true);
    });

    it("catches Dain Frostreaver IV from Icewell Keep", () => {
      expect(isRaidItem("Icewell Keep", ["Dain Frostreaver IV"], null)).toBe(true);
    });
  });

  // -------------------------------------------------------
  // Quest-based classification: ALL quests must be raid for
  // the item to be classified as raid. Prevents false
  // positives when an item is used in a raid quest chain but
  // obtained from group content.
  // -------------------------------------------------------
  describe("quest-based classification uses ALL-must-be-raid logic", () => {
    it("item with only raid quests is raid", () => {
      expect(isRaidItem(null, null, ["Warrior Epic Quest"])).toBe(true);
    });

    it("item with mix of raid and non-raid quests is NOT raid", () => {
      expect(
        isRaidItem(null, null, [
          "Di'Zok Signet of Service Quest",
          "Regal Band of Bathezid Quest",
          "Spirit Wracked Cord Quest",
        ])
      ).toBe(false);
    });

    it("item with no quests is not raid (via quests)", () => {
      expect(isRaidItem(null, null, [])).toBe(false);
    });

    it("item with null quests is not raid", () => {
      expect(isRaidItem(null, null, null)).toBe(false);
    });
  });

  // -------------------------------------------------------
  // Coldain Ring quest chain: only Ring #10 (the Ring War)
  // is raid. Rings 1-9 are group content.
  // -------------------------------------------------------
  describe("Coldain Ring quest chain classification", () => {
    it("Copper Coldain Insignia Ring (#1) is NOT raid", () => {
      expect(isRaidItem(null, null, [
        "Coldain Ring #2: Silver Coldain Insignia Ring",
        "Coldain Ring #1: Copper Coldain Insignia Ring",
      ])).toBe(false);
    });

    it("Velium Coldain Insignia Ring (#8) is NOT raid", () => {
      expect(isRaidItem(null, null, [
        "Coldain Ring #9: Coldain Hero's Insignia Ring",
        "Coldain Ring #8: Velium Coldain Insignia Ring",
      ])).toBe(false);
    });

    it("Coldain Hero's Insignia Ring (#9) is NOT raid (mixed with #10)", () => {
      expect(isRaidItem(null, null, [
        "Coldain Ring #10: Ring of Dain Frostreaver IV",
        "Coldain Ring #9: Coldain Hero's Insignia Ring",
      ])).toBe(false);
    });

    it("Ring of Dain Frostreaver IV (#10) IS raid", () => {
      expect(isRaidItem(null, null, [
        "Coldain Ring #10: Ring of Dain Frostreaver IV",
      ])).toBe(true);
    });
  });

  // -------------------------------------------------------
  // Zone string normalization (handles wiki markup).
  // -------------------------------------------------------
  describe("zone string normalization", () => {
    it("strips leading [[ from zone names", () => {
      expect(isRaidItem("[[Temple of Veeshan", null, null)).toBe(true);
    });

    it("strips trailing <br> from zone names", () => {
      expect(isRaidItem("Plane of Hate<br>", null, null)).toBe(true);
    });
  });
});
