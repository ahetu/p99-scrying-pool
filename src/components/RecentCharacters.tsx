"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CharacterSummary } from "@/lib/types";

export default function RecentCharacters() {
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/characters")
      .then((res) => res.json())
      .then((data) => {
        setCharacters(data.characters || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center text-zinc-600 text-sm py-8">
        Loading recent characters...
      </div>
    );
  }

  if (characters.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-amber-300/70 text-sm font-bold uppercase tracking-wider mb-6 text-center">
        Recently Scried
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.slice(0, 12).map((char) => (
          <Link
            key={char.id}
            href={`/character/${char.id}`}
            className="group card-fantasy rounded-xl p-5 transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="font-bold bg-gradient-to-r from-amber-200 to-amber-100 bg-clip-text text-transparent group-hover:from-amber-100 group-hover:to-yellow-100 transition-colors">
              {char.name}
            </div>
            <div className="text-xs text-zinc-500 mt-1.5">
              Lv {char.level} {char.race} {char.className}
            </div>
            <div className="text-[10px] text-zinc-700 mt-0.5">
              {char.server}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
