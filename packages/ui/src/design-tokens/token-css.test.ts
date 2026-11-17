import { describe, expect, it } from 'vitest';
import { parseCustomProperties, resolveProperty } from './token-css.ts';

const css = `
:root {
  --raw: #112233;
  --meaning: var(--raw);
  --alias: var(--meaning);
  --size: 14px;
}

[data-theme='dark'] {
}

[data-theme='light'] {
  --raw: #445566;
}
`;

describe('parseCustomProperties', () => {
  it('reads the declarations of the selected block', () => {
    expect(parseCustomProperties(css, ':root')).toEqual({
      '--raw': '#112233',
      '--meaning': 'var(--raw)',
      '--alias': 'var(--meaning)',
      '--size': '14px',
    });
  });

  it('escapes special characters in the selector', () => {
    expect(parseCustomProperties(css, "[data-theme='light']")).toEqual({ '--raw': '#445566' });
  });

  it('returns an empty object for an empty or missing block', () => {
    expect(parseCustomProperties(css, "[data-theme='dark']")).toEqual({});
    expect(parseCustomProperties(css, '.missing')).toEqual({});
  });
});

describe('resolveProperty', () => {
  const properties = parseCustomProperties(css, ':root');

  it('returns a plain value as is', () => {
    expect(resolveProperty(properties, '--size')).toBe('14px');
  });

  it('follows var() references to the raw value', () => {
    expect(resolveProperty(properties, '--alias')).toBe('#112233');
  });

  it('throws for an unknown token', () => {
    expect(() => resolveProperty(properties, '--missing')).toThrow('Unknown token: --missing');
  });

  it('throws on a reference loop', () => {
    expect(() => resolveProperty({ '--a': 'var(--b)', '--b': 'var(--a)' }, '--a')).toThrow('Token reference loop');
  });
});
