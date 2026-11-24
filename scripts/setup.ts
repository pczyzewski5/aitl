import { createNodeDependencies } from './setup/node-dependencies.ts';
import { runSetup } from './setup/run.ts';

process.exitCode = await runSetup(createNodeDependencies(process.cwd()));
