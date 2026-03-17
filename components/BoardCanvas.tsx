'use client';

import { forwardRef } from 'react';
import Image from 'next/image';
import type { BoardData } from '@/types';
import { BOARD_WIDTH, BOARD_HEIGHT } from '@/lib/layoutEngine';

interface Props {
  board: BoardData;
}

const BoardCanvas = forwardRef<HTMLDivElement, Props>(({ board }, ref) => {
  return (
    <div
      ref={ref}
      data-testid="board-canvas"
      style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}
      className="relative overflow-hidden rounded-2xl shadow-xl bg-gray-900 mx-auto"
    >
      {board.items.map(item => (
        <div
          key={item.photo.id}
          style={{
            position: 'absolute',
            left: item.layout.x,
            top: item.layout.y,
            width: item.layout.width,
            height: item.layout.height,
          }}
        >
          <Image
            src={item.photo.url}
            alt={item.photo.altText || item.keyword}
            fill
            className="object-cover"
            sizes={`${item.layout.width}px`}
            unoptimized
          />
        </div>
      ))}

      {board.affirmation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="mx-6 px-6 py-4 rounded-2xl text-center"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
          >
            <p
              className="text-white text-2xl leading-snug tracking-wide"
              style={{ fontFamily: 'var(--font-dancing), cursive' }}
            >
              {board.affirmation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

BoardCanvas.displayName = 'BoardCanvas';
export default BoardCanvas;
