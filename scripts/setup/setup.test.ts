import { describe, expect, it } from 'vitest';
import { READINESS_INTERVAL_MS, READINESS_TIMEOUT_MS } from './config.ts';
import { formatNextSteps, runSetup } from './run.ts';
import {
  applyMigrations,
  checkPrerequisites,
  createEnvFile,
  installDependencies,
  isSupportedNodeVersion,
  startPostgres,
} from './steps.ts';
import type { CommandResult, Dependencies } from './types.ts';

interface World {
  nodeVersion: string;
  files: Map<string, number>;
  commandResults: Map<string, CommandResult>;
  readyAfterChecks: number;
  now: number;
}

const OK: CommandResult = { status: 0, stdout: '', stderr: '' };
const FAIL: CommandResult = { status: 1, stdout: '', stderr: '' };
const POSTGRES_RUNNING: CommandResult = { status: 0, stdout: 'postgres\n', stderr: '' };

const freshWorld = (): World => ({
  nodeVersion: '24.1.0',
  files: new Map([
    ['package-lock.json', 100],
    ['.env.example', 1],
  ]),
  commandResults: new Map<string, CommandResult>([
    ['docker compose ps --status running --services', OK],
    [
      'npm run migration:up -w @aitl/db',
      { status: 0, stdout: "Applied 'Migration1'\nSuccessfully migrated up to the latest version\n", stderr: '' },
    ],
  ]),
  readyAfterChecks: 0,
  now: 0,
});

const fullyConfiguredWorld = (): World => {
  const world = freshWorld();
  world.files.set('node_modules/.package-lock.json', 200);
  world.files.set('.env', 5);
  world.commandResults.set('docker compose ps --status running --services', POSTGRES_RUNNING);
  world.commandResults.set('npm run migration:up -w @aitl/db', {
    status: 0,
    stdout: 'Successfully migrated up to the latest version\n',
    stderr: '',
  });
  return world;
};

const createFake = (world: World) => {
  const commands: string[] = [];
  const out: string[] = [];
  const err: string[] = [];
  const copies: string[] = [];
  let readinessChecks = 0;
  const dependencies: Dependencies = {
    nodeVersion: world.nodeVersion,
    runCommand: (command, args) => {
      const key = [command, ...args].join(' ');
      commands.push(key);
      if (key.startsWith('docker compose exec')) {
        readinessChecks += 1;
        return readinessChecks > world.readyAfterChecks ? OK : FAIL;
      }
      return world.commandResults.get(key) ?? OK;
    },
    fileExists: (path) => world.files.has(path),
    modifiedAtMs: (path) => world.files.get(path),
    copyFile: (source, destination) => {
      copies.push(`${source}->${destination}`);
      world.files.set(destination, 1);
    },
    writeOut: (text) => void out.push(text),
    writeErr: (text) => void err.push(text),
    nowMs: () => world.now,
    sleep: async (milliseconds) => {
      world.now += milliseconds;
    },
  };
  return { dependencies, commands, out, err, copies };
};

describe('isSupportedNodeVersion', () => {
  it.each([
    { version: '22.17.0', expected: true },
    { version: 'v24.0.0', expected: true },
    { version: '23.0.0', expected: true },
    { version: '22.16.9', expected: false },
    { version: '20.19.0', expected: false },
  ])('returns $expected for $version', ({ version, expected }) => {
    const actual = isSupportedNodeVersion(version);

    expect(actual).toBe(expected);
  });

  it('treats a missing minor part as zero', () => {
    const actual = isSupportedNodeVersion('22');

    expect(actual).toBe(false);
  });

  it('treats an empty version as unsupported', () => {
    const actual = isSupportedNodeVersion('');

    expect(actual).toBe(false);
  });
});

describe('checkPrerequisites', () => {
  it('passes when everything is available', () => {
    const { dependencies } = createFake(freshWorld());

    const actual = checkPrerequisites(dependencies);

    expect(actual.status).toBe('done');
  });

  it.each([
    { missing: 'Node', setup: (world: World) => void (world.nodeVersion = '20.0.0'), message: 'za stary' },
    {
      missing: 'npm',
      setup: (world: World) => void world.commandResults.set('npm --version', FAIL),
      message: 'npm',
    },
    {
      missing: 'Docker',
      setup: (world: World) => void world.commandResults.set('docker --version', FAIL),
      message: 'Nie znaleziono Dockera',
    },
    {
      missing: 'Docker daemon',
      setup: (world: World) => void world.commandResults.set('docker info', FAIL),
      message: 'Demon Dockera',
    },
  ])('throws a clear error when $missing is missing', ({ setup, message }) => {
    const world = freshWorld();
    setup(world);
    const { dependencies } = createFake(world);

    const act = (): unknown => checkPrerequisites(dependencies);

    expect(act).toThrow(message);
  });
});

describe('installDependencies', () => {
  it('runs npm install on a fresh clone', () => {
    const { dependencies, commands } = createFake(freshWorld());

    const actual = installDependencies(dependencies);

    expect([actual.status, commands]).toEqual(['done', ['npm install']]);
  });

  it('runs npm install when the installed lockfile is older than package-lock.json', () => {
    const world = fullyConfiguredWorld();
    world.files.set('node_modules/.package-lock.json', 50);
    const { dependencies } = createFake(world);

    const actual = installDependencies(dependencies);

    expect(actual.status).toBe('done');
  });

  it('skips when node_modules is up to date', () => {
    const { dependencies, commands } = createFake(fullyConfiguredWorld());

    const actual = installDependencies(dependencies);

    expect([actual.status, commands]).toEqual(['skipped', []]);
  });

  it('throws when npm install fails', () => {
    const world = freshWorld();
    world.commandResults.set('npm install', FAIL);
    const { dependencies } = createFake(world);

    const act = (): unknown => installDependencies(dependencies);

    expect(act).toThrow('npm install');
  });
});

describe('createEnvFile', () => {
  it('copies .env.example when .env is missing', () => {
    const { dependencies, copies } = createFake(freshWorld());

    const actual = createEnvFile(dependencies);

    expect([actual.status, copies]).toEqual(['done', ['.env.example->.env']]);
  });

  it('never overwrites an existing .env', () => {
    const { dependencies, copies } = createFake(fullyConfiguredWorld());

    const actual = createEnvFile(dependencies);

    expect([actual.status, copies]).toEqual(['skipped', []]);
  });
});

describe('startPostgres', () => {
  it('starts the container and waits when it is not running', async () => {
    const world = freshWorld();
    world.readyAfterChecks = 2;
    const { dependencies, commands } = createFake(world);

    const actual = await startPostgres(dependencies);

    expect(actual.status).toBe('done');
    expect(commands).toContain('docker compose up -d postgres');
    expect(world.now).toBe(2 * READINESS_INTERVAL_MS);
  });

  it('skips starting when the container already runs and is ready', async () => {
    const { dependencies, commands } = createFake(fullyConfiguredWorld());

    const actual = await startPostgres(dependencies);

    expect(actual.status).toBe('skipped');
    expect(commands).not.toContain('docker compose up -d postgres');
  });

  it('starts the container when the status command fails', async () => {
    const world = freshWorld();
    world.commandResults.set('docker compose ps --status running --services', FAIL);
    const { dependencies, commands } = createFake(world);

    await startPostgres(dependencies);

    expect(commands).toContain('docker compose up -d postgres');
  });

  it('starts the container when other services run but postgres does not', async () => {
    const world = freshWorld();
    world.commandResults.set('docker compose ps --status running --services', {
      status: 0,
      stdout: 'redis\n',
      stderr: '',
    });
    const { dependencies, commands } = createFake(world);

    await startPostgres(dependencies);

    expect(commands).toContain('docker compose up -d postgres');
  });

  it('throws when docker compose up fails', async () => {
    const world = freshWorld();
    world.commandResults.set('docker compose up -d postgres', FAIL);
    const { dependencies } = createFake(world);

    const act = startPostgres(dependencies);

    await expect(act).rejects.toThrow('docker compose up');
  });

  it('throws with a hint when postgres is not ready before the timeout', async () => {
    const world = freshWorld();
    world.readyAfterChecks = Number.POSITIVE_INFINITY;
    const { dependencies } = createFake(world);

    const act = startPostgres(dependencies);

    await expect(act).rejects.toMatchObject({ hint: expect.stringContaining('docker compose logs postgres') });
    expect(world.now).toBe(READINESS_TIMEOUT_MS);
  });
});

describe('applyMigrations', () => {
  it('reports done and echoes output when migrations were applied', () => {
    const { dependencies, out } = createFake(freshWorld());

    const actual = applyMigrations(dependencies);

    expect(actual.status).toBe('done');
    expect(out.join('')).toContain("Applied 'Migration1'");
  });

  it('reports skipped when nothing was pending', () => {
    const { dependencies } = createFake(fullyConfiguredWorld());

    const actual = applyMigrations(dependencies);

    expect(actual.status).toBe('skipped');
  });

  it.each([
    'error: password authentication failed for user "aitl"',
    'error: role "aitl" does not exist',
  ])('hints at docker compose down -v when credentials are rejected: %s', (stderr) => {
    const world = freshWorld();
    world.commandResults.set('npm run migration:up -w @aitl/db', { status: 1, stdout: '', stderr });
    const { dependencies, err } = createFake(world);

    const act = (): unknown => applyMigrations(dependencies);

    expect(act).toThrowError(expect.objectContaining({ hint: expect.stringContaining('docker compose down -v') }));
    expect(err.join('')).toContain(stderr);
  });

  it('throws a generic error for other failures', () => {
    const world = freshWorld();
    world.commandResults.set('npm run migration:up -w @aitl/db', { status: 1, stdout: '', stderr: 'boom' });
    const { dependencies } = createFake(world);

    const act = (): unknown => applyMigrations(dependencies);

    expect(act).toThrowError(expect.objectContaining({ message: 'Migracje zakończyły się błędem.', hint: undefined }));
  });
});

describe('runSetup', () => {
  it('sets up a fresh clone and prints next steps', async () => {
    const { dependencies, commands, out, copies } = createFake(freshWorld());

    const actual = await runSetup(dependencies);

    expect(actual).toBe(0);
    expect(commands).toEqual([
      'npm --version',
      'docker --version',
      'docker info',
      'npm install',
      'docker compose ps --status running --services',
      'docker compose up -d postgres',
      'docker compose exec -T postgres pg_isready -U aitl -d aitl',
      'npm run migration:up -w @aitl/db',
    ]);
    expect(copies).toEqual(['.env.example->.env']);
    expect(out.join('')).toContain(formatNextSteps());
  });

  it('changes nothing on a second run and reports skipped steps', async () => {
    const { dependencies, commands, out, copies } = createFake(fullyConfiguredWorld());

    const actual = await runSetup(dependencies);

    expect(actual).toBe(0);
    expect(copies).toEqual([]);
    expect(commands).not.toContain('npm install');
    expect(commands).not.toContain('docker compose up -d postgres');
    const report = out.join('');
    expect(report).toContain('[skipped] Zależności');
    expect(report).toContain('[skipped] Plik .env');
    expect(report).toContain('[skipped] PostgreSQL');
    expect(report).toContain('[skipped] Migracje');
  });

  it('stops early with exit code 1, message and hint on a missing prerequisite', async () => {
    const world = freshWorld();
    world.commandResults.set('docker info', FAIL);
    const { dependencies, commands, err } = createFake(world);

    const actual = await runSetup(dependencies);

    expect(actual).toBe(1);
    expect(commands).not.toContain('npm install');
    expect(err.join('')).toContain('Błąd: Demon Dockera nie odpowiada.');
    expect(err.join('')).toContain('Wskazówka:');
  });

  it('prints only the message when the error has no hint', async () => {
    const world = freshWorld();
    world.commandResults.set('npm install', FAIL);
    const { dependencies, err } = createFake(world);

    const actual = await runSetup(dependencies);

    expect(actual).toBe(1);
    expect(err.join('')).not.toContain('Wskazówka');
  });

  it('exits with 1 when postgres readiness times out', async () => {
    const world = freshWorld();
    world.readyAfterChecks = Number.POSITIVE_INFINITY;
    const { dependencies, err } = createFake(world);

    const actual = await runSetup(dependencies);

    expect(actual).toBe(1);
    expect(err.join('')).toContain('nie był gotowy');
  });

  it('rethrows unexpected errors', async () => {
    const { dependencies } = createFake(freshWorld());
    dependencies.copyFile = () => {
      throw new Error('disk failure');
    };

    const act = runSetup(dependencies);

    await expect(act).rejects.toThrow('disk failure');
  });
});
