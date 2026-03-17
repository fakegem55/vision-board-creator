import { detectLang, translateToEnglish, translateKeywords } from '@/lib/translate';

// localStorage mock
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

describe('detectLang', () => {
  it('한국어를 감지한다', () => {
    expect(detectLang('여행')).toBe('ko');
    expect(detectLang('건강')).toBe('ko');
  });

  it('일본어(히라가나/가타카나)를 감지한다', () => {
    expect(detectLang('りょこう')).toBe('ja');
    expect(detectLang('ヨガ')).toBe('ja');
  });

  it('중국어(한자)를 감지한다', () => {
    expect(detectLang('旅行')).toBe('zh'); // 한자 → 중국어
    expect(detectLang('健康')).toBe('zh');
  });

  it('영어는 other를 반환한다', () => {
    expect(detectLang('travel')).toBe('other');
    expect(detectLang('health')).toBe('other');
  });
});

describe('translateToEnglish', () => {
  beforeEach(() => {
    localStorageMock.clear();
    global.fetch = jest.fn();
  });

  it('사전에 있는 한국어 키워드는 API 없이 반환한다', async () => {
    const result = await translateToEnglish('여행');
    expect(result).toBe('travel');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('사전에 없는 한국어는 API를 호출한다', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'pickleball' }),
    });
    const result = await translateToEnglish('피클볼');
    expect(result).toBe('pickleball');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('영어 텍스트는 API 호출 없이 그대로 반환한다', async () => {
    const result = await translateToEnglish('travel');
    expect(result).toBe('travel');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('API 실패 시 원본 텍스트를 반환한다', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
    const result = await translateToEnglish('피클볼');
    expect(result).toBe('피클볼');
  });

  it('캐시된 번역은 API를 다시 호출하지 않는다', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'pickleball' }),
    });
    await translateToEnglish('피클볼');
    const result = await translateToEnglish('피클볼');
    expect(result).toBe('pickleball');
    expect(global.fetch).toHaveBeenCalledTimes(1); // 두 번째는 캐시에서
  });
});

describe('translateKeywords', () => {
  beforeEach(() => {
    localStorageMock.clear();
    global.fetch = jest.fn();
  });

  it('사전 키워드는 API 없이 번역한다', async () => {
    const result = await translateKeywords(['여행', '건강']);
    expect(result).toEqual(['travel', 'health']);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('영어 키워드는 번역 없이 그대로 유지된다', async () => {
    const result = await translateKeywords(['travel', 'health']);
    expect(result).toEqual(['travel', 'health']);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
