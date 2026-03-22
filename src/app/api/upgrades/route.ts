import { NextRequest, NextResponse } from "next/server";
import { getItemByName, isDatabaseLoaded } from "@/lib/itemDatabase";
import { getUpgradesForSlot } from "@/lib/upgradeEngine";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const slot = searchParams.get("slot");
  const className = searchParams.get("class");
  const race = searchParams.get("race");
  const currentItemName = searchParams.get("currentItem");
  const loreItemsParam = searchParams.get("loreItems");
  const currentHasteParam = searchParams.get("currentHaste");
  const role = searchParams.get("role") ?? undefined;

  if (!slot || !className || !race) {
    return NextResponse.json(
      { error: "Missing required params: slot, class, race" },
      { status: 400 }
    );
  }

  if (!isDatabaseLoaded()) {
    return NextResponse.json(
      { upgrades: [], currentScore: 0, total: 0, dbAvailable: false }
    );
  }

  const currentItem = currentItemName ? getItemByName(currentItemName) : null;

  const equippedLoreItems = new Set<string>();
  if (loreItemsParam) {
    for (const name of loreItemsParam.split("|")) {
      if (name.trim()) equippedLoreItems.add(name.trim().toLowerCase());
    }
  }

  const currentEquippedHaste = currentHasteParam ? parseInt(currentHasteParam, 10) || 0 : 0;

  const { upgrades, currentScore } = getUpgradesForSlot(
    slot,
    className,
    race,
    currentItem,
    equippedLoreItems,
    currentEquippedHaste,
    role
  );

  return NextResponse.json({
    upgrades,
    currentScore,
    total: upgrades.length,
    dbAvailable: true,
  });
}
