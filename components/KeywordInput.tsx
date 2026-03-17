'use client';

import { useState, KeyboardEvent } from 'react';
import type { Keyword, Language } from '@/types';
import { t } from '@/lib/i18n';
import { generateId } from '@/lib/generateId';

const MAX_KEYWORDS = 9;

interface Props {
  lang: Language;
  keywords: Keyword[];
  onChange: (keywords: Keyword[]) => void;
}

export default function KeywordInput({ lang, keywords, onChange }: Props) {
  const [input, setInput] = useState('');
  const s = t(lang);

  function addKeyword() {
    const text = input.trim();
    if (!text || keywords.length >= MAX_KEYWORDS) return;
    if (keywords.some(k => k.text === text)) { setInput(''); return; }
    onChange([...keywords, { id: generateId(), text }]);
    setInput('');
  }

  function removeKeyword(id: string) {
    onChange(keywords.filter(k => k.id !== id));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addKeyword(); }
  }

  const isMax = keywords.length >= MAX_KEYWORDS;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {keywords.map(kw => (
          <span
            key={kw.id}
            className="flex items-center gap-1 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium"
          >
            {kw.text}
            <button
              type="button"
              onClick={() => removeKeyword(kw.id)}
              aria-label={`${kw.text} 삭제`}
              className="ml-1 text-indigo-500 hover:text-indigo-800 leading-none"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isMax}
          placeholder={isMax ? s.keywordMaxPlaceholder : s.keywordPlaceholder}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100 disabled:text-gray-400"
          aria-label="키워드 입력"
        />
        <button
          type="button"
          onClick={addKeyword}
          disabled={isMax || !input.trim()}
          className="px-4 py-3 bg-indigo-500 text-white rounded-xl font-medium disabled:opacity-40 min-w-[56px]"
        >
          {s.addButton}
        </button>
      </div>

      <p className="text-xs text-gray-400 text-right">{s.count(keywords.length, MAX_KEYWORDS)}</p>
    </div>
  );
}
