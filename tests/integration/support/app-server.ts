import { spawn, type ChildProcess } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

const APP_DIRECTORY = fileURLToPath(new URL('../../../packages/app', import.meta.url));
const NEXT_BIN = createRequire(`${APP_DIRECTORY}/`).resolve('next/dist/bin/next');
const HEALTH_PATH = '/api/health';
const STARTUP_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 250;

const SESSION_SECRET_BYTES = 32;

export type AppEnv = Record<string, string | undefined>;

export type RunningApp = {
  url: string;
  output: () => string;
  stop: () => Promise<void>;
};

export function createSessionSecret(): string {
  return randomBytes(SESSION_SECRET_BYTES).toString('hex');
}

async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'object' && address !== null ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function waitUntilHealthy(url: string, app: ChildProcess): Promise<void> {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (app.exitCode !== null) {
      throw new Error(`Application exited early with code ${app.exitCode}`);
    }

    const isHealthy = await fetch(`${url}${HEALTH_PATH}`)
      .then((response) => response.ok)
      .catch(() => false);

    if (isHealthy) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Application did not become healthy within ${STARTUP_TIMEOUT_MS} ms`);
}

export type FailedApp = {
  healthStatus: number;
  output: () => string;
  stop: () => Promise<void>;
};

export async function startAppWithInvalidEnv(env: AppEnv): Promise<FailedApp> {
  const port = await findFreePort();
  const url = `http://127.0.0.1:${port}`;
  const chunks: string[] = [];
  const app = spawn(process.execPath, [NEXT_BIN, 'start', '--port', String(port)], {
    cwd: APP_DIRECTORY,
    env: { ...process.env, DATABASE_URL: '', SESSION_SECRET: '', ...env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  app.stdout?.on('data', (chunk: Buffer) => chunks.push(chunk.toString()));
  app.stderr?.on('data', (chunk: Buffer) => chunks.push(chunk.toString()));

  const stop = async (): Promise<void> => {
    if (app.exitCode !== null) {
      return;
    }
    const exited = new Promise<void>((resolve) => app.once('exit', () => resolve()));
    app.kill('SIGTERM');
    await exited;
  };

  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const status = await fetch(`${url}${HEALTH_PATH}`)
      .then((response) => response.status)
      .catch(() => null);

    if (status !== null) {
      return { healthStatus: status, output: () => chunks.join(''), stop };
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  await stop();
  throw new Error(`Application did not answer within ${STARTUP_TIMEOUT_MS} ms`);
}

export async function startApp(env: AppEnv): Promise<RunningApp> {
  const port = await findFreePort();
  const url = `http://127.0.0.1:${port}`;
  const chunks: string[] = [];
  const app = spawn(process.execPath, [NEXT_BIN, 'start', '--port', String(port)], {
    cwd: APP_DIRECTORY,
    env: {
      ...process.env,
      SESSION_SECRET: createSessionSecret(),
      SESSION_COOKIE_SECURE: 'false',
      ...env,
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const collect = (chunk: Buffer): void => {
    chunks.push(chunk.toString());
  };
  app.stdout?.on('data', collect);
  app.stderr?.on('data', collect);

  try {
    await waitUntilHealthy(url, app);
  } catch (error) {
    app.kill('SIGTERM');
    throw error;
  }

  const stop = async (): Promise<void> => {
    if (app.exitCode !== null) {
      return;
    }
    const exited = new Promise<void>((resolve) => app.once('exit', () => resolve()));
    app.kill('SIGTERM');
    await exited;
  };

  return { url, output: () => chunks.join(''), stop };
}
