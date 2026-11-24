import { describe, expect, it } from 'vitest';
import { describeLoginFailure } from './login-failure';
import type { LoginFailure } from './login-failure';
import { DEFAULT_LOGIN_MESSAGES } from './messages';

describe('describeLoginFailure', () => {
  it.each<{ failure: LoginFailure; expected: string }>([
    {
      failure: { ok: false, kind: 'invalid-credentials' },
      expected: 'Nie udało się zalogować. Sprawdź adres e-mail i hasło, a potem spróbuj ponownie.',
    },
    {
      failure: { ok: false, kind: 'too-many-attempts', retryAfterSeconds: 87 },
      expected: 'Zbyt wiele prób logowania. Spróbuj ponownie za 87 sekund.',
    },
    {
      failure: { ok: false, kind: 'too-many-attempts', retryAfterSeconds: 1 },
      expected: 'Zbyt wiele prób logowania. Spróbuj ponownie za 1 sekundę.',
    },
    {
      failure: { ok: false, kind: 'too-many-attempts', retryAfterSeconds: 22 },
      expected: 'Zbyt wiele prób logowania. Spróbuj ponownie za 22 sekundy.',
    },
    {
      failure: { ok: false, kind: 'too-many-attempts', retryAfterSeconds: 0.2 },
      expected: 'Zbyt wiele prób logowania. Spróbuj ponownie za 1 sekundę.',
    },
    {
      failure: { ok: false, kind: 'too-many-attempts', retryAfterSeconds: 0 },
      expected: 'Zbyt wiele prób logowania. Spróbuj ponownie za chwilę.',
    },
    {
      failure: { ok: false, kind: 'too-many-attempts' },
      expected: 'Zbyt wiele prób logowania. Spróbuj ponownie za chwilę.',
    },
    {
      failure: { ok: false, kind: 'network' },
      expected: DEFAULT_LOGIN_MESSAGES.network,
    },
    {
      failure: { ok: false, kind: 'server-error' },
      expected: 'Coś poszło nie tak po naszej stronie. Spróbuj ponownie za chwilę; wpisane dane zostały w formularzu.',
    },
  ])('describes $failure', ({ failure, expected }) => {
    const actual = describeLoginFailure(failure, DEFAULT_LOGIN_MESSAGES);

    expect(actual).toBe(expected);
  });

  it('uses overridden messages', () => {
    const messages = { ...DEFAULT_LOGIN_MESSAGES, tooManyAttempts: (secondsText: string) => `Wait ${secondsText}` };

    const actual = describeLoginFailure({ ok: false, kind: 'too-many-attempts', retryAfterSeconds: 5 }, messages);

    expect(actual).toBe('Wait 5 sekund');
  });
});
