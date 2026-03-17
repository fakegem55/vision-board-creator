'use client';

import { useRef, useState } from 'react';
import KeywordInput from '@/components/KeywordInput';
import KeywordSuggestions from '@/components/KeywordSuggestions';
import BoardCanvas from '@/components/BoardCanvas';
import { searchPhotos } from '@/lib/unsplash';
import { buildLayout } from '@/lib/layoutEngine';
import { downloadBoard, shareBoard } from '@/lib/exportBoard';
import { translateToEnglish } from '@/lib/translate';
import { getPoolPhotos } from '@/lib/imagePool';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import type { Language, Keyword, BoardData } from '@/types';

type Step = 'input' | 'loading' | 'result';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
];

export default function Home() {
  const { lang, setLang, mounted } = useLanguage();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [affirmation, setAffirmation] = useState('');
  const [board, setBoard] = useState<BoardData | null>(null);
  const [step, setStep] = useState<Step>('input');
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const s = t(lang);

  async function resolveEnglish(kw: Keyword): Promise<string> {
    if (kw.enText) return kw.enText; // 사전 매핑 키워드 → API 호출 없음
    return translateToEnglish(kw.text);
  }

  async function generateBoard(randomOffset = false) {
    if (keywords.length === 0) { setError(s.errorMinKeyword); return; }
    setError('');
    setStep('loading');

    try {
      // 번역 (사전 → 캐시 → API 순서로 최소 호출)
      const englishTexts = await Promise.all(keywords.map(resolveEnglish));

      // 키워드별 후보 사진 병렬 수집 (풀 → localStorage 캐시 → API 순서)
      const allCandidates = await Promise.all(
        englishTexts.map(async text => {
          // 1. 정적 이미지 풀 우선 (API 호출 0회)
          const poolPhotos = getPoolPhotos(text, randomOffset);
          if (poolPhotos.length > 0) return poolPhotos;
          // 2. 폴백: Unsplash API (커스텀 키워드 등 풀에 없는 경우)
          const page = randomOffset ? Math.floor(Math.random() * 5) + 2 : 1;
          const photos = await searchPhotos(text, page);
          if (photos.length === 0 && randomOffset) return searchPhotos(text, 1);
          return photos;
        })
      );

      // 중복 없이 키워드마다 고유 사진 배정
      const usedIds = new Set<string>();
      const photoResults = allCandidates.map(candidates => {
        const unique = candidates.find(p => !usedIds.has(p.id));
        if (unique) { usedIds.add(unique.id); return unique; }
        return null;
      });

      const validPairs = keywords
        .map((kw, i) => ({ keyword: kw.text, photo: photoResults[i] }))
        .filter((p): p is { keyword: string; photo: NonNullable<typeof photoResults[0]> } => p.photo !== null);

      const items = buildLayout(
        validPairs.map(p => p.keyword),
        validPairs.map(p => p.photo)
      );

      setBoard({ items, affirmation });
      setStep('result');
    } catch (err) {
      console.error('[generateBoard] 오류:', err);
      setError(s.errorImageFetch);
      setStep('input');
    }
  }

  function handleAddKeyword(kw: Keyword) {
    if (keywords.length >= 9 || keywords.some(k => k.text === kw.text)) return;
    setKeywords(prev => [...prev, kw]);
  }

  if (step === 'loading') return <LoadingScreen text={s.loadingText} />;

  if (step === 'result' && board) {
    return (
      <ResultScreen
        board={board}
        canvasRef={canvasRef}
        s={s}
        onDownload={() => canvasRef.current && downloadBoard(canvasRef.current)}
        onShare={() => canvasRef.current && shareBoard(canvasRef.current)}
        onRegenerate={() => generateBoard(true)}
        onBack={() => setStep('input')}
      />
    );
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-indigo-50 to-white flex flex-col max-w-md mx-auto">
      <HeroHeader s={s} lang={lang} mounted={mounted} setLang={setLang} />
      <div className="flex flex-col gap-6 px-5 py-6">

      <section className="flex flex-col gap-2">
        <label className="font-semibold text-gray-700">{s.suggestionsLabel}</label>
        <KeywordSuggestions lang={lang} selected={keywords} onAdd={handleAddKeyword} />
      </section>

      <section className="flex flex-col gap-2">
        <label className="font-semibold text-gray-700">{s.keywordsLabel}</label>
        <KeywordInput lang={lang} keywords={keywords} onChange={setKeywords} />
      </section>

      <section className="flex flex-col gap-2">
        <label className="font-semibold text-gray-700" htmlFor="affirmation">
          {s.affirmationLabel}{' '}
          <span className="text-gray-400 font-normal text-sm">({s.affirmationOptional})</span>
        </label>
        <input
          id="affirmation"
          type="text"
          value={affirmation}
          onChange={e => setAffirmation(e.target.value)}
          maxLength={60}
          placeholder={s.affirmationPlaceholder}
          className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <p className="text-xs text-gray-400 text-right">{affirmation.length} / 60</p>
      </section>

      {error && <p role="alert" className="text-red-500 text-sm text-center">{error}</p>}

      <button
        type="button"
        onClick={() => generateBoard(false)}
        disabled={keywords.length === 0}
        className="w-full py-4 bg-indigo-600 text-white text-lg font-bold rounded-2xl shadow-lg disabled:opacity-40 active:scale-95 transition-transform"
      >
        {s.generateButton}
      </button>
      </div>
    </main>
  );
}

interface HeroHeaderProps {
  s: ReturnType<typeof t>;
  lang: Language;
  mounted: boolean;
  setLang: (l: Language) => void;
}

function HeroHeader({ s, lang, mounted, setLang }: HeroHeaderProps) {
  return (
    <div
      className="relative overflow-hidden rounded-b-3xl px-6 pt-12 pb-8"
      style={{ background: 'linear-gradient(135deg, #4338ca 0%, #7c3aed 60%, #a855f7 100%)' }}
    >
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/10" />
      <div className="absolute top-6 right-24 w-10 h-10 rounded-full bg-white/15" />

      <h1 className="relative text-4xl font-black text-white tracking-tight leading-tight whitespace-nowrap">
        {s.title}
      </h1>
      <p className="relative mt-2 text-indigo-200 text-sm leading-relaxed">
        {s.subtitle}
      </p>

      <div className="relative mt-4 flex justify-end">
        <div className="flex gap-1 bg-white/15 backdrop-blur-sm rounded-xl p-1">
          {LANGUAGES.map(({ code, label }) => {
            // mounted 전에는 active 스타일 미적용 → 서버/클라이언트 초기 렌더 일치
            const isActive = mounted && lang === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  isActive ? 'bg-white text-indigo-700 shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LoadingScreen({ text }: { text: string }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-indigo-50">
      <div className="w-12 h-12 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" aria-label="로딩 중" />
      <p className="text-indigo-600 font-medium">{text}</p>
    </div>
  );
}

interface ResultScreenProps {
  board: BoardData;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  s: ReturnType<typeof t>;
  onDownload: () => void;
  onShare: () => void;
  onRegenerate: () => void;
  onBack: () => void;
}

function ResultScreen({ board, canvasRef, s, onDownload, onShare, onRegenerate, onBack }: ResultScreenProps) {
  return (
    <main className="min-h-dvh bg-gray-950 px-4 py-8 flex flex-col gap-6 items-center">
      <BoardCanvas ref={canvasRef} board={board} />
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button onClick={onDownload} className="w-full py-4 bg-white text-gray-900 font-bold rounded-2xl shadow">
          {s.saveButton}
        </button>
        <button onClick={onShare} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow">
          {s.shareButton}
        </button>
        <button onClick={onRegenerate} className="w-full py-3 border border-white/30 text-white rounded-2xl">
          {s.regenerateButton}
        </button>
        <button onClick={onBack} className="text-gray-400 text-sm text-center mt-2">
          {s.backButton}
        </button>
      </div>
    </main>
  );
}
