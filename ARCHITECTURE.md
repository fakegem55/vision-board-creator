# ARCHITECTURE.md — 전체 구조 및 데이터 모델

> Backend 없음. 순수 프론트엔드 앱 + Unsplash API Route (키 보호용만).

---

## 1. 디렉토리 구조

```
vision-board-creator/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 루트 레이아웃 (폰트, 전역 스타일)
│   │   ├── page.tsx                # 메인 페이지 (키워드 입력 + 다짐 텍스트 + 생성 버튼)
│   │   └── api/
│   │       └── images/
│   │           └── search/
│   │               └── route.ts   # Unsplash API 프록시 (키 숨기기)
│   │
│   ├── components/
│   │   ├── KeywordInput.tsx        # 태그 형태 키워드 입력
│   │   ├── TextInput.tsx           # 다짐 텍스트 입력 (50자 제한)
│   │   ├── BoardCanvas.tsx         # 자동 레이아웃 보드 렌더러
│   │   └── ActionButtons.tsx       # 저장 / 공유 / 다시 만들기
│   │
│   ├── lib/
│   │   ├── unsplash.ts             # Unsplash 검색 fetch 함수
│   │   ├── layoutEngine.ts         # 이미지 자동 배치 알고리즘
│   │   └── exportBoard.ts          # html-to-image → PNG Blob
│   │
│   └── types/
│       └── index.ts                # 공유 타입 (BoardItem, UnsplashPhoto 등)
│
├── __tests__/
│   ├── lib/
│   │   ├── layoutEngine.test.ts
│   │   └── unsplash.test.ts
│   └── components/
│       ├── KeywordInput.test.tsx
│       └── BoardCanvas.test.tsx
│
├── public/
│   └── placeholder.jpg             # 이미지 로드 실패 시 대체 이미지
│
├── .env.local.example
├── CLAUDE.md
├── REQUIREMENTS.md
├── SKILLS.md
└── ARCHITECTURE.md
```

---

## 2. 데이터 모델 (DB 없음 — 런타임 메모리만)

```typescript
// src/types/index.ts

export interface Keyword {
  id: string;
  text: string;
}

export interface UnsplashPhoto {
  id: string;
  url: string;         // regular 사이즈 URL
  thumbUrl: string;    // thumb 사이즈 URL
  altText: string;
  credit: string;      // 작가명
}

export interface BoardItem {
  keyword: string;
  photo: UnsplashPhoto;
  layout: LayoutRect;  // 보드 내 위치/크기
}

export interface LayoutRect {
  x: number;           // px
  y: number;           // px
  width: number;       // px
  height: number;      // px
}

export interface BoardData {
  items: BoardItem[];
  affirmation: string; // 다짐 텍스트
  theme: BoardTheme;
}

export type BoardTheme = 'default'; // v2에서 확장
```

---

## 3. 핵심 데이터 흐름

### 3.1 보드 생성

```
사용자 입력
  keywords: ["여행", "건강", "가족"]
  affirmation: "2025년, 나는 매일 성장한다"
        ↓
Promise.all(keywords.map(kw =>
  fetch(`/api/images/search?q=${kw}&page=${randomOffset}`)
))
        ↓
layoutEngine(photos[])
  → 키워드 수에 따라 그리드 레이아웃 계산
  → BoardItem[] 반환
        ↓
<BoardCanvas items={items} affirmation={affirmation} />
  → ref={canvasRef} 로 DOM 참조 보관
```

### 3.2 레이아웃 알고리즘 (layoutEngine)

```
키워드 1개  → 전체 화면 1장
키워드 2개  → 좌우 반반 (1:1)
키워드 3개  → 상단 2장 + 하단 1장 (풀 폭)
키워드 4개  → 2×2 그리드
키워드 5~6개 → 3열 + 나머지 하단
키워드 7~10개 → 3열 그리드 (초과분 숨김 처리)

affirmation 텍스트 → 보드 하단 중앙 오버레이
```

### 3.3 PNG 저장

```
"저장" 버튼 탭
  → exportBoard(canvasRef.current)
      → html-to-image: toPng(element)
      → Blob URL 생성
      → <a download="vision-board.png"> 자동 클릭
```

### 3.4 공유

```
"공유" 버튼 탭
  → exportBoard(canvasRef.current) → Blob
  → navigator.share({ files: [pngFile] }) 시도
  → 미지원 시 → PNG 자동 다운로드로 폴백
```

### 3.5 재생성

```
"다시 만들기" 버튼 탭
  → 각 키워드마다 randomPage = Math.floor(Math.random() * 5) + 1
  → 3.1 흐름 재실행
```

---

## 4. API Route

### GET /api/images/search

```
Query: ?q=여행&page=1
Action: Unsplash API 호출 (서버에서 → API 키 노출 방지)
Response: { photos: UnsplashPhoto[] }
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
| Backend 없음 | 저장=PNG 다운로드, 공유=Web Share API → 서버 불필요 |
| DB 없음 | 런타임 상태만 필요, 브라우저 메모리로 충분 |
| Unsplash API Route | UNSPLASH_ACCESS_KEY를 클라이언트에 노출하지 않기 위해 |
| html-to-image | DOM → PNG 변환 가장 간단한 방법, Canvas API 불필요 |
| 위치를 px로 저장 | 고정 캔버스 크기(보드 너비 고정) 기준이므로 px로 충분 |
