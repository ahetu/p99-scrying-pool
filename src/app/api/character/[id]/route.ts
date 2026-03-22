import { NextRequest, NextResponse } from "next/server";
import { getCharacter, updateCharacter } from "@/lib/storage";
import { getItemByNameWithFallback } from "@/lib/itemDatabase";
import { ItemData, BonusPointAllocation } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const character = await getCharacter(id);

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const items: Record<string, ItemData | null> = {};
  for (const [, equippedItem] of Object.entries(character.equipment)) {
    if (equippedItem && !items[equippedItem.name]) {
      items[equippedItem.name] = await getItemByNameWithFallback(equippedItem.name);
    }
  }

  return NextResponse.json({ character, items });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const bp = body.bonusPoints as BonusPointAllocation | undefined;

  if (!bp) {
    return NextResponse.json({ error: "Missing bonusPoints" }, { status: 400 });
  }

  const updated = await updateCharacter(id, { bonusPoints: bp });
  if (!updated) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  return NextResponse.json({ character: updated });
}
