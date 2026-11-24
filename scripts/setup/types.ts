export interface CommandResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

export interface CommandOptions {
  inheritOutput?: boolean;
}

export interface Dependencies {
  nodeVersion: string;
  runCommand(command: string, args: string[], options?: CommandOptions): CommandResult;
  fileExists(path: string): boolean;
  modifiedAtMs(path: string): number | undefined;
  copyFile(source: string, destination: string): void;
  writeOut(text: string): void;
  writeErr(text: string): void;
  nowMs(): number;
  sleep(milliseconds: number): Promise<void>;
}

export type StepStatus = 'done' | 'skipped';

export interface StepResult {
  name: string;
  status: StepStatus;
  detail: string;
}

export class SetupError extends Error {
  readonly hint: string | undefined;

  constructor(message: string, hint?: string) {
    super(message);
    this.name = 'SetupError';
    this.hint = hint;
  }
}
