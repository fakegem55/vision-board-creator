import type { LayoutRect, UnsplashPhoto, BoardItem } from '@/types';

export const BOARD_WIDTH = 390;
export const BOARD_HEIGHT = 690;

/** 개수별 행 구성 (각 행의 이미지 수) */
function buildRowPlan(count: number): number[] {
  if (count <= 3) return [count];
  if (count === 4) return [2, 2];
  if (count === 5) return [3, 2];
  if (count === 6) return [3, 3];
  if (count === 7) return [3, 2, 2];
  if (count === 8) return [3, 3, 2];
  return [3, 3, 3]; // 9
}

/** 행 계획에 따라 각 이미지의 위치/크기를 계산 */
function buildRects(count: number): LayoutRect[] {
  const rows = buildRowPlan(count);
  const cellH = BOARD_HEIGHT / rows.length;
  const rects: LayoutRect[] = [];

  rows.forEach((itemsInRow, rowIndex) => {
    const cellW = BOARD_WIDTH / itemsInRow;
    for (let col = 0; col < itemsInRow; col++) {
      rects.push({
        x: col * cellW,
        y: rowIndex * cellH,
        width: cellW,
        height: cellH,
      });
    }
  });

  return rects;
}

export function buildLayout(
  keywords: string[],
  photos: UnsplashPhoto[]
): BoardItem[] {
  const pairs = keywords
    .map((kw, i) => ({ kw, photo: photos[i] }))
    .filter((p): p is { kw: string; photo: UnsplashPhoto } => !!p.photo);

  const count = Math.min(pairs.length, 9);
  const rects = buildRects(count);

  return pairs.slice(0, count).map(({ kw, photo }, i) => ({
    keyword: kw,
    photo,
    layout: rects[i],
  }));
}
