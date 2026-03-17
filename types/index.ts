export type Language = 'ko' | 'en' | 'ja' | 'zh';

export interface Keyword {
  id: string;
  text: string;      // 표시 텍스트 (사용자 언어)
  enText?: string;   // 사전에서 미리 매핑된 영어 (없으면 generateBoard 시 번역)
}

export interface UnsplashPhoto {
  id: string;
  url: string;
  thumbUrl: string;
  altText: string;
  credit: string;
}

export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
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
