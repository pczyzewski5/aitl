import {
  CREDENTIALS_REJECTED_MARKERS,
  ENV_EXAMPLE_FILE,
  ENV_FILE,
  INSTALLED_LOCKFILE,
  LOCKFILE,
  MIN_NODE_VERSION,
  APPLIED_MIGRATION_MARKER,
  POSTGRES_DATABASE,
  POSTGRES_SERVICE,
  POSTGRES_USER,
  READINESS_INTERVAL_MS,
  READINESS_TIMEOUT_MS,
} from './config.ts';
import { type Dependencies, SetupError, type StepResult } from './types.ts';

export const isSupportedNodeVersion = (version: string): boolean => {
  const [major = 0, minor = 0] = version.replace(/^v/, '').split('.').map(Number);
  return major > MIN_NODE_VERSION.major || (major === MIN_NODE_VERSION.major && minor >= MIN_NODE_VERSION.minor);
};

const succeeds = (dependencies: Dependencies, command: string, args: string[]): boolean =>
  dependencies.runCommand(command, args).status === 0;

export const checkPrerequisites = (dependencies: Dependencies): StepResult => {
  if (!isSupportedNodeVersion(dependencies.nodeVersion)) {
    throw new SetupError(
      `Node ${dependencies.nodeVersion} jest za stary, wymagany jest Node >= ${MIN_NODE_VERSION.major}.${MIN_NODE_VERSION.minor}.`,
      'Zainstaluj nowszy Node i uruchom `npm run setup` ponownie.',
    );
  }
  if (!succeeds(dependencies, 'npm', ['--version'])) {
    throw new SetupError('Nie znaleziono npm.', 'Zainstaluj Node razem z npm.');
  }
  if (!succeeds(dependencies, 'docker', ['--version'])) {
    throw new SetupError('Nie znaleziono Dockera.', 'Zainstaluj Docker i uruchom `npm run setup` ponownie.');
  }
  if (!succeeds(dependencies, 'docker', ['info'])) {
    throw new SetupError('Demon Dockera nie odpowiada.', 'Uruchom Docker Desktop (lub usługę docker) i spróbuj ponownie.');
  }
  return { name: 'Prerekwizyty', status: 'done', detail: `Node ${dependencies.nodeVersion}, npm, Docker` };
};

export const installDependencies = (dependencies: Dependencies): StepResult => {
  const installedAt = dependencies.modifiedAtMs(INSTALLED_LOCKFILE);
  const lockfileAt = dependencies.modifiedAtMs(LOCKFILE);
  if (installedAt !== undefined && lockfileAt !== undefined && installedAt >= lockfileAt) {
    return { name: 'Zależności', status: 'skipped', detail: 'node_modules jest aktualne' };
  }
  if (dependencies.runCommand('npm', ['install'], { inheritOutput: true }).status !== 0) {
    throw new SetupError('`npm install` zakończył się błędem.');
  }
  return { name: 'Zależności', status: 'done', detail: 'npm install' };
};

export const createEnvFile = (dependencies: Dependencies): StepResult => {
  if (dependencies.fileExists(ENV_FILE)) {
    return { name: 'Plik .env', status: 'skipped', detail: '.env już istnieje, nie jest nadpisywany' };
  }
  dependencies.copyFile(ENV_EXAMPLE_FILE, ENV_FILE);
  return { name: 'Plik .env', status: 'done', detail: `skopiowano ${ENV_EXAMPLE_FILE}` };
};

const isPostgresRunning = (dependencies: Dependencies): boolean => {
  const result = dependencies.runCommand('docker', ['compose', 'ps', '--status', 'running', '--services']);
  return result.status === 0 && result.stdout.split('\n').some((line) => line.trim() === POSTGRES_SERVICE);
};

const isPostgresReady = (dependencies: Dependencies): boolean =>
  succeeds(dependencies, 'docker', [
    'compose',
    'exec',
    '-T',
    POSTGRES_SERVICE,
    'pg_isready',
    '-U',
    POSTGRES_USER,
    '-d',
    POSTGRES_DATABASE,
  ]);

const waitForPostgres = async (dependencies: Dependencies): Promise<void> => {
  const deadline = dependencies.nowMs() + READINESS_TIMEOUT_MS;
  while (!isPostgresReady(dependencies)) {
    if (dependencies.nowMs() >= deadline) {
      throw new SetupError(
        `PostgreSQL nie był gotowy w ciągu ${READINESS_TIMEOUT_MS / 1000} s.`,
        'Sprawdź logi: `docker compose logs postgres`.',
      );
    }
    await dependencies.sleep(READINESS_INTERVAL_MS);
  }
};

export const startPostgres = async (dependencies: Dependencies): Promise<StepResult> => {
  const alreadyRunning = isPostgresRunning(dependencies);
  if (!alreadyRunning) {
    const result = dependencies.runCommand('docker', ['compose', 'up', '-d', POSTGRES_SERVICE], { inheritOutput: true });
    if (result.status !== 0) {
      throw new SetupError('`docker compose up -d postgres` zakończył się błędem.', 'Sprawdź, czy port 5432 jest wolny.');
    }
  }
  await waitForPostgres(dependencies);
  return alreadyRunning
    ? { name: 'PostgreSQL', status: 'skipped', detail: 'kontener już działa i jest gotowy' }
    : { name: 'PostgreSQL', status: 'done', detail: 'docker compose up -d postgres' };
};

export const applyMigrations = (dependencies: Dependencies): StepResult => {
  const result = dependencies.runCommand('npm', ['run', 'migration:up', '-w', '@aitl/db']);
  const output = `${result.stdout}\n${result.stderr}`;
  dependencies.writeOut(result.stdout);
  dependencies.writeErr(result.stderr);
  if (result.status !== 0) {
    if (CREDENTIALS_REJECTED_MARKERS.some((marker) => output.includes(marker))) {
      throw new SetupError(
        'PostgreSQL odrzucił dane logowania (prawdopodobnie stary wolumen z innymi danymi).',
        'Jeśli możesz stracić lokalne dane, wykonaj `docker compose down -v` i uruchom setup ponownie. Skrypt sam nigdy nie usuwa wolumenów.',
      );
    }
    throw new SetupError('Migracje zakończyły się błędem.');
  }
  return output.includes(APPLIED_MIGRATION_MARKER)
    ? { name: 'Migracje', status: 'done', detail: 'zastosowano migracje' }
    : { name: 'Migracje', status: 'skipped', detail: 'brak oczekujących migracji, baza jest aktualna' };
};
