import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { bankAccountIdSchema } from './bank-account-id.schema';

describe('bankAccountIdSchema', () => {
  it.each([
    { name: 'a UUID', value: randomUUID(), expected: true },
    { name: 'plain text', value: 'not-a-uuid', expected: false },
    { name: 'an empty string', value: '', expected: false },
  ])('validates $name', ({ value, expected }) => {
    const actual = bankAccountIdSchema.safeParse(value).success;

    expect(actual).toBe(expected);
  });
});
