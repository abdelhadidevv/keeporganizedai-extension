import type React from 'react';

export interface HighlightMatch {
  start: number;
  end: number;
}

export function findMatchPositions(text: string, query: string): HighlightMatch[] {
  if (!query.trim()) {
    return [];
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matches: HighlightMatch[] = [];
  let startIndex = 0;

  while (true) {
    const index = lowerText.indexOf(lowerQuery, startIndex);
    if (index === -1) break;
    matches.push({ start: index, end: index + query.length });
    startIndex = index + 1;
  }

  return matches;
}

export function highlightText(
  text: string,
  query: string,
  highlightClassName: string = 'bg-[var(--color-warning)]/40 text-foreground rounded px-0.5'
): React.ReactNode {
  const matches = findMatchPositions(text, query);

  if (matches.length === 0) {
    return text;
  }

  const result: React.ReactNode[] = [];
  let lastEnd = 0;

  matches.forEach((match, index) => {
    if (match.start > lastEnd) {
      result.push(text.slice(lastEnd, match.start));
    }
    result.push(
      <mark key={index} className={highlightClassName}>
        {text.slice(match.start, match.end)}
      </mark>
    );
    lastEnd = match.end;
  });

  if (lastEnd < text.length) {
    result.push(text.slice(lastEnd));
  }

  return result;
}
