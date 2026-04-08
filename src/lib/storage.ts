import { Character, CharacterSummary } from "./types";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const CHAR_KEY = (id: string) => `char:${id}`;
const CHAR_INDEX = "characters";

function nameToSlug(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function generateSlug(name: string): string {
  return nameToSlug(name);
}

export async function saveCharacter(character: Character): Promise<void> {
  const score = new Date(character.createdAt).getTime();
  await Promise.all([
    redis.set(CHAR_KEY(character.id), character),
    redis.zadd(CHAR_INDEX, { score, member: character.id }),
  ]);
}

export async function getCharacter(id: string): Promise<Character | null> {
  return await redis.get<Character>(CHAR_KEY(id));
}

export async function updateCharacter(id: string, updates: Partial<Character>): Promise<Character | null> {
  const character = await getCharacter(id);
  if (!character) return null;
  const updated = { ...character, ...updates, updatedAt: new Date().toISOString() };
  await redis.set(CHAR_KEY(id), updated);
  return updated;
}

export async function listCharacters(limit: number = 50): Promise<CharacterSummary[]> {
  const ids = await redis.zrange<string[]>(CHAR_INDEX, 0, limit - 1, { rev: true });
  if (!ids.length) return [];

  const keys = ids.map((id) => CHAR_KEY(id));
  const characters = await redis.mget<(Character | null)[]>(...keys);

  return characters
    .filter((char): char is Character => char !== null && /^[A-Za-z]{4,15}$/.test(char.name))
    .map((char) => ({
      id: char.id,
      name: char.name,
      className: char.className,
      level: char.level,
      race: char.race,
      server: char.server,
      createdAt: char.createdAt,
    }));
}
