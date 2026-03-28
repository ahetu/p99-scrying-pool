import { NextResponse } from "next/server";
import { listCharacters } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const characters = await listCharacters();
  return NextResponse.json({ characters });
}
