import { describe, expect, it } from 'vitest';
import RootLayout, { metadata } from './layout';

describe('RootLayout', () => {
  it('wraps the children in an html document with Polish language', () => {
    const child = <main>content</main>;

    const actual = RootLayout({ children: child });

    expect(actual.type).toBe('html');
    expect(actual.props.lang).toBe('pl');
    expect(actual.props.children.type).toBe('body');
    expect(actual.props.children.props.children).toBe(child);
  });

  it('declares the page title', () => {
    expect(metadata.title).toBe('AITL');
  });
});
