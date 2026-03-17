'use client';

import { KEYWORD_CATEGORIES } from '@/lib/keywords';
import type { Language, Keyword } from '@/types';
import { generateId } from '@/lib/generateId';

interface Props {
  lang: Language;
  selected: Keyword[];
  onAdd: (kw: Keyword) => void;
}

export default function KeywordSuggestions({ lang, selected, onAdd }: Props) {
  const selectedTexts = new Set(selected.map(k => k.text));
  const isMax = selected.length >= 10;

  return (
    <div className="flex flex-col gap-4">
      {KEYWORD_CATEGORIES.map(cat => (
        <div key={cat.id}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {cat.label[lang]}
          </p>
          <div className="flex flex-wrap gap-2">
            {cat.keywords.map(kw => {
              const displayText = kw[lang];
              const isSelected = selectedTexts.has(displayText);
              return (
                <button
                  key={kw.en}
                  type="button"
                  disabled={isMax && !isSelected}
                  onClick={() => {
                    if (isSelected || isMax) return;
                    onAdd({ id: generateId(), text: displayText, enText: kw.en });
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-indigo-100 disabled:opacity-40'
                  }`}
                >
                  {displayText}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
