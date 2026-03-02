import { NextRequest, NextResponse } from "next/server";
import { getCharacter } from "@/lib/storage";
import { fetchItemFromWiki } from "@/lib/wikiItemLookup";
import { ItemData } from "@/lib/types";

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
      items[equippedItem.name] = await fetchItemFromWiki(equippedItem.name);
    }
  }

  return NextResponse.json({ character, items });
}
