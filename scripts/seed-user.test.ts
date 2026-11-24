import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const EXIT_CODE = 3;
const closeOrm = vi.fn(async () => undefined);
const runSeed = vi.fn<(dependencies: unknown) => Promise<number>>().mockResolvedValue(EXIT_CODE);
const containerCradle = {
  userProvisioningService: { marker: 'provisioning' },
  userRepository: { marker: 'users' },
  passwordHasher: { marker: 'hasher' },
};

vi.mock('@mikro-orm/postgresql', () => ({
  MikroORM: { init: vi.fn(async () => ({ close: closeOrm })) },
}));
vi.mock('../packages/app/src/container/container.ts', () => ({
  createAppContainer: vi.fn((_env: unknown, init: (config: object) => Promise<unknown>) => ({
    createScope: () => ({
      get cradle() {
        void init({});
        return containerCradle;
      },
    }),
  })),
}));
vi.mock('../packages/app/src/seed/run-seed.ts', () => ({ runSeed }));

describe('seed-user entry point', () => {
  const previousExitCode = process.exitCode;

  beforeEach(() => {
    vi.resetModules();
    closeOrm.mockClear();
    runSeed.mockClear();
  });

  afterEach(() => {
    process.exitCode = previousExitCode;
    vi.restoreAllMocks();
  });

  it('runs the seed with the container services, propagates the exit code and closes the ORM', async () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    await import('./seed-user.ts');

    const dependencies = runSeed.mock.calls[0]?.[0] as {
      argv: string[];
      provisioning: unknown;
      users: unknown;
      passwordHasher: unknown;
      writeOut: (text: string) => void;
      writeErr: (text: string) => void;
    };
    dependencies.writeOut('out');
    dependencies.writeErr('err');
    expect(dependencies.argv).toEqual(process.argv.slice(2));
    expect(dependencies.provisioning).toBe(containerCradle.userProvisioningService);
    expect(dependencies.users).toBe(containerCradle.userRepository);
    expect(dependencies.passwordHasher).toBe(containerCradle.passwordHasher);
    expect(stdout).toHaveBeenCalledWith('out');
    expect(stderr).toHaveBeenCalledWith('err');
    expect(process.exitCode).toBe(EXIT_CODE);
    expect(closeOrm).toHaveBeenCalledOnce();
  });

  it('closes the ORM when the seed throws', async () => {
    runSeed.mockRejectedValueOnce(new Error('database down'));

    const act = import('./seed-user.ts');

    await expect(act).rejects.toThrow('database down');
    expect(closeOrm).toHaveBeenCalledOnce();
  });
});
