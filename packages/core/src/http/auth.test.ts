import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  assertMemberOfBankAccount,
  BANK_ACCOUNT_FORBIDDEN_MESSAGE,
  requireSession,
  UNAUTHENTICATED_MESSAGE,
  type BankAccountMembershipLookup,
  type Session,
  type SessionResolver,
} from './auth';
import { ForbiddenError, UnauthorizedError } from './errors';

function randomId(): string {
  return randomBytes(8).toString('hex');
}

class FakeSessionResolver implements SessionResolver {
  readonly receivedTokens: Array<string | null> = [];

  constructor(private readonly sessionsByToken: ReadonlyMap<string, Session>) {}

  async resolve(token: string | null): Promise<Session | null> {
    this.receivedTokens.push(token);

    if (token === null) {
      return null;
    }

    return this.sessionsByToken.get(token) ?? null;
  }
}

class FakeMembershipLookup implements BankAccountMembershipLookup {
  constructor(private readonly memberships: ReadonlySet<string>) {}

  async isMember(userId: string, bankAccountId: string): Promise<boolean> {
    return this.memberships.has(`${userId}:${bankAccountId}`);
  }
}

describe('requireSession', () => {
  it('returns the session resolved from the token', async () => {
    const token = randomBytes(32).toString('hex');
    const session = { userId: randomId() };
    const resolver = new FakeSessionResolver(new Map([[token, session]]));

    const actual = await requireSession(token, resolver);

    expect(actual).toBe(session);
  });

  it('throws unauthorized when the token is unknown', async () => {
    const resolver = new FakeSessionResolver(new Map());

    const actual = requireSession(randomBytes(32).toString('hex'), resolver);

    await expect(actual).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(actual).rejects.toThrow(UNAUTHENTICATED_MESSAGE);
  });

  it('throws unauthorized when there is no token', async () => {
    const resolver = new FakeSessionResolver(new Map());

    const actual = requireSession(null, resolver);

    await expect(actual).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('passes an empty token to the resolver as null', async () => {
    const resolver = new FakeSessionResolver(new Map());

    await expect(requireSession('', resolver)).rejects.toBeInstanceOf(UnauthorizedError);

    expect(resolver.receivedTokens).toEqual([null]);
  });

  it('lets resolver failures propagate instead of granting a session', async () => {
    const failure = new Error('database down');
    const resolver: SessionResolver = {
      resolve: async () => {
        throw failure;
      },
    };

    const actual = requireSession(randomBytes(32).toString('hex'), resolver);

    await expect(actual).rejects.toBe(failure);
  });
});

describe('assertMemberOfBankAccount', () => {
  it('resolves for a member of the bank account', async () => {
    const session = { userId: randomId() };
    const bankAccountId = randomId();
    const lookup = new FakeMembershipLookup(new Set([`${session.userId}:${bankAccountId}`]));

    const actual = assertMemberOfBankAccount(session, bankAccountId, lookup);

    await expect(actual).resolves.toBeUndefined();
  });

  it('throws forbidden for a user who is not a member', async () => {
    const session = { userId: randomId() };
    const lookup = new FakeMembershipLookup(new Set([`${randomId()}:${randomId()}`]));

    const actual = assertMemberOfBankAccount(session, randomId(), lookup);

    await expect(actual).rejects.toBeInstanceOf(ForbiddenError);
    await expect(actual).rejects.toThrow(BANK_ACCOUNT_FORBIDDEN_MESSAGE);
  });

  it.each([{ answer: undefined }, { answer: null }, { answer: 'yes' }, { answer: 1 }])(
    'fails closed when the lookup answers $answer instead of true',
    async ({ answer }) => {
      const lookup = { isMember: async () => answer } as unknown as BankAccountMembershipLookup;

      const actual = assertMemberOfBankAccount({ userId: randomId() }, randomId(), lookup);

      await expect(actual).rejects.toBeInstanceOf(ForbiddenError);
    },
  );

  it('lets lookup failures propagate instead of granting access', async () => {
    const failure = new Error('database down');
    const lookup: BankAccountMembershipLookup = {
      isMember: async () => {
        throw failure;
      },
    };

    const actual = assertMemberOfBankAccount({ userId: randomId() }, randomId(), lookup);

    await expect(actual).rejects.toBe(failure);
  });
});
