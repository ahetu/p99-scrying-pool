import { NextRequest, NextResponse } from "next/server";
import { getCharacter, updateCharacter } from "@/lib/storage";
import { getItemByNameWithFallback } from "@/lib/itemDatabase";
import { ItemData, BonusPointAllocation } from "@/lib/types";

export const dynamic = "force-dynamic";

const BONUS_STAT_KEYS = new Set(["str", "sta", "agi", "dex", "wis", "int", "cha"]);
const MAX_BONUS_TOTAL = 30;

function validateBonusPoints(bp: unknown): BonusPointAllocation | null {
  if (!bp || typeof bp !== "object" || Array.isArray(bp)) return null;
  const obj = bp as Record<string, unknown>;

  const result: Record<string, number> = {};
  let total = 0;

  for (const key of BONUS_STAT_KEYS) {
    const val = obj[key];
    if (typeof val !== "number" || !Number.isInteger(val) || val < 0) return null;
    result[key] = val;
    total += val;
  }

  if (total > MAX_BONUS_TOTAL) return null;

  return result as unknown as BonusPointAllocation;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const character = await getCharacter(id);

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    const itemNames = [
      ...new Set(
        Object.values(character.equipment)
          .filter((item): item is NonNullable<typeof item> => item !== null)
          .map((item) => item.name)
      ),
    ];

    const items: Record<string, ItemData | null> = {};
    await Promise.all(
      itemNames.map(async (name) => {
        items[name] = await getItemByNameWithFallback(name);
      })
    );

    return NextResponse.json({ character, items });
  } catch (error) {
    console.error("Character GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const bp = validateBonusPoints((body as Record<string, unknown>)?.bonusPoints);
    if (!bp) {
      return NextResponse.json(
        { error: "Invalid bonusPoints: must contain str, sta, agi, dex, wis, int, cha as non-negative integers totaling ≤ 30" },
        { status: 400 }
      );
    }

    const updated = await updateCharacter(id, { bonusPoints: bp });
    if (!updated) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    return NextResponse.json({ character: updated });
  } catch (error) {
    console.error("Character PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
