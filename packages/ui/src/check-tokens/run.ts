import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { findViolations } from './rules.ts';

const SCANNED_EXTENSIONS = ['.ts', '.tsx', '.css', '.mdx'];
const SKIPPED_DIRECTORIES = new Set(['node_modules', 'storybook-static', '.next', 'dist', 'coverage']);
const SKIPPED_SUFFIXES = ['.test.ts', '.test.tsx', '.d.ts'];

export interface CheckTokensInput {
  readonly roots: readonly string[];
  readonly tokensFile: string;
  readonly baseDirectory: string;
}

export interface CheckTokensResult {
  readonly exitCode: number;
  readonly lines: string[];
}

function isScanned(path: string, tokensFile: string): boolean {
  return (
    path !== tokensFile &&
    SCANNED_EXTENSIONS.some((extension) => path.endsWith(extension)) &&
    !SKIPPED_SUFFIXES.some((suffix) => path.endsWith(suffix))
  );
}

export function collectFiles(directory: string, tokensFile: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return SKIPPED_DIRECTORIES.has(entry.name) ? [] : collectFiles(path, tokensFile);
    }
    return isScanned(path, tokensFile) ? [path] : [];
  });
}

export function runCheckTokens({ roots, tokensFile, baseDirectory }: CheckTokensInput): CheckTokensResult {
  const lines = roots
    .flatMap((root) => collectFiles(root, tokensFile))
    .flatMap((path) =>
      findViolations(readFileSync(path, 'utf8')).map(
        (violation) => `${relative(baseDirectory, path)}:${violation.line}: ${violation.rule}: ${violation.match}`,
      ),
    );
  return { exitCode: lines.length === 0 ? 0 : 1, lines };
}
