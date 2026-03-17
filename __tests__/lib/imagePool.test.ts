import { getPoolPhotos, IMAGE_POOL } from '@/lib/imagePool';
import type { UnsplashPhoto } from '@/types';

const PHOTO_A: UnsplashPhoto = {
  id: 'photo-1',
  url: 'https://images.unsplash.com/photo-1',
  thumbUrl: 'https://images.unsplash.com/thumb-1',
  altText: 'travel photo',
  credit: 'Alice',
};
const PHOTO_B: UnsplashPhoto = {
  id: 'photo-2',
  url: 'https://images.unsplash.com/photo-2',
  thumbUrl: 'https://images.unsplash.com/thumb-2',
  altText: 'travel photo 2',
  credit: 'Bob',
};

beforeEach(() => {
  IMAGE_POOL['travel'] = [PHOTO_A, PHOTO_B];
  delete IMAGE_POOL['__nonexistent__'];
});

describe('getPoolPhotos', () => {
  it('존재하는 키워드에 대해 사진 배열을 반환한다', () => {
    const result = getPoolPhotos('travel');
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('photo-1');
  });

  it('없는 키워드에 대해 빈 배열을 반환한다', () => {
    expect(getPoolPhotos('__nonexistent__')).toEqual([]);
  });

  it('shuffled=true 시 결과 길이가 원본과 동일하다', () => {
    const result = getPoolPhotos('travel', true);
    expect(result).toHaveLength(IMAGE_POOL['travel']!.length);
  });

  it('shuffled=true 시 원본 배열을 변경하지 않는다', () => {
    const originalIds = IMAGE_POOL['travel']!.map(p => p.id);
    getPoolPhotos('travel', true);
    expect(IMAGE_POOL['travel']!.map(p => p.id)).toEqual(originalIds);
  });

  it('shuffled=false(기본값)는 원본 순서를 유지한다', () => {
    const result = getPoolPhotos('travel');
    expect(result[0].id).toBe('photo-1');
    expect(result[1].id).toBe('photo-2');
  });
});
