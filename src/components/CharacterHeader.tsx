"use client";

import { Character } from "@/lib/types";

interface CharacterHeaderProps {
  character: Character;
}

export default function CharacterHeader({ character }: CharacterHeaderProps) {
  return (
    <div className="text-center mb-10">
      <div className="inline-block mb-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-amber-500/20 to-amber-900/20 border border-amber-600/30 flex items-center justify-center glow-amber">
          <span className="text-xl">&#x2694;</span>
        </div>
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-glow-gold">
        <span className="bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-transparent">
          {character.name}
        </span>
      </h1>
      <div className="mt-3 flex items-center justify-center gap-3 text-sm">
        <span className="bg-gradient-to-r from-amber-500 to-amber-400 bg-clip-text text-transparent font-semibold">
          Level {character.level}
        </span>
        <span className="text-amber-800/60">&bull;</span>
        <span className="text-zinc-300">{character.race}</span>
        <span className="text-amber-800/60">&bull;</span>
        <span className="text-amber-400/90">{character.className}</span>
      </div>
      <div className="mt-1.5 text-zinc-600 text-xs">{character.server}</div>
      <div className="divider-ornate w-40 mx-auto mt-6" />
    </div>
  );
}
