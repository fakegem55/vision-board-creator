import { toPng } from 'html-to-image';

async function fetchAsBase64(url: string): Promise<string> {
  const res = await fetch(url, { mode: 'cors' });
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function buildExportClone(element: HTMLElement): Promise<HTMLElement> {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = 'fixed';
  clone.style.top = '-9999px';
  clone.style.left = '-9999px';
  document.body.appendChild(clone);

  // iOS WebKit: backdrop-filter inside SVG foreignObject causes black canvas
  clone.querySelectorAll<HTMLElement>('*').forEach(el => {
    if (el.style.backdropFilter || el.style.webkitBackdropFilter) {
      el.style.backdropFilter = 'none';
      el.style.webkitBackdropFilter = 'none';
      el.style.background = 'rgba(0,0,0,0.6)';
    }
  });

  // iOS Safari: external images cause canvas taint — convert to base64
  const imgs = clone.querySelectorAll<HTMLImageElement>('img');
  await Promise.all(
    Array.from(imgs).map(async img => {
      const src = img.currentSrc || img.src;
      if (!src || src.startsWith('data:')) return;
      try {
        img.src = await fetchAsBase64(src);
        img.srcset = '';
      } catch {
        // leave as-is if fetch fails
      }
    })
  );

  return clone;
}

export async function exportToPng(element: HTMLElement): Promise<string> {
  const clone = await buildExportClone(element);
  try {
    return await toPng(clone, { cacheBust: true, pixelRatio: 2 });
  } finally {
    document.body.removeChild(clone);
  }
}

export async function downloadBoard(element: HTMLElement): Promise<void> {
  const dataUrl = await exportToPng(element);
  const link = document.createElement('a');
  link.download = 'vision-board.png';
  link.href = dataUrl;
  link.click();
}

export async function shareBoard(element: HTMLElement): Promise<void> {
  const dataUrl = await exportToPng(element);
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], 'vision-board.png', { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: '나의 비전보드' });
  } else {
    downloadBoard(element);
  }
}
