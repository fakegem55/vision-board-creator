import { cacheGet, cacheSet } from '@/lib/cache';
import type { UnsplashPhoto } from '@/types';

interface UnsplashApiPhoto {
  id: string;
  urls: { regular: string; thumb: string };
  alt_description: string | null;
  user: { name: string };
}

export function mapUnsplashPhoto(raw: UnsplashApiPhoto): UnsplashPhoto {
  return {
    id: raw.id,
    url: raw.urls.regular,
    thumbUrl: raw.urls.thumb,
    altText: raw.alt_description ?? '',
    credit: raw.user.name,
  };
}

export async function searchPhotos(query: string, page = 1): Promise<UnsplashPhoto[]> {
  const cacheKey = `photos_${query}_${page}`;
  const cached = cacheGet<UnsplashPhoto[]>(cacheKey);
  if (cached) return cached;

  const res = await fetch(`/api/images/search?q=${encodeURIComponent(query)}&page=${page}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Image search failed: ${res.status} — ${body}`);
  }

  const data = (await res.json()) as { photos: UnsplashPhoto[] };
  cacheSet(cacheKey, data.photos);
  return data.photos;
}
