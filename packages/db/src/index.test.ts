import { describe, expect, it } from 'vitest';
import { dependsOn, entities, packageName, readDatabaseUrl } from './index';

describe('db package', () => {
  it('exposes its package name', () => {
    expect(packageName).toBe('@aitl/db');
  });

  it('declares the core package as its dependency', () => {
    expect(dependsOn).toEqual(['@aitl/core']);
  });

  it('re-exports the public API', () => {
    expect(entities).toEqual([]);
    expect(readDatabaseUrl({ DATABASE_URL: 'postgres://x' })).toBe('postgres://x');
  });
});
