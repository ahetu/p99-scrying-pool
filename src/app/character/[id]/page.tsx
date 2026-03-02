import { getCharacter } from "@/lib/storage";
import { fetchItemFromWiki } from "@/lib/wikiItemLookup";
import { ItemData } from "@/lib/types";
import { notFound } from "next/navigation";
import CharacterHeader from "@/components/CharacterHeader";
import PaperDoll from "@/components/PaperDoll";
import StatsSummary from "@/components/StatsSummary";
import EquipmentList from "@/components/EquipmentList";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CharacterPage({ params }: PageProps) {
  const { id } = await params;
  const character = await getCharacter(id);

  if (!character) {
    notFound();
  }

  const items: Record<string, ItemData | null> = {};
  for (const [, equipped] of Object.entries(character.equipment)) {
    if (equipped && !items[equipped.name]) {
      items[equipped.name] = await fetchItemFromWiki(equipped.name);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-amber-900/10 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent hover:from-amber-300 hover:to-yellow-200 transition-all text-sm font-bold tracking-wide"
          >
            Naberial&apos;s Scrying Pool
          </Link>
          <Link
            href="/"
            className="text-zinc-600 hover:text-amber-400/80 transition-colors text-xs"
          >
            Upload Character
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-14">
        <CharacterHeader character={character} />

        <div className="flex justify-center mb-12">
          <PaperDoll character={character} items={items} />
        </div>

        <StatsSummary character={character} items={items} />

        {/* Equipment List */}
        <div className="mt-12">
          <h3 className="text-amber-300/80 text-sm font-bold uppercase tracking-wider mb-4 text-center">
            Equipment List
          </h3>
          <EquipmentList character={character} items={items} />
        </div>

        {/* Share */}
        <div className="mt-12 text-center">
          <div className="divider-ornate w-32 mx-auto mb-6" />
          <p className="text-zinc-600 text-xs mb-2">Share this character</p>
          <code className="inline-block bg-zinc-900/80 border border-amber-900/20 rounded-lg px-4 py-2 text-amber-400/60 text-xs select-all">
            Copy this page&apos;s URL to share
          </code>
        </div>
      </main>
    </div>
  );
}
