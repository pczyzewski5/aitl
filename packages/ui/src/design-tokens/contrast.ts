export type Rgb = readonly [number, number, number];

const HEX_COLOR = /^#([0-9a-f]{6})$/i;
const SRGB_LINEAR_THRESHOLD = 0.04045;
const LUMINANCE_OFFSET = 0.05;
const RED_WEIGHT = 0.2126;
const GREEN_WEIGHT = 0.7152;
const BLUE_WEIGHT = 0.0722;

export function parseHexColor(value: string): Rgb {
  const match = HEX_COLOR.exec(value.trim());
  if (!match?.[1]) {
    throw new Error(`Not a six digit hex color: ${value}`);
  }
  const digits = match[1];
  return [parseInt(digits.slice(0, 2), 16), parseInt(digits.slice(2, 4), 16), parseInt(digits.slice(4, 6), 16)];
}

function toLinear(channel: number): number {
  const scaled = channel / 255;
  return scaled <= SRGB_LINEAR_THRESHOLD ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance([red, green, blue]: Rgb): number {
  return RED_WEIGHT * toLinear(red) + GREEN_WEIGHT * toLinear(green) + BLUE_WEIGHT * toLinear(blue);
}

export function contrastRatio(foreground: Rgb, background: Rgb): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + LUMINANCE_OFFSET) / (darker + LUMINANCE_OFFSET);
}

export function formatRatio(ratio: number): string {
  return ratio.toFixed(2).replace('.', ',');
}
