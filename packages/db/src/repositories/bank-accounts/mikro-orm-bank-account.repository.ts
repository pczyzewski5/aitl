import {
  BANK_ACCOUNT_TYPE,
  type BankAccountRecord,
  type BankAccountRepository,
  type BankAccountType,
} from '@aitl/core';
import { BankAccount } from '../../entities/bank-accounts/bank-account.entity';
import { BankAccountMembership } from '../../entities/bank-accounts/bank-account-membership.entity';
import type { EntityManagerProvider } from '../../orm-provider';

type BankAccountRow = Readonly<{
  id: string;
  type: BankAccountType;
  name: string;
  owner?: Readonly<{ id: string }> | null;
}>;

function toRecord({ id, type, name, owner }: BankAccountRow): BankAccountRecord {
  return { id, type, name, ownerUserId: owner?.id ?? null };
}

export class MikroOrmBankAccountRepository implements BankAccountRepository {
  private readonly entityManagerProvider: EntityManagerProvider;

  constructor(entityManagerProvider: EntityManagerProvider) {
    this.entityManagerProvider = entityManagerProvider;
  }

  async findById(id: string): Promise<BankAccountRecord | null> {
    const em = await this.entityManagerProvider.getEntityManager();
    const bankAccount = await em.findOne(BankAccount, { id });

    return bankAccount === null ? null : toRecord(bankAccount);
  }

  async findSharedByName(name: string): Promise<BankAccountRecord | null> {
    const em = await this.entityManagerProvider.getEntityManager();
    const bankAccount = await em.findOne(BankAccount, { type: BANK_ACCOUNT_TYPE.Shared, name });

    return bankAccount === null ? null : toRecord(bankAccount);
  }

  async findPersonalByOwner(ownerUserId: string): Promise<BankAccountRecord | null> {
    const em = await this.entityManagerProvider.getEntityManager();
    const bankAccount = await em.findOne(BankAccount, {
      type: BANK_ACCOUNT_TYPE.Personal,
      owner: ownerUserId,
    });

    return bankAccount === null ? null : toRecord(bankAccount);
  }

  async createShared(name: string): Promise<BankAccountRecord> {
    const em = await this.entityManagerProvider.getEntityManager();
    const bankAccount = em.create(BankAccount, { type: BANK_ACCOUNT_TYPE.Shared, name });
    await em.flush();

    return toRecord(bankAccount);
  }

  async createPersonal(ownerUserId: string, name: string): Promise<BankAccountRecord> {
    const em = await this.entityManagerProvider.getEntityManager();
    const bankAccount = em.create(BankAccount, {
      type: BANK_ACCOUNT_TYPE.Personal,
      name,
      owner: ownerUserId,
    });
    await em.flush();

    return toRecord(bankAccount);
  }

  async listForUser(userId: string): Promise<BankAccountRecord[]> {
    const em = await this.entityManagerProvider.getEntityManager();
    const memberships = await em.find(
      BankAccountMembership,
      { user: userId },
      { populate: ['bankAccount'] },
    );

    return memberships.map((membership) => toRecord(membership.bankAccount));
  }
}
