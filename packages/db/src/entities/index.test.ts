import { describe, expect, it } from 'vitest';
import { entities } from './index';

describe('entities', () => {
  it('has no domain entities registered yet', () => {
    expect(entities).toEqual([]);
  });
});
