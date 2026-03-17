import type { Language } from '@/types';

export interface KeywordEntry {
  ko: string;
  en: string;
  ja: string;
  zh: string;
}

export interface KeywordCategory {
  id: string;
  label: Record<Language, string>;
  keywords: KeywordEntry[];
}

export const KEYWORD_CATEGORIES: KeywordCategory[] = [
  {
    id: 'health',
    label: { ko: '건강/웰빙', en: 'Health', ja: '健康', zh: '健康' },
    keywords: [
      { ko: '건강', en: 'health', ja: '健康', zh: '健康' },
      { ko: '운동', en: 'fitness', ja: '運動', zh: '运动' },
      { ko: '명상', en: 'meditation', ja: '瞑想', zh: '冥想' },
      { ko: '요가', en: 'yoga', ja: 'ヨガ', zh: '瑜伽' },
      { ko: '수면', en: 'sleep', ja: '睡眠', zh: '睡眠' },
      { ko: '자연', en: 'nature', ja: '自然', zh: '自然' },
    ],
  },
  {
    id: 'travel',
    label: { ko: '여행', en: 'Travel', ja: '旅行', zh: '旅行' },
    keywords: [
      { ko: '여행', en: 'travel', ja: '旅行', zh: '旅行' },
      { ko: '바다', en: 'ocean', ja: '海', zh: '大海' },
      { ko: '산', en: 'mountain', ja: '山', zh: '山' },
      { ko: '도시', en: 'city', ja: '都市', zh: '城市' },
      { ko: '모험', en: 'adventure', ja: '冒険', zh: '冒险' },
      { ko: '세계', en: 'world', ja: '世界', zh: '世界' },
    ],
  },
  {
    id: 'family',
    label: { ko: '가족/관계', en: 'Family', ja: '家族', zh: '家庭' },
    keywords: [
      { ko: '가족', en: 'family', ja: '家族', zh: '家庭' },
      { ko: '사랑', en: 'love', ja: '愛', zh: '爱' },
      { ko: '친구', en: 'friendship', ja: '友情', zh: '友谊' },
      { ko: '결혼', en: 'wedding', ja: '結婚', zh: '婚姻' },
      { ko: '행복', en: 'happiness', ja: '幸福', zh: '幸福' },
    ],
  },
  {
    id: 'career',
    label: { ko: '성공/커리어', en: 'Career', ja: 'キャリア', zh: '职业' },
    keywords: [
      { ko: '성공', en: 'success', ja: '成功', zh: '成功' },
      { ko: '목표', en: 'goal', ja: '目標', zh: '目标' },
      { ko: '성장', en: 'growth', ja: '成長', zh: '成长' },
      { ko: '리더십', en: 'leadership', ja: 'リーダーシップ', zh: '领导力' },
      { ko: '창업', en: 'startup', ja: '起業', zh: '创业' },
    ],
  },
  {
    id: 'finance',
    label: { ko: '재정', en: 'Finance', ja: '財政', zh: '财富' },
    keywords: [
      { ko: '재정적 자유', en: 'financial freedom', ja: '経済的自由', zh: '财务自由' },
      { ko: '부', en: 'wealth', ja: '富', zh: '财富' },
      { ko: '투자', en: 'investment', ja: '投資', zh: '投资' },
      { ko: '풍요', en: 'abundance', ja: '豊かさ', zh: '富足' },
    ],
  },
  {
    id: 'selfdev',
    label: { ko: '자기계발', en: 'Self Growth', ja: '自己啓発', zh: '成长' },
    keywords: [
      { ko: '독서', en: 'reading books', ja: '読書', zh: '阅读' },
      { ko: '공부', en: 'studying', ja: '勉強', zh: '学习' },
      { ko: '창의성', en: 'creativity', ja: '創造性', zh: '创造力' },
      { ko: '지혜', en: 'wisdom', ja: '知恵', zh: '智慧' },
      { ko: '집중', en: 'focus', ja: '集中', zh: '专注' },
    ],
  },
  {
    id: 'lifestyle',
    label: { ko: '라이프스타일', en: 'Lifestyle', ja: 'ライフスタイル', zh: '生活方式' },
    keywords: [
      { ko: '집', en: 'home interior', ja: '家', zh: '家居' },
      { ko: '패션', en: 'fashion', ja: 'ファッション', zh: '时尚' },
      { ko: '음식', en: 'food', ja: '食', zh: '美食' },
      { ko: '예술', en: 'art', ja: '芸術', zh: '艺术' },
      { ko: '음악', en: 'music', ja: '音楽', zh: '音乐' },
      { ko: '미니멀', en: 'minimalist', ja: 'ミニマル', zh: '极简' },
    ],
  },
];

/** 어떤 언어의 키워드든 영어로 반환. 없으면 null. */
export function findEnglish(text: string): string | null {
  const normalized = text.trim().toLowerCase();
  for (const cat of KEYWORD_CATEGORIES) {
    for (const kw of cat.keywords) {
      if (
        kw.ko === text || kw.ja === text || kw.zh === text ||
        kw.en === normalized || kw.en.toLowerCase() === normalized
      ) {
        return kw.en;
      }
    }
  }
  return null;
}
