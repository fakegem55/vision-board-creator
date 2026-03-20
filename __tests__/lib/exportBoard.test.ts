import { exportToPng, downloadBoard, shareBoard } from '@/lib/exportBoard';

jest.mock('html-to-image', () => ({
  toPng: jest.fn().mockResolvedValue('data:image/png;base64,ABC'),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeBlob(type = 'image/png') {
  return new Blob(['fake'], { type });
}

function makeElement(withBackdrop = false, imgSrcs: string[] = []): HTMLElement {
  const div = document.createElement('div');
  if (withBackdrop) {
    const inner = document.createElement('div');
    inner.style.backdropFilter = 'blur(6px)';
    div.appendChild(inner);
  }
  imgSrcs.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    div.appendChild(img);
  });
  return div;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    blob: () => Promise.resolve(makeBlob()),
  });
  // FileReader mock
  const mockFileReader = {
    readAsDataURL: jest.fn(function (this: FileReader) {
      this.onloadend?.({} as ProgressEvent);
    }),
    onloadend: null as ((e: ProgressEvent) => void) | null,
    result: 'data:image/png;base64,IMGBASE64',
  };
  jest.spyOn(global, 'FileReader' as keyof typeof global).mockImplementation(
    () => mockFileReader as unknown as FileReader
  );
});

describe('exportToPng', () => {
  it('removes backdrop-filter from clone', async () => {
    const el = makeElement(true);
    await exportToPng(el);
    // original element should be untouched
    const inner = el.querySelector<HTMLElement>('div');
    expect(inner?.style.backdropFilter).toBe('blur(6px)');
  });

  it('converts external img src to base64', async () => {
    const el = makeElement(false, ['https://example.com/photo.jpg']);
    await exportToPng(el);
    // fetch should have been called for the external image
    expect(mockFetch).toHaveBeenCalledWith('https://example.com/photo.jpg', { mode: 'cors' });
  });

  it('skips data: URLs when converting images', async () => {
    const el = makeElement(false, ['data:image/png;base64,ALREADY']);
    await exportToPng(el);
    // only the final fetch(dataUrl) from toPng result — not for data: img
    expect(mockFetch).not.toHaveBeenCalledWith('data:image/png;base64,ALREADY', expect.anything());
  });

  it('returns data URL from toPng', async () => {
    const el = makeElement();
    const result = await exportToPng(el);
    expect(result).toBe('data:image/png;base64,ABC');
  });

  it('removes clone from document after export', async () => {
    const el = makeElement();
    const spy = jest.spyOn(document.body, 'removeChild');
    await exportToPng(el);
    expect(spy).toHaveBeenCalled();
  });
});

describe('downloadBoard', () => {
  it('creates and clicks a download link', async () => {
    const el = makeElement();
    const mockAnchor = document.createElement('a');
    mockAnchor.click = jest.fn();
    const createSpy = jest
      .spyOn(document, 'createElement')
      .mockImplementationOnce(() => mockAnchor);
    await downloadBoard(el);
    expect(mockAnchor.click).toHaveBeenCalled();
    createSpy.mockRestore();
  });
});

describe('shareBoard', () => {
  it('calls navigator.share when available', async () => {
    const el = makeElement();
    const mockShare = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: mockShare, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    await shareBoard(el);
    expect(mockShare).toHaveBeenCalled();
  });
});
