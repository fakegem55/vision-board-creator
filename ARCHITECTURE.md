# ARCHITECTURE.md — 전체 구조 및 데이터 모델

> Backend 없음. 순수 프론트엔드 앱 + Unsplash/번역 API Route (키 보호용만).

---

## 1. 디렉토리 구조

```
vision-board-creator/
├── app/
│   ├── layout.tsx                  # 루트 레이아웃 (폰트, LanguageProvider)
│   ├── page.tsx                    # 메인 페이지 (입력 → 생성 → 결과)
│   ├── globals.css                 # 전역 스타일 (overscroll, dvh)
│   └── api/
│       ├── images/
│       │   └── search/
│       │       └── route.ts        # Unsplash API 프록시 + 서버 메모리 캐시
│       └── translate/
│           └── route.ts            # MyMemory 번역 API 프록시 (langpair 지원)
│
├── components/
│   ├── KeywordInput.tsx            # 태그 형태 키워드 입력 (i18n 적용)
│   ├── KeywordSuggestions.tsx      # 카테고리별 추천 키워드 칩
│   └── BoardCanvas.tsx             # 자동 레이아웃 보드 렌더러
│
├── contexts/
│   └── LanguageContext.tsx         # 언어 상태 + 브라우저 자동 감지 + mounted 플래그
│
├── lib/
│   ├── keywords.ts                 # 7개 카테고리 × 4개 언어 키워드 사전
│   ├── i18n.ts                     # UI 문자열 (ko/en/ja/zh)
│   ├── cache.ts                    # localStorage TTL 캐시 (24시간, SSR 안전)
│   ├── translate.ts                # 사전 → 캐시 → API 3단계 번역
│   ├── unsplash.ts                 # Unsplash 검색 + localStorage 캐시
│   ├── layoutEngine.ts             # 행 기반 레이아웃 알고리즘 (빈 칸 없음)
│   ├── exportBoard.ts              # html-to-image → PNG Blob
│   └── generateId.ts               # crypto.randomUUID 폴백 (HTTP 환경 대응)
│
├── types/
│   └── index.ts                    # 공유 타입 (Language, Keyword, BoardItem 등)
│
├── __tests__/
│   ├── lib/
│   │   ├── layoutEngine.test.ts
│   │   ├── translate.test.ts
│   │   └── unsplash.test.ts
│   └── components/
│       ├── KeywordInput.test.tsx
│       └── BoardCanvas.test.tsx
│
├── .env.local                      # UNSPLASH_ACCESS_KEY (gitignore)
├── CLAUDE.md
├── REQUIREMENTS.md
└── ARCHITECTURE.md
```

---

## 2. 데이터 모델

```typescript
// types/index.ts

export type Language = 'ko' | 'en' | 'ja' | 'zh';

export interface Keyword {
  id: string;
  text: string;      // 표시 텍스트 (사용자 언어)
  enText?: string;   // 사전 매핑된 영어 (추천 키워드만, 없으면 generateBoard 시 번역)
}

export interface UnsplashPhoto {
  id: string;
  url: string;       // regular 사이즈 URL
  thumbUrl: string;
  altText: string;
  credit: string;    // 작가명 (Unsplash attribution 필수)
}

export interface LayoutRect {
  x: number;         // px (BOARD_WIDTH 기준)
  y: number;         // px (BOARD_HEIGHT 기준)
  width: number;     // px
  height: number;    // px
}

export interface BoardItem {
  keyword: string;
  photo: UnsplashPhoto;
  layout: LayoutRect;
}

export interface BoardData {
  items: BoardItem[];
  affirmation: string;
}
```

---

## 3. 핵심 데이터 흐름

### 3.1 보드 생성

```
사용자 입력
  keywords: [{ text: "여행", enText: "travel" }, { text: "피클볼" }]
  affirmation: "2026년, 나는 매일 성장한다"
        ↓
[번역 단계] 키워드마다:
  1. enText 있으면 → 바로 사용 (API 0회)
  2. 내장 사전 findEnglish() → 있으면 반환 (API 0회)
  3. localStorage 캐시 → 있으면 반환 (API 0회)
  4. MyMemory API 호출 → 결과를 localStorage에 저장
        ↓
[이미지 수집] Promise.all(englishTexts.map(text =>
  1. localStorage 캐시 확인 → 있으면 반환
  2. GET /api/images/search?q={text}&page={1 or random}
     → 서버 메모리 캐시 확인
     → Unsplash API 호출 → 서버 캐시 저장
     → 결과를 localStorage에 저장
))
        ↓
[중복 제거] usedIds Set으로 키워드마다 고유 사진 배정
        ↓
[레이아웃] buildLayout(keywords, photos)
  → buildRowPlan(count) → 행별 이미지 수 배열
  → 각 이미지의 x, y, width, height 계산
        ↓
<BoardCanvas items={items} affirmation={affirmation} />
  → 이미지 그리드 렌더
  → 다짐 텍스트 중앙 오버레이 (Dancing Script 폰트)
```

### 3.2 레이아웃 알고리즘 (행 기반, 빈 칸 없음)

```
buildRowPlan(count) 반환값:

count | 행 구성    | 설명
------|-----------|---------------------------
  1   | [1]       | 전체 1장
  2   | [2]       | 좌우 반반
  3   | [3]       | 1행에 3등분
  4   | [2, 2]    | 2×2 그리드
  5   | [3, 2]    | 1행: 1/3씩 3장 / 2행: 1/2씩 2장
  6   | [3, 3]    | 2행 × 3열
  7   | [3, 2, 2] | 1행: 3장 / 2·3행: 2장씩
  8   | [3, 3, 2] | 1·2행: 3장 / 3행: 2장
  9   | [3, 3, 3] | 3×3 그리드

고정 크기: BOARD_WIDTH=390px, BOARD_HEIGHT=690px
다짐 텍스트: 보드 중앙 절대 위치, 반투명 blur 배경, Dancing Script 폰트
```

### 3.3 번역 3단계 우선순위

```
입력 키워드 (한/일/중/영)
        ↓
1단계: 내장 사전 (lib/keywords.ts)
  - 7 카테고리 × 약 40개 키워드 × 4개 언어
  - API 호출 없음, 즉시 반환
        ↓ (사전에 없는 경우)
2단계: localStorage 캐시
  - key: "vb_tr_{lang}_{text}"
  - TTL: 24시간
        ↓ (캐시 미스)
3단계: /api/translate → MyMemory API
  - langpair: ko|en / ja|en / zh|en
  - 서버 측 24시간 revalidate 캐시
  - 결과를 localStorage에 저장
```

### 3.4 PNG 저장 및 공유

```
"저장" 버튼
  → html-to-image: toPng(canvasRef.current)
  → <a download="vision-board.png"> 자동 클릭

"공유" 버튼
  → toPng() → Blob → File 객체 생성
  → navigator.share({ files: [pngFile] }) 시도
  → 미지원 시 → PNG 자동 다운로드 폴백
```

### 3.5 언어 자동 감지

```
LanguageProvider 마운트
  → useEffect: navigator.language 감지
      ko-*  → 'ko'
      ja-*  → 'ja'
      zh-*  → 'zh'
      그 외 → 'en'
  → setLang(detected), setMounted(true)

mounted = false 동안:
  → 언어 선택 버튼 active 스타일 미적용 (서버/클라이언트 초기 렌더 일치)
  → Hydration 불일치 방지
```

---

## 4. API Routes

### GET /api/images/search

```
Query:    ?q=travel&page=1
캐시:     서버 메모리 Map (TTL 1시간) + 클라이언트 localStorage (TTL 24시간)
Action:   Unsplash API 호출 (서버에서 → UNSPLASH_ACCESS_KEY 노출 방지)
Response: { photos: UnsplashPhoto[] }  (per_page=10, orientation=portrait)
한도:     Demo 50 req/시간 → Production 신청 후 5,000 req/시간
```

### GET /api/translate

```
Query:    ?q=피클볼&langpair=ko|en
캐시:     next: { revalidate: 86400 } (서버 24시간)
Action:   MyMemory 무료 번역 API 프록시
Response: { text: "pickleball" }
폴백:     번역 실패 시 원본 텍스트 반환
```

---

## 5. 환경변수 (.env.local)

```bash
UNSPLASH_ACCESS_KEY="your_unsplash_access_key"
```

---

## 6. 기술 결정 근거

| 결정 | 이유 |
|------|------|
| Backend 없음 | 저장=PNG 다운로드, 공유=Web Share API → DB·서버 불필요 |
| Unsplash API Route | `UNSPLASH_ACCESS_KEY`를 클라이언트에 노출하지 않기 위해 |
| MyMemory 번역 API | 무료, API 키 불필요, 한/일/중→영 지원 |
| 내장 키워드 사전 | 비전보드 주요 키워드 번역 API 호출 제거, 즉시 반환 |
| localStorage 캐시 | 동일 키워드 반복 시 API 한도 절약, 24시간 TTL |
| 서버 메모리 캐시 | 서버 재시작 전까지 Unsplash 재호출 방지 |
| `mounted` 패턴 | 언어 자동 감지로 인한 Hydration 불일치 방지 |
| `min-h-dvh` | iOS 주소창 높이 변화에 따른 레이아웃 튐 방지 |
| `overscroll-behavior-y: none` | iOS 모멘텀 스크롤 바운스로 인한 상단 스냅 방지 |
| `generateId()` 폴백 | HTTP 내부망 테스트 시 `crypto.randomUUID` 미지원 대응 |
| Dancing Script 폰트 | 다짐 텍스트에 어울리는 손글씨 서체, next/font/google으로 최적화 로드 |
| 행 기반 레이아웃 | 5·7·8개 이미지에서 빈 칸 없이 자연스러운 배치 |
| html-to-image | DOM → PNG 변환 가장 간단한 방법, Canvas API 불필요 |
