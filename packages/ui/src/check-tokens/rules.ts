export interface Violation {
  readonly line: number;
  readonly rule: string;
  readonly match: string;
}

interface Rule {
  readonly name: string;
  readonly pattern: RegExp;
}

const PALETTE_NAMES =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const COLOR_UTILITIES =
  'bg|text|border|ring|fill|stroke|from|to|via|outline|divide|accent|caret|decoration|shadow|placeholder';

const RULES: readonly Rule[] = [
  { name: 'raw color: hex', pattern: /(?<![\w&])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})(?![\w-])/gi },
  { name: 'raw color: color function', pattern: /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/gi },
  {
    name: 'Tailwind default palette class',
    pattern: new RegExp(
      `(?<![\\w-])(?:[a-z0-9-]+:)*(?:${COLOR_UTILITIES})-(?:(?:${PALETTE_NAMES})-\\d{2,3}|white|black)(?![\\w-])`,
      'g',
    ),
  },
  {
    name: 'Tailwind arbitrary value',
    pattern: /(?<![\w-])(?:[a-z0-9-]+:)*-?[a-z]+(?:-[a-z]+)*-\[(?!var\(--)[\w.%#,()/:+*-]+\]/g,
  },
];

export function findViolations(content: string): Violation[] {
  const violations: Violation[] = [];
  content.split('\n').forEach((text, index) => {
    for (const rule of RULES) {
      for (const found of text.matchAll(rule.pattern)) {
        violations.push({ line: index + 1, rule: rule.name, match: found[0] });
      }
    }
  });
  return violations;
}
