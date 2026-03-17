import { render, screen } from '@testing-library/react';
import BoardCanvas from '@/components/BoardCanvas';
import type { BoardData } from '@/types';

const mockBoard: BoardData = {
  affirmation: '나는 매일 성장한다',
  items: [
    {
      keyword: '여행',
      photo: { id: 'p1', url: '/img1.jpg', thumbUrl: '/t1.jpg', altText: '바다', credit: 'A' },
      layout: { x: 0, y: 0, width: 390, height: 690 },
    },
  ],
};

describe('BoardCanvas', () => {
  it('보드 캔버스가 렌더링된다', () => {
    render(<BoardCanvas board={mockBoard} />);
    expect(screen.getByTestId('board-canvas')).toBeInTheDocument();
  });

  it('다짐 텍스트가 표시된다', () => {
    render(<BoardCanvas board={mockBoard} />);
    expect(screen.getByText('나는 매일 성장한다')).toBeInTheDocument();
  });

  it('다짐 텍스트가 없으면 텍스트 영역이 렌더링되지 않는다', () => {
    render(<BoardCanvas board={{ ...mockBoard, affirmation: '' }} />);
    expect(screen.queryByText('나는 매일 성장한다')).not.toBeInTheDocument();
  });

  it('이미지 아이템이 렌더링된다', () => {
    render(<BoardCanvas board={mockBoard} />);
    expect(screen.getByAltText('바다')).toBeInTheDocument();
  });

  it('여러 이미지 아이템이 모두 렌더링된다', () => {
    const twoItems: BoardData = {
      affirmation: '',
      items: [
        { keyword: '여행', photo: { id: 'p1', url: '/img1.jpg', thumbUrl: '/t1.jpg', altText: '바다', credit: 'A' }, layout: { x: 0, y: 0, width: 195, height: 690 } },
        { keyword: '건강', photo: { id: 'p2', url: '/img2.jpg', thumbUrl: '/t2.jpg', altText: '산', credit: 'B' }, layout: { x: 195, y: 0, width: 195, height: 690 } },
      ],
    };
    render(<BoardCanvas board={twoItems} />);
    expect(screen.getByAltText('바다')).toBeInTheDocument();
    expect(screen.getByAltText('산')).toBeInTheDocument();
  });
});
