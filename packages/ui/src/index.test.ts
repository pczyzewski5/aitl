import { describe, expect, it } from 'vitest';
import { packageName } from './index';

describe('ui package', () => {
  it('exposes its package name', () => {
    expect(packageName).toBe('@aitl/ui');
  });
});
