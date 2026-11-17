import { describe, expect, it } from 'vitest';
import { findViolations } from './rules.ts';

const matches = (content: string): string[] => findViolations(content).map((violation) => violation.match);

describe('findViolations', () => {
  it.each(['#fff', '#2563EB', '#abcd', '#12345678'])('flags the hex color %s', (hex) => {
    expect(matches(`color: ${hex};`)).toEqual([hex]);
  });

  it.each(['rgb(0, 0, 0)', 'rgba(0,0,0,.1)', 'hsl(10 20% 30%)', 'oklch(0.5 0.1 20)'])('flags %s', (color) => {
    expect(findViolations(`color: ${color};`)).toHaveLength(1);
  });

  it.each(['bg-zinc-900', 'text-white', 'bg-indigo-500', 'hover:bg-blue-600', 'dark:md:border-black', 'ring-red-50'])(
    'flags the palette class %s',
    (className) => {
      expect(matches(`<div className="p-4 ${className}">`)).toEqual([className]);
    },
  );

  it.each(['px-[18px]', 'text-[15px]', 'md:w-[50%]', '-mt-[3px]', 'bg-[#fff]'])('flags the arbitrary value %s', (className) => {
    expect(findViolations(`<div className="${className}">`).map((violation) => violation.rule)).toContain(
      'Tailwind arbitrary value',
    );
  });

  it('reports the line number and the rule name', () => {
    const [violation] = findViolations('first\nsecond text-white\nthird');

    expect(violation).toEqual({ line: 2, rule: 'Tailwind default palette class', match: 'text-white' });
  });

  it.each([
    'bg-card text-foreground border-border',
    'bg-primary hover:bg-primary-hover',
    'text-sm px-4 gap-2 rounded-card',
    'w-[var(--sidebar-width)]',
    'color: var(--income);',
    'href="#main-content"',
    '&#39; &amp;',
    'const items = list[0];',
    'text-whitespace',
  ])('does not flag %s', (content) => {
    expect(findViolations(content)).toEqual([]);
  });
});
