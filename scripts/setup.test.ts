import { afterEach, describe, expect, it, vi } from 'vitest';

const dependencies = { marker: 'dependencies' };

vi.mock('./setup/node-dependencies.ts', () => ({ createNodeDependencies: vi.fn(() => dependencies) }));
vi.mock('./setup/run.ts', () => ({ runSetup: vi.fn(async () => 7) }));

describe('setup entry point', () => {
  const previousExitCode = process.exitCode;

  afterEach(() => {
    process.exitCode = previousExitCode;
  });

  it('runs the setup with node dependencies and propagates the exit code', async () => {
    await import('./setup.ts');

    const { createNodeDependencies } = await import('./setup/node-dependencies.ts');
    const { runSetup } = await import('./setup/run.ts');
    expect(createNodeDependencies).toHaveBeenCalledWith(process.cwd());
    expect(runSetup).toHaveBeenCalledWith(dependencies);
    expect(process.exitCode).toBe(7);
  });
});
