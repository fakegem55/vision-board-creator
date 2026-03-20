import type { BoardData } from '@/types';
import { BOARD_WIDTH, BOARD_HEIGHT } from '@/lib/layoutEngine';

const PIXEL_RATIO = 2;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    img.src = url;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const boxRatio = w / h;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (imgRatio > boxRatio) {
    sw = img.naturalHeight * boxRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / boxRatio;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function drawAffirmation(ctx: CanvasRenderingContext2D, text: string) {
  await document.fonts.ready;
  const pad = 24;
  const maxW = BOARD_WIDTH - pad * 2 - 24;
  ctx.font = 'italic 24px "Dancing Script", cursive';
  const lines = wrapText(ctx, text, maxW);
  const lineH = 34;
  const boxH = lines.length * lineH + 20;
  const boxY = (BOARD_HEIGHT - boxH) / 2;
  const r = 16;
  const x1 = pad, x2 = BOARD_WIDTH - pad;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.moveTo(x1 + r, boxY);
  ctx.lineTo(x2 - r, boxY);
  ctx.arcTo(x2, boxY, x2, boxY + r, r);
  ctx.lineTo(x2, boxY + boxH - r);
  ctx.arcTo(x2, boxY + boxH, x2 - r, boxY + boxH, r);
  ctx.lineTo(x1 + r, boxY + boxH);
  ctx.arcTo(x1, boxY + boxH, x1, boxY + boxH - r, r);
  ctx.lineTo(x1, boxY + r);
  ctx.arcTo(x1, boxY, x1 + r, boxY, r);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => {
    ctx.fillText(line, BOARD_WIDTH / 2, boxY + 10 + (i + 0.5) * lineH, maxW);
  });
}

export async function renderBoardToDataUrl(board: BoardData): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = BOARD_WIDTH * PIXEL_RATIO;
  canvas.height = BOARD_HEIGHT * PIXEL_RATIO;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(PIXEL_RATIO, PIXEL_RATIO);

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

  for (const item of board.items) {
    const { x, y, width, height } = item.layout;
    try {
      const img = await loadImage(item.photo.url);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();
      drawCover(ctx, img, x, y, width, height);
      ctx.restore();
    } catch {
      ctx.fillStyle = '#374151';
      ctx.fillRect(x, y, width, height);
    }
  }

  if (board.affirmation) {
    await drawAffirmation(ctx, board.affirmation);
  }

  return canvas.toDataURL('image/png');
}

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export async function downloadBoard(board: BoardData): Promise<string> {
  const dataUrl = await renderBoardToDataUrl(board);
  if (!isIOS()) {
    const link = document.createElement('a');
    link.download = 'vision-board.png';
    link.href = dataUrl;
    link.click();
  }
  // On iOS: caller shows modal so user can long-press to save to Photos
  return dataUrl;
}

export async function shareBoard(board: BoardData): Promise<void> {
  const dataUrl = await renderBoardToDataUrl(board);
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], 'vision-board.png', { type: 'image/png' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: '나의 비전보드' });
  } else {
    const link = document.createElement('a');
    link.download = 'vision-board.png';
    link.href = dataUrl;
    link.click();
  }
}
