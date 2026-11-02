import { describe, expect, it } from 'vitest';
import { dependsOn, packageName } from './index';

describe('db package', () => {
  it('exposes its package name', () => {
    expect(packageName).toBe('@aitl/db');
  });

  it('declares the core package as its dependency', () => {
    expect(dependsOn).toEqual(['@aitl/core']);
  });
});
