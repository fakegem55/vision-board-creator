/**
 * 일회성 이미지 풀 구축 스크립트
 * Usage: npm run fetch-pool
 *
 * lib/imagePool.ts를 자동 생성합니다.
 * UNSPLASH_ACCESS_KEY가 .env.local에 설정되어 있어야 합니다.
 */

import fs from 'fs';
import path from 'path';

// .env.local 수동 로드 (dotenv 의존성 없이)
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^=\s#][^=]*)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!ACCESS_KEY) {
  console.error('Error: UNSPLASH_ACCESS_KEY가 .env.local에 설정되지 않았습니다.');
  process.exit(1);
}

// lib/keywords.ts의 모든 영어 키워드 (경로 별칭 없이 직접 정의)
const KEYWORDS_EN = [
  // 건강/웰빙
  'health', 'fitness', 'meditation', 'yoga', 'sleep', 'nature',
  // 여행
  'travel', 'ocean', 'mountain', 'city', 'adventure', 'world',
  // 가족/관계
  'family', 'love', 'friendship', 'wedding', 'happiness',
  // 성공/커리어
  'success', 'goal', 'growth', 'leadership', 'startup',
  // 재정
  'financial freedom', 'wealth', 'investment', 'abundance',
  // 자기계발
  'reading books', 'studying', 'creativity', 'wisdom', 'focus',
  // 라이프스타일
  'home interior', 'fashion', 'food', 'art', 'music', 'minimalist',
];

const PHOTOS_PER_KEYWORD = 8;
const DELAY_MS = 350; // Demo 한도(50/시간) 초과 방지

interface UnsplashRaw {
  id: string;
  urls: { regular: string; thumb: string };
  alt_description: string | null;
  user: { name: string };
}

async function fetchPhotos(query: string): Promise<UnsplashRaw[]> {
  const url =
    `https://api.unsplash.com/search/photos` +
    `?query=${encodeURIComponent(query)}` +
    `&per_page=${PHOTOS_PER_KEYWORD}` +
    `&page=1` +
    `&orientation=portrait`;

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.warn(`  [WARN] "${query}": HTTP ${res.status} — ${body.slice(0, 80)}`);
    return [];
  }

  const data = (await res.json()) as { results: UnsplashRaw[] };
  return data.results ?? [];
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  console.log(`\n📸  Unsplash 이미지 풀 구축 시작 (${KEYWORDS_EN.length}개 키워드)\n`);

  const pool: Record<string, object[]> = {};

  for (let i = 0; i < KEYWORDS_EN.length; i++) {
    const keyword = KEYWORDS_EN[i];
    process.stdout.write(`  [${i + 1}/${KEYWORDS_EN.length}] "${keyword}"... `);
    const raws = await fetchPhotos(keyword);
    pool[keyword] = raws.map(r => ({
      id: r.id,
      url: r.urls.regular,
      thumbUrl: r.urls.thumb,
      altText: r.alt_description ?? keyword,
      credit: r.user.name,
    }));
    console.log(`${pool[keyword].length}장`);
    if (i < KEYWORDS_EN.length - 1) await sleep(DELAY_MS);
  }

  // lib/imagePool.ts 생성
  const outLines = [
    `import type { UnsplashPhoto } from '@/types';`,
    ``,
    `// 자동 생성 파일 — npm run fetch-pool 로 재생성`,
    `// 생성일: ${new Date().toISOString().slice(0, 10)}`,
    ``,
    `export const IMAGE_POOL: Record<string, UnsplashPhoto[]> = ${JSON.stringify(pool, null, 2)};`,
    ``,
    `/** 풀에서 사진 목록 반환. shuffled=true면 순서 섞기 (재생성 지원) */`,
    `export function getPoolPhotos(enKeyword: string, shuffled = false): UnsplashPhoto[] {`,
    `  const photos = IMAGE_POOL[enKeyword];`,
    `  if (!photos || photos.length === 0) return [];`,
    `  if (!shuffled) return photos;`,
    `  return [...photos].sort(() => Math.random() - 0.5);`,
    `}`,
    ``,
  ];

  const outPath = path.join(process.cwd(), 'lib', 'imagePool.ts');
  fs.writeFileSync(outPath, outLines.join('\n'), 'utf8');

  const total = Object.values(pool).reduce((s, arr) => s + arr.length, 0);
  console.log(`\n✅  완료: ${outPath}`);
  console.log(`   ${KEYWORDS_EN.length}개 키워드, 총 ${total}장 사진`);
  console.log(`\n다음 단계:`);
  console.log(`  npm test          # 테스트 통과 확인`);
  console.log(`  npm run dev       # 서버 실행 후 Network 탭에서 /api/images/search 0회 확인\n`);
}

main().catch(err => {
  console.error('\n❌ 오류:', err);
  process.exit(1);
});
