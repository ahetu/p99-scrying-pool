import { NextRequest, NextResponse } from "next/server";

const WIKI_ICON_BASE =
  "https://wiki.project1999.com/index.php?title=Special:Redirect/file/Item_";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lucyId = parseInt(id, 10);
  if (isNaN(lucyId) || lucyId <= 0) {
    return new NextResponse("Invalid icon id", { status: 400 });
  }

  try {
    const wikiUrl = `${WIKI_ICON_BASE}${lucyId}.png`;
    const res = await fetch(wikiUrl, {
      headers: { "User-Agent": "NaberialsScryingPool/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return new NextResponse("Icon not found", { status: 404 });
    }

    const contentType = res.headers.get("content-type") || "image/png";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": `public, max-age=${ONE_YEAR}, s-maxage=${ONE_YEAR}, immutable`,
        "CDN-Cache-Control": `public, max-age=${ONE_YEAR}, immutable`,
      },
    });
  } catch {
    return new NextResponse("Failed to fetch icon", { status: 502 });
  }
}
