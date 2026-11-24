import { DEV_COMMAND, ENV_FILE } from './config.ts';
import {
  applyMigrations,
  checkPrerequisites,
  createEnvFile,
  installDependencies,
  startPostgres,
} from './steps.ts';
import { type Dependencies, SetupError, type StepResult } from './types.ts';

const formatStep = (step: StepResult): string => `[${step.status}] ${step.name}: ${step.detail}\n`;

export const formatNextSteps = (): string =>
  [
    '',
    'Następne kroki:',
    `  1. Uzupełnij w ${ENV_FILE} wartości sekretów (SESSION_SECRET oraz hasło konta seedowego), gdy pojawią się w .env.example.`,
    '  2. Seed konta użytkownika: komenda pojawi się wraz z seedem.',
    `  3. Uruchom aplikację: ${DEV_COMMAND}`,
    '',
  ].join('\n');

export const runSetup = async (dependencies: Dependencies): Promise<number> => {
  try {
    const report = (step: StepResult): void => dependencies.writeOut(formatStep(step));
    report(checkPrerequisites(dependencies));
    report(installDependencies(dependencies));
    report(createEnvFile(dependencies));
    report(await startPostgres(dependencies));
    report(applyMigrations(dependencies));
    dependencies.writeOut(formatNextSteps());
    return 0;
  } catch (error) {
    if (!(error instanceof SetupError)) {
      throw error;
    }
    dependencies.writeErr(`Błąd: ${error.message}\n`);
    if (error.hint !== undefined) {
      dependencies.writeErr(`Wskazówka: ${error.hint}\n`);
    }
    return 1;
  }
};
