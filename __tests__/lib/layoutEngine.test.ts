import { buildLayout, BOARD_WIDTH, BOARD_HEIGHT } from '@/lib/layoutEngine';
import type { UnsplashPhoto } from '@/types';

const makePhoto = (id: string): UnsplashPhoto => ({
  id,
  url: `https://example.com/${id}`,
  thumbUrl: `https://example.com/${id}/thumb`,
  altText: '',
  credit: 'tester',
});

function makeSet(n: number) {
  const kws = Array.from({ length: n }, (_, i) => `kw${i}`);
  const photos = kws.map((_, i) => makePhoto(`p${i}`));
  return { kws, photos };
}

describe('buildLayout', () => {
  it('1개 → 전체 보드 크기', () => {
    const { kws, photos } = makeSet(1);
    const items = buildLayout(kws, photos);
    expect(items).toHaveLength(1);
    expect(items[0].layout.width).toBe(BOARD_WIDTH);
    expect(items[0].layout.height).toBe(BOARD_HEIGHT);
  });

  it('2개 → 좌우 반반 (1행)', () => {
    const { kws, photos } = makeSet(2);
    const items = buildLayout(kws, photos);
    expect(items).toHaveLength(2);
    expect(items[0].layout.width).toBeCloseTo(BOARD_WIDTH / 2);
    expect(items[1].layout.x).toBeCloseTo(BOARD_WIDTH / 2);
    expect(items[0].layout.height).toBe(BOARD_HEIGHT); // 1행이므로 전체 높이
  });

  it('3개 → 1행에 3등분', () => {
    const { kws, photos } = makeSet(3);
    const items = buildLayout(kws, photos);
    expect(items).toHaveLength(3);
    items.forEach(item => {
      expect(item.layout.width).toBeCloseTo(BOARD_WIDTH / 3);
    });
  });

  it('4개 → 2×2 그리드 (빈 칸 없음)', () => {
    const { kws, photos } = makeSet(4);
    const items = buildLayout(kws, photos);
    expect(items).toHaveLength(4);
    items.forEach(item => {
      expect(item.layout.width).toBeCloseTo(BOARD_WIDTH / 2);
      expect(item.layout.height).toBeCloseTo(BOARD_HEIGHT / 2);
    });
  });

  it('5개 → [3,2] 행 구성 (빈 칸 없음)', () => {
    const { kws, photos } = makeSet(5);
    const items = buildLayout(kws, photos);
    expect(items).toHaveLength(5);
    // 1행: 3개, 너비 1/3
    expect(items[0].layout.width).toBeCloseTo(BOARD_WIDTH / 3);
    expect(items[2].layout.width).toBeCloseTo(BOARD_WIDTH / 3);
    // 2행: 2개, 너비 1/2
    expect(items[3].layout.width).toBeCloseTo(BOARD_WIDTH / 2);
    expect(items[4].layout.width).toBeCloseTo(BOARD_WIDTH / 2);
  });

  it('7개 → [3,2,2] 행 구성 (빈 칸 없음)', () => {
    const { kws, photos } = makeSet(7);
    const items = buildLayout(kws, photos);
    expect(items).toHaveLength(7);
    // 1행: 3개
    expect(items[0].layout.width).toBeCloseTo(BOARD_WIDTH / 3);
    // 2행: 2개
    expect(items[3].layout.width).toBeCloseTo(BOARD_WIDTH / 2);
    // 3행: 2개
    expect(items[5].layout.width).toBeCloseTo(BOARD_WIDTH / 2);
  });

  it('8개 → [3,3,2] 행 구성 (빈 칸 없음)', () => {
    const { kws, photos } = makeSet(8);
    const items = buildLayout(kws, photos);
    expect(items).toHaveLength(8);
    // 3행: 2개 → 너비 1/2
    expect(items[6].layout.width).toBeCloseTo(BOARD_WIDTH / 2);
    expect(items[7].layout.width).toBeCloseTo(BOARD_WIDTH / 2);
  });

  it('사진이 없는 키워드는 제외된다', () => {
    const items = buildLayout(['여행', '건강'], [makePhoto('p0')]);
    expect(items).toHaveLength(1);
  });

  it('최대 9개까지만 처리한다', () => {
    const { kws, photos } = makeSet(12);
    expect(buildLayout(kws, photos).length).toBeLessThanOrEqual(9);
  });

  it('keyword와 photo가 올바르게 매핑된다', () => {
    const items = buildLayout(['여행'], [makePhoto('p0')]);
    expect(items[0].keyword).toBe('여행');
    expect(items[0].photo.id).toBe('p0');
  });
});
