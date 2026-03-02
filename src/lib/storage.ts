import { Character, CharacterSummary } from "./types";
import path from "path";
import fs from "fs/promises";

const CHARACTERS_DIR = path.join(process.cwd(), "data", "characters");

function nameToSlug(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function generateSlug(name: string): string {
  return nameToSlug(name);
}

export async function saveCharacter(character: Character): Promise<void> {
  await fs.mkdir(CHARACTERS_DIR, { recursive: true });
  const filePath = path.join(CHARACTERS_DIR, `${character.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(character, null, 2));
}

export async function getCharacter(id: string): Promise<Character | null> {
  const filePath = path.join(CHARACTERS_DIR, `${id}.json`);
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as Character;
  } catch {
    return null;
  }
}

export async function updateCharacter(id: string, updates: Partial<Character>): Promise<Character | null> {
  const character = await getCharacter(id);
  if (!character) return null;
  const updated = { ...character, ...updates, updatedAt: new Date().toISOString() };
  await saveCharacter(updated);
  return updated;
}

export async function listCharacters(): Promise<CharacterSummary[]> {
  await fs.mkdir(CHARACTERS_DIR, { recursive: true });

  const files = await fs.readdir(CHARACTERS_DIR);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  const summaries: CharacterSummary[] = [];

  for (const file of jsonFiles) {
    try {
      const data = await fs.readFile(path.join(CHARACTERS_DIR, file), "utf-8");
      const char = JSON.parse(data) as Character;
      summaries.push({
        id: char.id,
        name: char.name,
        className: char.className,
        level: char.level,
        race: char.race,
        server: char.server,
        createdAt: char.createdAt,
      });
    } catch {
      continue;
    }
  }

  summaries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return summaries;
}
