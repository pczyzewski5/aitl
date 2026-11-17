import { describe, expect, it } from 'vitest';
import { contrastRatio, formatRatio, parseHexColor, relativeLuminance } from './contrast.ts';

describe('parseHexColor', () => {
  it('parses a six digit hex color', () => {
    expect(parseHexColor('#2563eb')).toEqual([37, 99, 235]);
  });

  it('accepts surrounding whitespace and uppercase digits', () => {
    expect(parseHexColor('  #FFFFFF ')).toEqual([255, 255, 255]);
  });

  it.each(['red', '#fff', 'var(--x)', ''])('rejects %j', (value) => {
    expect(() => parseHexColor(value)).toThrow('Not a six digit hex color');
  });
});

describe('relativeLuminance', () => {
  it('is 1 for white and 0 for black', () => {
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 5);
    expect(relativeLuminance([0, 0, 0])).toBe(0);
  });

  it('uses the linear segment for very dark channels', () => {
    expect(relativeLuminance([10, 10, 10])).toBeCloseTo(0.003035, 5);
  });
});

describe('contrastRatio', () => {
  it('is 21 between black and white in either order', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
    expect(contrastRatio([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 5);
  });

  it('is 1 for identical colors', () => {
    expect(contrastRatio([37, 99, 235], [37, 99, 235])).toBeCloseTo(1, 5);
  });
});

describe('formatRatio', () => {
  it('formats with two decimals and a comma', () => {
    expect(formatRatio(14.6812)).toBe('14,68');
    expect(formatRatio(21)).toBe('21,00');
  });
});
