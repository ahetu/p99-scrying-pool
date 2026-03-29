import type { MetadataRoute } from "next";
import { listCharacters } from "@/lib/storage";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://p99scryingpool.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const characters = await listCharacters();

  const characterUrls: MetadataRoute.Sitemap = characters.map((char) => ({
    url: `${SITE_URL}/character/${char.id}`,
    lastModified: new Date(char.createdAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...characterUrls,
  ];
}
