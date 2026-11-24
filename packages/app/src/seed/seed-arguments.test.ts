import { describe, expect, it } from 'vitest';
import { parseSeedArguments } from './seed-arguments';
import {
  DEFAULT_PERSONAL_ACCOUNT_NAME,
  DEFAULT_SHARED_ACCOUNT_NAME,
  SEED_MESSAGE,
  SEED_OPTION,
} from './seed-config';

describe('parseSeedArguments', () => {
  it('applies the default account names in the owner mode', () => {
    const actual = parseSeedArguments(['--email', 'owner@example.test', '--name', 'Owner']);

    expect(actual).toEqual({
      ok: true,
      value: {
        email: 'owner@example.test',
        displayName: 'Owner',
        sharedOnly: false,
        sharedAccountName: DEFAULT_SHARED_ACCOUNT_NAME,
        personalAccountName: DEFAULT_PERSONAL_ACCOUNT_NAME,
      },
    });
  });

  it('reads the shared-only flag and custom account names', () => {
    const actual = parseSeedArguments([
      '--email',
      'spouse@example.test',
      '--name',
      'Spouse',
      '--shared-only',
      '--shared-account-name',
      'Home',
      '--personal-account-name',
      'Mine',
    ]);

    expect(actual).toEqual({
      ok: true,
      value: {
        email: 'spouse@example.test',
        displayName: 'Spouse',
        sharedOnly: true,
        sharedAccountName: 'Home',
        personalAccountName: 'Mine',
      },
    });
  });

  it.each([
    {
      argv: ['--name', 'Owner'],
      message: SEED_MESSAGE.missingOption(SEED_OPTION.Email),
    },
    {
      argv: ['--email', 'owner@example.test'],
      message: SEED_MESSAGE.missingOption(SEED_OPTION.Name),
    },
    {
      argv: ['--email', 'not-an-email', '--name', 'Owner'],
      message: SEED_MESSAGE.invalidEmail,
    },
  ])('rejects $argv', ({ argv, message }) => {
    const actual = parseSeedArguments(argv);

    expect(actual).toEqual({ ok: false, message });
  });

  it('rejects an unknown option with the parser message', () => {
    const actual = parseSeedArguments(['--password', 'x']);

    expect(actual.ok).toBe(false);
    expect(actual.ok ? '' : actual.message).toContain('--password');
  });
});
