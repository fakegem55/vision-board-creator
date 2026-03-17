import { NextRequest, NextResponse } from 'next/server';
import { mapUnsplashPhoto } from '@/lib/unsplash';
import type { UnsplashPhoto } from '@/types';

const UNSPLASH_API = 'https://api.unsplash.com';
const PER_PAGE = 10;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1시간

const cache = new Map<string, { photos: UnsplashPhoto[]; cachedAt: number }>();

function getCached(key: string): UnsplashPhoto[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) { cache.delete(key); return null; }
  return entry.photos;
}

// IP당 시간당 최대 API 호출 수 (서버 캐시 히트는 카운트 안 함)
const RATE_LIMIT = 20;
const RATE_TTL_MS = 60 * 60 * 1000; // 1시간
const ipRateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRateMap.get(ip);
  if (!record || now >= record.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + RATE_TTL_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('q');
  const page = Number(searchParams.get('page') ?? '1');

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const cacheKey = `${query}__${page}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json({ photos: cached });

  // 서버 캐시 미스 시에만 Rate Limit 적용 (실제 API 호출 전)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const url = `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${PER_PAGE}&orientation=portrait`;

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${accessKey}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[Unsplash] ${res.status} ${res.statusText} — ${body}`);
    return NextResponse.json({ error: 'Unsplash API error', detail: body }, { status: res.status });
  }

  const data = (await res.json()) as { results: Parameters<typeof mapUnsplashPhoto>[0][] };
  const photos = data.results.map(mapUnsplashPhoto);

  cache.set(cacheKey, { photos, cachedAt: Date.now() });
  return NextResponse.json({ photos });
}
