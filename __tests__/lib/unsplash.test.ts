import { mapUnsplashPhoto, searchPhotos } from '@/lib/unsplash';

// localStorage mock (캐시 격리)
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

const mockRaw = {
  id: 'abc123',
  urls: { regular: 'https://img.example.com/regular', thumb: 'https://img.example.com/thumb' },
  alt_description: '아름다운 산',
  user: { name: '홍길동' },
};

describe('mapUnsplashPhoto', () => {
  it('API 응답을 UnsplashPhoto 형식으로 변환한다', () => {
    const result = mapUnsplashPhoto(mockRaw);
    expect(result).toEqual({
      id: 'abc123',
      url: 'https://img.example.com/regular',
      thumbUrl: 'https://img.example.com/thumb',
      altText: '아름다운 산',
      credit: '홍길동',
    });
  });

  it('alt_description이 null이면 빈 문자열로 처리한다', () => {
    const result = mapUnsplashPhoto({ ...mockRaw, alt_description: null });
    expect(result.altText).toBe('');
  });
});

describe('searchPhotos', () => {
  beforeEach(() => {
    localStorageMock.clear();
    global.fetch = jest.fn();
  });

  it('API 호출 성공 시 사진 배열을 반환한다', async () => {
    const mockPhotos = [{ id: '1', url: 'u', thumbUrl: 't', altText: '', credit: 'c' }];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ photos: mockPhotos }),
    });

    const result = await searchPhotos('여행', 1);
    expect(result).toEqual(mockPhotos);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/images/search?q=%EC%97%AC%ED%96%89&page=1'
    );
  });

  it('API 호출 실패 시 에러를 던진다', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });
    await expect(searchPhotos('여행')).rejects.toThrow('Image search failed: 500');
  });
});
