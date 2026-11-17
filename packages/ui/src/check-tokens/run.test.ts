import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { collectFiles, runCheckTokens } from './run.ts';

let base: string;

const write = (relativePath: string, content: string): string => {
  const path = join(base, relativePath);
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, content);
  return path;
};

beforeEach(() => {
  base = mkdtempSync(join(tmpdir(), 'check-tokens-'));
});

afterEach(() => {
  rmSync(base, { recursive: true, force: true });
});

describe('collectFiles', () => {
  it('collects scanned files and skips tokens, tests, declarations, other extensions and ignored directories', () => {
    const tokens = write('src/tokens.css', ':root { --a: #fff; }');
    const kept = [
      write('src/a.tsx', ''),
      write('src/nested/b.ts', ''),
      write('src/c.css', ''),
      write('src/d.mdx', ''),
    ];
    write('src/a.test.tsx', '');
    write('src/b.test.ts', '');
    write('src/types.d.ts', '');
    write('src/image.png', '');
    write('src/node_modules/x.ts', '');
    write('src/storybook-static/y.ts', '');

    const actual = collectFiles(join(base, 'src'), tokens);

    expect(actual.sort()).toEqual(kept.sort());
  });
});

describe('runCheckTokens', () => {
  it('passes when nothing is outside the tokens', () => {
    write('src/tokens.css', ':root { --a: #ffffff; }');
    write('src/ok.tsx', '<div className="bg-card text-foreground p-4" />');

    const actual = runCheckTokens({
      roots: [join(base, 'src')],
      tokensFile: join(base, 'src', 'tokens.css'),
      baseDirectory: base,
    });

    expect(actual).toEqual({ exitCode: 0, lines: [] });
  });

  it('fails and prints file:line for every violation, across roots', () => {
    write('src/tokens.css', ':root { --a: #ffffff; }');
    write('src/bad.tsx', 'const ok = 1;\n<div className="bg-zinc-900 px-[18px]" />');
    write('app/page.tsx', 'const color = "#ff0000";');

    const actual = runCheckTokens({
      roots: [join(base, 'src'), join(base, 'app')],
      tokensFile: join(base, 'src', 'tokens.css'),
      baseDirectory: base,
    });

    expect(actual).toEqual({
      exitCode: 1,
      lines: [
        'src/bad.tsx:2: Tailwind default palette class: bg-zinc-900',
        'src/bad.tsx:2: Tailwind arbitrary value: px-[18px]',
        'app/page.tsx:1: raw color: hex: #ff0000',
      ],
    });
  });
});
