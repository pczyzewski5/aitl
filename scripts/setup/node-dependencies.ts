import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import type { Dependencies } from './types.ts';

export const createNodeDependencies = (root: string): Dependencies => ({
  nodeVersion: process.versions.node,
  runCommand: (command, args, options) => {
    const result = spawnSync(command, args, {
      cwd: root,
      encoding: 'utf8',
      stdio: options?.inheritOutput ? 'inherit' : 'pipe',
    });
    return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
  },
  fileExists: (path) => existsSync(join(root, path)),
  modifiedAtMs: (path) => {
    const fullPath = join(root, path);
    return existsSync(fullPath) ? statSync(fullPath).mtimeMs : undefined;
  },
  copyFile: (source, destination) => copyFileSync(join(root, source), join(root, destination)),
  writeOut: (text) => void process.stdout.write(text),
  writeErr: (text) => void process.stderr.write(text),
  nowMs: () => Date.now(),
  sleep: (milliseconds) => delay(milliseconds),
});
