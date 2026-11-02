import { describe, expect, it } from 'vitest';
import { packageName } from './index';

describe('core package', () => {
  it('exposes its package name', () => {
    expect(packageName).toBe('@aitl/core');
  });
});
