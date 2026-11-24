import type { BankAccountRecord } from './bank-account';

export interface BankAccountRepository {
  findById(id: string): Promise<BankAccountRecord | null>;
  findSharedByName(name: string): Promise<BankAccountRecord | null>;
  findPersonalByOwner(ownerUserId: string): Promise<BankAccountRecord | null>;
  createShared(name: string): Promise<BankAccountRecord>;
  createPersonal(ownerUserId: string, name: string): Promise<BankAccountRecord>;
  listForUser(userId: string): Promise<BankAccountRecord[]>;
}
