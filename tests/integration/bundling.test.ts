import { readdirSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const BUILD_DIRECTORY = fileURLToPath(new URL('../../packages/app/.next', import.meta.url));
const SERVER_CHUNKS_DIRECTORY = join(BUILD_DIRECTORY, 'server', 'chunks');
const EXTERNAL_PACKAGES_DIRECTORY = join(BUILD_DIRECTORY, 'node_modules', '@node-rs');
const ARGON2_EXTERNAL_REQUIRE = /require\("@node-rs\/argon2[^"]*"\)/;
const NATIVE_BINDING_EXTENSION = '.node';

describe('native argon2 in the production server bundle', () => {
  it('stays an external require instead of being bundled into the server chunks', () => {
    const chunks = readdirSync(SERVER_CHUNKS_DIRECTORY).filter((file) => file.endsWith('.js'));

    const requiringChunks = chunks.filter((chunk) =>
      ARGON2_EXTERNAL_REQUIRE.test(readFileSync(join(SERVER_CHUNKS_DIRECTORY, chunk), 'utf8')),
    );

    expect(requiringChunks.length).toBeGreaterThan(0);
    expect(chunks.some((chunk) => chunk.endsWith(NATIVE_BINDING_EXTENSION))).toBe(false);
  });

  it('is linked into the build and resolves to the installed package', () => {
    const links = readdirSync(EXTERNAL_PACKAGES_DIRECTORY).filter((entry) =>
      entry.startsWith('argon2'),
    );

    const targets = links.map((link) => realpathSync(join(EXTERNAL_PACKAGES_DIRECTORY, link)));

    expect(targets.length).toBeGreaterThan(0);
    expect(targets.every((target) => target.endsWith(join('@node-rs', 'argon2')))).toBe(true);
  });
});
