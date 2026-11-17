import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCheckTokens } from '../src/check-tokens/run.ts';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const uiRoot = join(repositoryRoot, 'packages', 'ui');

const { exitCode, lines } = runCheckTokens({
  roots: [join(uiRoot, 'src'), join(uiRoot, '.storybook'), join(repositoryRoot, 'packages', 'app', 'src')],
  tokensFile: join(uiRoot, 'src', 'tokens.css'),
  baseDirectory: repositoryRoot,
});

const summary = lines.length === 0 ? 'check:tokens: no values outside tokens' : `check:tokens: ${lines.length} violation(s)`;
process.stdout.write([...lines, summary].join('\n') + '\n');
process.exitCode = exitCode;
