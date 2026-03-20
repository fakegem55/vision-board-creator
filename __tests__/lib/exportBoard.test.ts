import { renderBoardToDataUrl, downloadBoard, shareBoard, isIOS } from '@/lib/exportBoard';
import type { BoardData } from '@/types';

// Mock canvas
const mockToDataURL = jest.fn().mockReturnValue('data:image/png;base64,CANVAS');
const mockCtx = {
  scale: jest.fn(),
  fillRect: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
  drawImage: jest.fn(),
  fillText: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  arcTo: jest.fn(),
  closePath: jest.fn(),
  measureText: jest.fn().mockReturnValue({ width: 50 }),
  fill: jest.fn(),
  fillStyle: '',
  font: '',
  textAlign: '',
  textBaseline: '',
};
HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockCtx);
HTMLCanvasElement.prototype.toDataURL = mockToDataURL;

// Mock image loading
const mockImage = {
  crossOrigin: '',
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: '',
  naturalWidth: 100,
  naturalHeight: 100,
};
jest.spyOn(global, 'Image' as keyof typeof global).mockImplementation(() => {
  const img = { ...mockImage };
  setTimeout(() => img.onload?.(), 0);
  return img as unknown as HTMLImageElement;
});

// Mock document.fonts
Object.defineProperty(document, 'fonts', {
  value: { ready: Promise.resolve() },
  configurable: true,
});

const mockFetch = jest.fn();
global.fetch = mockFetch;

const testBoard: BoardData = {
  items: [
    {
      keyword: 'health',
      photo: { id: '1', url: 'https://example.com/photo.jpg', thumbUrl: '', altText: '', credit: '' },
      layout: { x: 0, y: 0, width: 195, height: 345 },
    },
  ],
  affirmation: '',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({ blob: () => Promise.resolve(new Blob(['fake'], { type: 'image/png' })) });
});

describe('renderBoardToDataUrl', () => {
  it('creates a canvas and returns a data URL', async () => {
    const result = await renderBoardToDataUrl(testBoard);
    expect(result).toBe('data:image/png;base64,CANVAS');
    expect(mockCtx.scale).toHaveBeenCalledWith(2, 2);
    expect(mockCtx.fillRect).toHaveBeenCalled();
  });

  it('draws affirmation overlay when present', async () => {
    const board: BoardData = { ...testBoard, affirmation: 'I grow every day' };
    await renderBoardToDataUrl(board);
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.fillText).toHaveBeenCalled();
  });

  it('fills gray on image load failure', async () => {
    jest.spyOn(global, 'Image' as keyof typeof global).mockImplementationOnce(() => {
      const img = { ...mockImage };
      setTimeout(() => img.onerror?.(), 0);
      return img as unknown as HTMLImageElement;
    });
    await renderBoardToDataUrl(testBoard);
    // fillRect called for background + fallback gray
    expect(mockCtx.fillRect).toHaveBeenCalledTimes(2);
  });
});

describe('downloadBoard', () => {
  it('triggers <a> download on non-iOS', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      configurable: true,
    });
    const mockAnchor = document.createElement('a');
    mockAnchor.click = jest.fn();
    const original = document.createElement.bind(document);
    const spy = jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return mockAnchor;
      return original(tag as keyof HTMLElementTagNameMap);
    });
    await downloadBoard(testBoard);
    expect(mockAnchor.click).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('skips download and returns dataUrl on iOS', async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
      configurable: true,
    });
    const spy = jest.spyOn(document, 'createElement');
    const dataUrl = await downloadBoard(testBoard);
    expect(dataUrl).toBe('data:image/png;base64,CANVAS');
    // no <a> element created for download
    expect(spy).not.toHaveBeenCalledWith('a');
    spy.mockRestore();
  });
});

describe('shareBoard', () => {
  it('calls navigator.share when available', async () => {
    const mockShare = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: mockShare, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    await shareBoard(testBoard);
    expect(mockShare).toHaveBeenCalled();
  });
});

describe('isIOS', () => {
  it('returns true for iPhone user agent', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
      configurable: true,
    });
    expect(isIOS()).toBe(true);
  });

  it('returns false for desktop user agent', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0)',
      configurable: true,
    });
    expect(isIOS()).toBe(false);
  });
});
