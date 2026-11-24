import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNodeDependencies } from './node-dependencies.ts';

describe('createNodeDependencies', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'aitl-setup-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('exposes the running Node version', () => {
    const actual = createNodeDependencies(root).nodeVersion;

    expect(actual).toBe(process.versions.node);
  });

  it('captures output of a command run in the root', () => {
    const sut = createNodeDependencies(root);
    const script = 'process.stdout.write(process.cwd()); process.stderr.write("e"); process.exit(3)';

    const actual = sut.runCommand(process.execPath, ['-e', script]);

    expect(actual).toEqual({ status: 3, stdout: realpathSync(root), stderr: 'e' });
  });

  it('returns empty output when the command cannot be spawned', () => {
    const sut = createNodeDependencies(root);

    const actual = sut.runCommand('aitl-command-that-does-not-exist', []);

    expect(actual).toEqual({ status: null, stdout: '', stderr: '' });
  });

  it('runs a command with inherited output without capturing it', () => {
    const sut = createNodeDependencies(root);

    const actual = sut.runCommand(process.execPath, ['-e', '0'], { inheritOutput: true });

    expect(actual).toEqual({ status: 0, stdout: '', stderr: '' });
  });

  it('reads files relative to the root', () => {
    const sut = createNodeDependencies(root);
    writeFileSync(join(root, 'a.txt'), 'content');

    expect([sut.fileExists('a.txt'), sut.fileExists('b.txt')]).toEqual([true, false]);
    expect(sut.modifiedAtMs('a.txt')).toBeGreaterThan(0);
    expect(sut.modifiedAtMs('b.txt')).toBeUndefined();
  });

  it('copies files relative to the root', () => {
    const sut = createNodeDependencies(root);
    writeFileSync(join(root, 'a.txt'), 'content');

    sut.copyFile('a.txt', 'b.txt');

    expect(readFileSync(join(root, 'b.txt'), 'utf8')).toBe('content');
  });

  it('writes to stdout and stderr', () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    const sut = createNodeDependencies(root);

    sut.writeOut('out');
    sut.writeErr('err');

    expect(stdout).toHaveBeenCalledWith('out');
    expect(stderr).toHaveBeenCalledWith('err');
  });

  it('provides a clock and a sleep', async () => {
    const sut = createNodeDependencies(root);
    const before = sut.nowMs();

    await sut.sleep(5);

    expect(sut.nowMs()).toBeGreaterThanOrEqual(before);
  });
});
