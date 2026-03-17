import { toPng } from 'html-to-image';

export async function exportToPng(element: HTMLElement): Promise<string> {
  return toPng(element, { cacheBust: true, pixelRatio: 2 });
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
