import { ParsedStats } from "./types";

function extractNumber(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  if (!match) return null;
  const val = parseFloat(match[1]);
  return isNaN(val) ? null : val;
}

export function parseStatsBlock(raw: string): ParsedStats {
  const text = raw
    .replace(/\r/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  const magic = /MAGIC ITEM/i.test(text);
  const lore = /LORE ITEM/i.test(text);
  const noDrop = /NO DROP/i.test(text);
  const noRent = /NO RENT|TEMPORARY/i.test(text);
  const expendable = /EXPENDABLE/i.test(text);
  const quest = /QUEST ITEM/i.test(text);

  const slotMatch = text.match(/Slot:\s*(.+)/i);
  const slots = slotMatch
    ? slotMatch[1].trim().split(/\s+/)
    : [];

  const skillMatch = text.match(/Skill:\s*([^\n]+?)(?:\s+Atk Delay|$)/i);
  const skill = skillMatch ? skillMatch[1].trim() : null;

  const damage = extractNumber(text, /DMG:\s*(\d+)/i);
  const delay = extractNumber(text, /(?:Atk )?Delay:\s*(\d+)/i);
  const ratio = damage && delay ? Math.round((damage / delay) * 100) / 100 : null;

  const ac = extractNumber(text, /\bAC:\s*([+-]?\d+)/i);
  const hp = extractNumber(text, /\bHP:\s*([+-]?\d+)/i);
  const mana = extractNumber(text, /\bMANA:\s*([+-]?\d+)/i);

  const str = extractNumber(text, /\bSTR:\s*([+-]?\d+)/i);
  const sta = extractNumber(text, /\bSTA:\s*([+-]?\d+)/i);
  const dex = extractNumber(text, /\bDEX:\s*([+-]?\d+)/i);
  const agi = extractNumber(text, /\bAGI:\s*([+-]?\d+)/i);
  const wis = extractNumber(text, /\bWIS:\s*([+-]?\d+)/i);
  const int = extractNumber(text, /\bINT:\s*([+-]?\d+)/i);
  const cha = extractNumber(text, /\bCHA:\s*([+-]?\d+)/i);

  const svFire = extractNumber(text, /SV FIRE:\s*([+-]?\d+)/i);
  const svCold = extractNumber(text, /SV COLD:\s*([+-]?\d+)/i);
  const svDisease = extractNumber(text, /SV DISEASE:\s*([+-]?\d+)/i);
  const svMagic = extractNumber(text, /SV MAGIC:\s*([+-]?\d+)/i);
  const svPoison = extractNumber(text, /SV POISON:\s*([+-]?\d+)/i);

  const haste = extractNumber(text, /Haste:\s*\+?(\d+)%/i);

  const effectMatch = text.match(/Effect:\s*(.+?)(?:\s*\(([^)]+)\))?\s*(?:at Level \d+)?$/im);
  let effect = effectMatch ? effectMatch[1].trim() : null;
  if (effect) effect = effect.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1");
  const effectType = effectMatch && effectMatch[2] ? effectMatch[2].trim() : null;

  const weight = extractNumber(text, /WT:\s*([\d.]+)/i);
  const sizeMatch = text.match(/Size:\s*(\w+)/i);
  const size = sizeMatch ? sizeMatch[1] : null;

  const classMatches = [...text.matchAll(/Class:\s*(.+)/gi)];
  const classes = classMatches.length > 0
    ? classMatches[classMatches.length - 1][1].trim().split(/\s+/)
    : [];

  const raceMatches = [...text.matchAll(/Race:\s*(.+)/gi)];
  const races = raceMatches.length > 0
    ? raceMatches[raceMatches.length - 1][1].trim().split(/\s+/)
    : [];

  return {
    magic, lore, noDrop, noRent, expendable, quest,
    slots, skill, damage, delay, ratio,
    ac, hp, mana,
    str, sta, dex, agi, wis, int, cha,
    svFire, svCold, svDisease, svMagic, svPoison,
    haste, effect, effectType,
    weight, size, classes, races,
  };
}
