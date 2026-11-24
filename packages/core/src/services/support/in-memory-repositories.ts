import { randomUUID } from 'node:crypto';
import { BANK_ACCOUNT_TYPE, type BankAccountRecord } from '../bank-accounts/bank-account';
import type { BankAccountMembershipRepository } from '../bank-accounts/bank-account-membership-repository.port';
import type { BankAccountRepository } from '../bank-accounts/bank-account-repository.port';
import type {
  LoginThrottleRepository,
  ThrottleCounter,
  ThrottleReservation,
} from '../auth/login-throttle-repository.port';
import type { PasswordHasher } from '../auth/password-hasher.port';
import type {
  NewSession,
  SessionRecord,
  SessionRepository,
} from '../auth/session-repository.port';
import type { NewUser, UserRecord, UserRepository } from '../users/user-repository.port';
import type {
  ProvisioningRepositories,
  ProvisioningUnitOfWork,
} from '../users/user-provisioning-unit-of-work.port';

export const FAKE_HASH_PREFIX = 'fake-hash:';

export type StoredSession = SessionRecord & Readonly<{ tokenHash: string }>;

export type StoredThrottle = {
  keyHash: string;
  failures: number;
  windowStartedAt: Date;
  lockedUntil: Date | null;
};

export class InMemoryStore {
  throttles: StoredThrottle[] = [];
  sessions: StoredSession[] = [];
  readonly users: UserRecord[] = [];
  readonly bankAccounts: BankAccountRecord[] = [];
  readonly memberships: Array<{ userId: string; bankAccountId: string }> = [];
}

export class InMemoryUserRepository implements UserRepository {
  private readonly store: InMemoryStore;

  constructor(store: InMemoryStore) {
    this.store = store;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.store.users.find((user) => user.email === email) ?? null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.store.users.find((user) => user.id === id) ?? null;
  }

  async create(user: NewUser): Promise<UserRecord> {
    const record = { id: randomUUID(), ...user };
    this.store.users.push(record);

    return record;
  }
}

export class InMemoryBankAccountRepository implements BankAccountRepository {
  private readonly store: InMemoryStore;

  constructor(store: InMemoryStore) {
    this.store = store;
  }

  async findById(id: string): Promise<BankAccountRecord | null> {
    return this.store.bankAccounts.find((account) => account.id === id) ?? null;
  }

  async findSharedByName(name: string): Promise<BankAccountRecord | null> {
    return (
      this.store.bankAccounts.find(
        (account) => account.type === BANK_ACCOUNT_TYPE.Shared && account.name === name,
      ) ?? null
    );
  }

  async findPersonalByOwner(ownerUserId: string): Promise<BankAccountRecord | null> {
    return (
      this.store.bankAccounts.find(
        (account) =>
          account.type === BANK_ACCOUNT_TYPE.Personal && account.ownerUserId === ownerUserId,
      ) ?? null
    );
  }

  async createShared(name: string): Promise<BankAccountRecord> {
    return this.insert({ id: randomUUID(), type: BANK_ACCOUNT_TYPE.Shared, name, ownerUserId: null });
  }

  async createPersonal(ownerUserId: string, name: string): Promise<BankAccountRecord> {
    return this.insert({ id: randomUUID(), type: BANK_ACCOUNT_TYPE.Personal, name, ownerUserId });
  }

  async listForUser(userId: string): Promise<BankAccountRecord[]> {
    const accountIds = this.store.memberships
      .filter((membership) => membership.userId === userId)
      .map((membership) => membership.bankAccountId);

    return this.store.bankAccounts.filter((account) => accountIds.includes(account.id));
  }

  private insert(record: BankAccountRecord): BankAccountRecord {
    this.store.bankAccounts.push(record);

    return record;
  }
}

export class InMemoryMembershipRepository implements BankAccountMembershipRepository {
  private readonly store: InMemoryStore;

  constructor(store: InMemoryStore) {
    this.store = store;
  }

  async isMember(userId: string, bankAccountId: string): Promise<boolean> {
    return this.store.memberships.some(
      (membership) => membership.userId === userId && membership.bankAccountId === bankAccountId,
    );
  }

  async add(userId: string, bankAccountId: string): Promise<void> {
    this.store.memberships.push({ userId, bankAccountId });
  }
}

export class InMemorySessionRepository implements SessionRepository {
  private readonly store: InMemoryStore;

  constructor(store: InMemoryStore) {
    this.store = store;
  }

  async create(session: NewSession): Promise<void> {
    this.store.sessions.push({ id: randomUUID(), ...session });
  }

  async findByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    return this.store.sessions.find((session) => session.tokenHash === tokenHash) ?? null;
  }

  async updateExpiresAt(id: string, expiresAt: Date): Promise<void> {
    this.store.sessions = this.store.sessions.map((session) =>
      session.id === id ? { ...session, expiresAt } : session,
    );
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    this.store.sessions = this.store.sessions.filter((session) => session.tokenHash !== tokenHash);
  }

  async deleteExpired(now: Date): Promise<void> {
    this.store.sessions = this.store.sessions.filter(
      (session) => now < session.expiresAt && now < session.absoluteExpiresAt,
    );
  }
}

export class InMemoryLoginThrottleRepository implements LoginThrottleRepository {
  private readonly store: InMemoryStore;

  constructor(store: InMemoryStore) {
    this.store = store;
  }

  async reserveAttempt(
    { keyHash, limit, windowMs, lockMs }: ThrottleCounter,
    now: Date,
  ): Promise<ThrottleReservation> {
    const existing = this.store.throttles.find((throttle) => throttle.keyHash === keyHash);
    const isLocked = existing?.lockedUntil !== undefined && existing.lockedUntil !== null && existing.lockedUntil > now;
    const isFresh =
      existing === undefined || (!isLocked && now.getTime() - existing.windowStartedAt.getTime() >= windowMs);
    const throttle: StoredThrottle = isFresh
      ? { keyHash, failures: 0, windowStartedAt: now, lockedUntil: null }
      : existing;

    throttle.failures += 1;

    if (!isLocked && throttle.failures >= limit) {
      throttle.lockedUntil = new Date(now.getTime() + lockMs);
    }

    this.store.throttles = [...this.store.throttles.filter((stored) => stored.keyHash !== keyHash), throttle];

    return { failures: throttle.failures, lockedUntil: throttle.lockedUntil };
  }

  async deleteByKeyHashes(keyHashes: readonly string[]): Promise<void> {
    this.store.throttles = this.store.throttles.filter(({ keyHash }) => !keyHashes.includes(keyHash));
  }
}

export function createInMemoryRepositories(store: InMemoryStore): ProvisioningRepositories {
  return {
    users: new InMemoryUserRepository(store),
    bankAccounts: new InMemoryBankAccountRepository(store),
    memberships: new InMemoryMembershipRepository(store),
  };
}

export class InMemoryUnitOfWork implements ProvisioningUnitOfWork {
  runs = 0;

  private readonly store: InMemoryStore;

  constructor(store: InMemoryStore) {
    this.store = store;
  }

  run<T>(work: (repositories: ProvisioningRepositories) => Promise<T>): Promise<T> {
    this.runs += 1;

    return work(createInMemoryRepositories(this.store));
  }
}

export class FakePasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `${FAKE_HASH_PREFIX}${password}`;
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    return passwordHash === `${FAKE_HASH_PREFIX}${password}`;
  }

  async verifyAgainstDecoy(): Promise<void> {}
}
