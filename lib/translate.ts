import { findEnglish } from '@/lib/keywords';
import { cacheGet, cacheSet } from '@/lib/cache';

const KOREAN_REGEX = /[가-힣]/;
const JAPANESE_REGEX = /[\u3040-\u30ff\uff66-\uff9f]/;
const CHINESE_REGEX = /[\u4e00-\u9fff]/;

type DetectedLang = 'ko' | 'ja' | 'zh' | 'other';

export function detectLang(text: string): DetectedLang {
  if (KOREAN_REGEX.test(text)) return 'ko';
  if (JAPANESE_REGEX.test(text)) return 'ja';
  if (CHINESE_REGEX.test(text)) return 'zh';
  return 'other';
}

const LANGPAIR: Record<Exclude<DetectedLang, 'other'>, string> = {
  ko: 'ko|en',
  ja: 'ja|en',
  zh: 'zh|en',
};

export async function translateToEnglish(text: string): Promise<string> {
  const lang = detectLang(text);
  if (lang === 'other') return text;

  // 1. 내장 사전 우선
  const fromDict = findEnglish(text);
  if (fromDict) return fromDict;

  // 2. localStorage 캐시 확인
  const cacheKey = `tr_${lang}_${text}`;
  const cached = cacheGet<string>(cacheKey);
  if (cached) return cached;

  // 3. MyMemory API 호출
  const res = await fetch(
    `/api/translate?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(LANGPAIR[lang])}`
  );
  if (!res.ok) return text;

  const data = (await res.json()) as { text: string };
  const translated = data.text ?? text;
  cacheSet(cacheKey, translated);
  return translated;
}

export async function translateKeywords(keywords: string[]): Promise<string[]> {
  return Promise.all(keywords.map(translateToEnglish));
}
