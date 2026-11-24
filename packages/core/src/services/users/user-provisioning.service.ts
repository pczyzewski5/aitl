import type { PasswordHasher } from '../auth/password-hasher.port';
import type { BankAccountRecord } from '../bank-accounts/bank-account';
import { assertCanBeMember } from '../bank-accounts/bank-account-membership.rules';
import type { UserRecord } from './user-repository.port';
import type {
  ProvisioningRepositories,
  ProvisioningUnitOfWork,
} from './user-provisioning-unit-of-work.port';

export const PROVISIONING_MODE = {
  Owner: 'owner',
  SharedOnly: 'shared-only',
} as const;

type ProvisionUserBase = Readonly<{
  email: string;
  displayName: string;
  password: string;
  sharedAccountName: string;
}>;

export type ProvisionUserInput =
  | (ProvisionUserBase &
      Readonly<{ mode: typeof PROVISIONING_MODE.Owner; personalAccountName: string }>)
  | (ProvisionUserBase & Readonly<{ mode: typeof PROVISIONING_MODE.SharedOnly }>);

export type ProvisionedUser = Readonly<{
  id: string;
  email: string;
  displayName: string;
}>;

export type ProvisionUserResult = Readonly<{
  user: ProvisionedUser;
  created: boolean;
}>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function ensureMember(
  repositories: ProvisioningRepositories,
  bankAccount: BankAccountRecord,
  userId: string,
): Promise<void> {
  assertCanBeMember(bankAccount, userId);

  if (await repositories.memberships.isMember(userId, bankAccount.id)) {
    return;
  }

  await repositories.memberships.add(userId, bankAccount.id);
}

export class UserProvisioningService {
  private readonly unitOfWork: ProvisioningUnitOfWork;
  private readonly passwordHasher: PasswordHasher;

  constructor(unitOfWork: ProvisioningUnitOfWork, passwordHasher: PasswordHasher) {
    this.unitOfWork = unitOfWork;
    this.passwordHasher = passwordHasher;
  }

  provision(input: ProvisionUserInput): Promise<ProvisionUserResult> {
    return this.unitOfWork.run(async (repositories) => {
      const { user, created } = await this.findOrCreateUser(repositories, input);
      const shared =
        (await repositories.bankAccounts.findSharedByName(input.sharedAccountName)) ??
        (await repositories.bankAccounts.createShared(input.sharedAccountName));

      await ensureMember(repositories, shared, user.id);

      if (input.mode === PROVISIONING_MODE.Owner) {
        const personal =
          (await repositories.bankAccounts.findPersonalByOwner(user.id)) ??
          (await repositories.bankAccounts.createPersonal(user.id, input.personalAccountName));

        await ensureMember(repositories, personal, user.id);
      }

      return {
        user: { id: user.id, email: user.email, displayName: user.displayName },
        created,
      };
    });
  }

  private async findOrCreateUser(
    repositories: ProvisioningRepositories,
    input: ProvisionUserInput,
  ): Promise<{ user: UserRecord; created: boolean }> {
    const email = normalizeEmail(input.email);
    const existing = await repositories.users.findByEmail(email);

    if (existing !== null) {
      return { user: existing, created: false };
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await repositories.users.create({
      email,
      displayName: input.displayName,
      passwordHash,
    });

    return { user, created: true };
  }
}
