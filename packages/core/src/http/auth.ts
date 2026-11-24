import { ForbiddenError, UnauthorizedError } from './errors';

export const UNAUTHENTICATED_MESSAGE = 'Authentication required';
export const BANK_ACCOUNT_FORBIDDEN_MESSAGE = 'No access to this bank account';

export type Session = Readonly<{ userId: string }>;

export interface SessionResolver {
  resolve(token: string | null): Promise<Session | null>;
}

export interface BankAccountMembershipLookup {
  isMember(userId: string, bankAccountId: string): Promise<boolean>;
}

export async function requireSession(token: string | null, resolver: SessionResolver): Promise<Session> {
  const session = await resolver.resolve(token === '' ? null : token);

  if (session === null) {
    throw new UnauthorizedError(UNAUTHENTICATED_MESSAGE);
  }

  return session;
}

export async function assertMemberOfBankAccount(
  session: Session,
  bankAccountId: string,
  lookup: BankAccountMembershipLookup,
): Promise<void> {
  const isMember = await lookup.isMember(session.userId, bankAccountId);

  if (isMember !== true) {
    throw new ForbiddenError(BANK_ACCOUNT_FORBIDDEN_MESSAGE);
  }
}
