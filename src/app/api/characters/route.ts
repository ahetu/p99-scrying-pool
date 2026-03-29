import { NextRequest, NextResponse } from "next/server";
import { listCharacters } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 200);

    const characters = await listCharacters(limit);
    return NextResponse.json({ characters });
  } catch (error) {
    console.error("Characters list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
