import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const SCRIPT_PATH = resolve(process.cwd(), 'scripts/keychain-env.sh');
const USAGE_EXIT_CODE = 64;
const STORED_SECRET = 'stub-secret-value';

let stubDir: string;

function writeStubSecurity(body: string): void {
  const stubPath = join(stubDir, 'security');
  writeFileSync(stubPath, `#!/bin/bash\n${body}\n`);
  chmodSync(stubPath, 0o755);
}

function runScript(args: string[]) {
  return spawnSync('/bin/bash', [SCRIPT_PATH, ...args], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${stubDir}:${process.env.PATH}`, USER: 'tester' },
  });
}

describe('keychain-env.sh', () => {
  beforeEach(() => {
    stubDir = mkdtempSync(join(tmpdir(), 'keychain-stub-'));
  });

  afterEach(() => {
    rmSync(stubDir, { recursive: true, force: true });
  });

  it('prints usage and exits 64 for an unknown subcommand', () => {
    const result = runScript(['nope']);

    expect(result.status).toBe(USAGE_EXIT_CODE);
    expect(result.stderr).toContain('Usage');
  });

  it('init stores a new secret when none exists', () => {
    writeStubSecurity('[ "$1" = "find-generic-password" ] && exit 44; echo "$@" >&2; exit 0');

    const result = runScript(['init']);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Stored a new random secret');
    expect(result.stderr).toContain('add-generic-password -a tester -s aitl-session-secret');
  });

  it('init is a no-op when the secret already exists', () => {
    writeStubSecurity('[ "$1" = "find-generic-password" ] && exit 0; echo unexpected-add >&2; exit 1');

    const result = runScript(['init']);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('already in the Keychain');
    expect(result.stderr).not.toContain('unexpected-add');
  });

  it('run requires a command', () => {
    writeStubSecurity(`echo ${STORED_SECRET}`);

    const result = runScript(['run']);

    expect(result.status).toBe(USAGE_EXIT_CODE);
  });

  it('run fails with a hint when the secret is missing', () => {
    writeStubSecurity('exit 44');

    const result = runScript(['run', 'true']);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('npm run keychain:init');
  });

  it('run exposes the stored secret to the command as SESSION_SECRET', () => {
    writeStubSecurity(`echo ${STORED_SECRET}`);

    const result = runScript(['run', 'sh', '-c', 'printf %s "$SESSION_SECRET"']);

    expect(result.status).toBe(0);
    expect(result.stdout).toBe(STORED_SECRET);
  });
});
