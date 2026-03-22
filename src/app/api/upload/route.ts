import { NextRequest, NextResponse } from "next/server";
import { Character } from "@/lib/types";
import { parseInventoryFile } from "@/lib/parseInventory";
import { saveCharacter, generateSlug } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, className, level, race, server, inventoryText, bonusPoints } = body;

    if (!name || !className || !level || !race || !inventoryText) {
      return NextResponse.json(
        { error: "Missing required fields: name, className, level, race, inventoryText" },
        { status: 400 }
      );
    }

    const equipment = parseInventoryFile(inventoryText);

    const id = generateSlug(name);
    const now = new Date().toISOString();

    const character: Character = {
      id,
      name: name.trim(),
      className,
      level: parseInt(level, 10),
      race,
      server: server || "P1999 Green",
      equipment,
      ...(bonusPoints ? { bonusPoints } : {}),
      createdAt: now,
      updatedAt: now,
    };

    await saveCharacter(character);

    return NextResponse.json({ id, url: `/character/${id}` });
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
