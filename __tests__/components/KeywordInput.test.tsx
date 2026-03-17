import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KeywordInput from '@/components/KeywordInput';
import type { Keyword } from '@/types';

const makeKeyword = (text: string): Keyword => ({ id: text, text });
const defaultProps = { lang: 'ko' as const, keywords: [], onChange: jest.fn() };

describe('KeywordInput', () => {
  it('Enter 키로 키워드 태그가 추가된다', async () => {
    const onChange = jest.fn();
    render(<KeywordInput {...defaultProps} onChange={onChange} />);

    await userEvent.type(screen.getByRole('textbox'), '여행{Enter}');
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ text: '여행' })])
    );
  });

  it('스페이스 키로도 키워드가 추가된다', async () => {
    const onChange = jest.fn();
    render(<KeywordInput {...defaultProps} onChange={onChange} />);

    await userEvent.type(screen.getByRole('textbox'), '건강 ');
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ text: '건강' })])
    );
  });

  it('추가 버튼 클릭으로 키워드가 추가된다', async () => {
    const onChange = jest.fn();
    render(<KeywordInput {...defaultProps} onChange={onChange} />);

    await userEvent.type(screen.getByRole('textbox'), '성공');
    await userEvent.click(screen.getByRole('button', { name: '추가' }));
    expect(onChange).toHaveBeenCalled();
  });

  it('X 버튼으로 키워드 태그가 삭제된다', async () => {
    const onChange = jest.fn();
    const keywords = [makeKeyword('여행'), makeKeyword('건강')];
    render(<KeywordInput lang="ko" keywords={keywords} onChange={onChange} />);

    await userEvent.click(screen.getByLabelText('여행 삭제'));
    expect(onChange).toHaveBeenCalledWith([makeKeyword('건강')]);
  });

  it('9개 초과 시 입력 필드가 비활성화된다', () => {
    const keywords = Array.from({ length: 9 }, (_, i) => makeKeyword(`kw${i}`));
    render(<KeywordInput lang="ko" keywords={keywords} onChange={jest.fn()} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('placeholder', '최대 9개까지 입력 가능합니다');
  });

  it('카운터가 현재 키워드 수를 표시한다', () => {
    const keywords = [makeKeyword('여행'), makeKeyword('건강')];
    render(<KeywordInput lang="ko" keywords={keywords} onChange={jest.fn()} />);

    expect(screen.getByText('2 / 9')).toBeInTheDocument();
  });

  it('빈 문자열은 추가되지 않는다', async () => {
    const onChange = jest.fn();
    render(<KeywordInput {...defaultProps} onChange={onChange} />);

    await userEvent.type(screen.getByRole('textbox'), '{Enter}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('English 언어 설정 시 영어 placeholder가 표시된다', () => {
    const keywords = Array.from({ length: 9 }, (_, i) => makeKeyword(`kw${i}`));
    render(<KeywordInput lang="en" keywords={keywords} onChange={jest.fn()} />);

    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Maximum 10 keywords reached');
  });
});
