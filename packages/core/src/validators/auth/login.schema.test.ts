import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { loginSchema } from './login.schema';

describe('loginSchema', () => {
  it('lower-cases and trims the e-mail', () => {
    const password = randomBytes(12).toString('hex');

    const actual = loginSchema.parse({ email: '  Jan.Kowalski@Example.COM ', password });

    expect(actual).toEqual({ email: 'jan.kowalski@example.com', password });
  });

  it('keeps the password untouched', () => {
    const password = ` ${randomBytes(12).toString('hex')} `;

    const actual = loginSchema.parse({ email: 'a@example.com', password });

    expect(actual.password).toBe(password);
  });

  it.each([
    { name: 'an invalid e-mail', input: { email: 'not-an-email', password: 'x' }, field: 'email' },
    { name: 'a blank e-mail', input: { email: '   ', password: 'x' }, field: 'email' },
    { name: 'a missing e-mail', input: { password: 'x' }, field: 'email' },
    { name: 'an empty password', input: { email: 'a@example.com', password: '' }, field: 'password' },
    { name: 'a missing password', input: { email: 'a@example.com' }, field: 'password' },
  ])('rejects $name', ({ input, field }) => {
    const actual = loginSchema.safeParse(input);

    expect(actual.success).toBe(false);
    expect(actual.error?.issues.map((issue) => issue.path[0])).toContain(field);
  });
});
