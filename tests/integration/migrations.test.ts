import { randomBytes, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  BANK_ACCOUNT_MEMBERSHIPS_TABLE,
  BANK_ACCOUNTS_TABLE,
  LOGIN_THROTTLES_TABLE,
  SESSIONS_TABLE,
  USERS_TABLE,
  createOrmConfig,
} from '@aitl/db';
import { MikroORM } from '@mikro-orm/postgresql';
import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';

const MIGRATIONS_PATH = fileURLToPath(new URL('../../packages/db/migrations', import.meta.url));
const AUTH_TABLES = [
  USERS_TABLE,
  BANK_ACCOUNTS_TABLE,
  BANK_ACCOUNT_MEMBERSHIPS_TABLE,
  SESSIONS_TABLE,
  LOGIN_THROTTLES_TABLE,
];
const CHECK_VIOLATION = '23514';
const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';
const HASH_BYTES = 16;

type BankAccountType = 'shared' | 'personal';

describe('database migrations', () => {
  let orm: MikroORM;
  const databaseName = `migrations_${randomBytes(HASH_BYTES).toString('hex')}`;
  const databaseUrl = new URL(inject('databaseUrl'));
  databaseUrl.pathname = `/${databaseName}`;
  const client = new Client({ connectionString: databaseUrl.toString() });

  const randomHex = (): string => randomBytes(HASH_BYTES).toString('hex');

  const insertUser = async (email: string = `${randomHex()}@example.test`): Promise<string> => {
    const id = randomUUID();
    await client.query(
      `INSERT INTO ${USERS_TABLE} (id, created_at, updated_at, email, display_name, password_hash)
       VALUES ($1, now(), now(), $2, $3, $4)`,
      [id, email, randomHex(), randomHex()],
    );

    return id;
  };

  const insertBankAccount = async (
    type: BankAccountType,
    name: string,
    ownerId: string | null,
  ): Promise<string> => {
    const id = randomUUID();
    await client.query(
      `INSERT INTO ${BANK_ACCOUNTS_TABLE} (id, created_at, updated_at, type, name, owner_id)
       VALUES ($1, now(), now(), $2, $3, $4)`,
      [id, type, name, ownerId],
    );

    return id;
  };

  const insertMembership = async (userId: string, bankAccountId: string): Promise<void> => {
    await client.query(
      `INSERT INTO ${BANK_ACCOUNT_MEMBERSHIPS_TABLE} (id, created_at, updated_at, user_id, bank_account_id)
       VALUES ($1, now(), now(), $2, $3)`,
      [randomUUID(), userId, bankAccountId],
    );
  };

  const insertSession = async (userId: string): Promise<void> => {
    await client.query(
      `INSERT INTO ${SESSIONS_TABLE} (id, created_at, updated_at, user_id, token_hash, expires_at, absolute_expires_at)
       VALUES ($1, now(), now(), $2, $3, now(), now())`,
      [randomUUID(), userId, randomHex()],
    );
  };

  const countRows = async (table: string): Promise<number> => {
    const result = await client.query<{ total: string }>(`SELECT count(*) AS total FROM ${table}`);

    return Number(result.rows[0]?.total);
  };

  const listExistingAuthTables = async (): Promise<string[]> => {
    const result = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = ANY($1) ORDER BY table_name`,
      [AUTH_TABLES],
    );

    return result.rows.map((row) => row.table_name);
  };

  beforeAll(async () => {
    const adminClient = new Client({ connectionString: inject('databaseUrl') });
    await adminClient.connect();
    await adminClient.query(`CREATE DATABASE ${databaseName}`);
    await adminClient.end();
    orm = await MikroORM.init(
      createOrmConfig({ databaseUrl: databaseUrl.toString(), migrationsPath: MIGRATIONS_PATH }),
    );
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
    await orm.close();
  });

  it('applies all pending migrations and can be repeated safely', async () => {
    const migrator = orm.migrator;

    const applied = await migrator.up();
    const pendingAfter = await migrator.getPending();

    expect(applied.length).toBeGreaterThan(0);
    expect(pendingAfter).toEqual([]);
  });

  it('creates every auth table', async () => {
    const expected = [...AUTH_TABLES].sort();

    const actual = await listExistingAuthTables();

    expect(actual).toEqual(expected);
  });

  describe('users', () => {
    it('rejects an e-mail written with upper case letters', async () => {
      const actual = insertUser('Owner@Example.test');

      await expect(actual).rejects.toMatchObject({ code: CHECK_VIOLATION });
    });

    it('rejects a duplicated e-mail', async () => {
      const email = `${randomHex()}@example.test`;
      await insertUser(email);

      const actual = insertUser(email);

      await expect(actual).rejects.toMatchObject({ code: UNIQUE_VIOLATION });
    });
  });

  describe('bank accounts', () => {
    it('accepts a shared account without an owner and a personal account with one', async () => {
      const ownerId = await insertUser();

      const shared = insertBankAccount('shared', randomHex(), null);
      const personal = insertBankAccount('personal', randomHex(), ownerId);

      await expect(shared).resolves.toEqual(expect.any(String));
      await expect(personal).resolves.toEqual(expect.any(String));
    });

    it('rejects a second personal account of the same owner', async () => {
      const ownerId = await insertUser();
      await insertBankAccount('personal', randomHex(), ownerId);

      const actual = insertBankAccount('personal', randomHex(), ownerId);

      await expect(actual).rejects.toMatchObject({ code: UNIQUE_VIOLATION });
    });

    it('rejects a personal account without an owner', async () => {
      const actual = insertBankAccount('personal', randomHex(), null);

      await expect(actual).rejects.toMatchObject({ code: CHECK_VIOLATION });
    });

    it('rejects a shared account with an owner', async () => {
      const ownerId = await insertUser();

      const actual = insertBankAccount('shared', randomHex(), ownerId);

      await expect(actual).rejects.toMatchObject({ code: CHECK_VIOLATION });
    });

    it('rejects an unknown account type', async () => {
      const ownerId = await insertUser();

      const actual = insertBankAccount('business' as BankAccountType, randomHex(), ownerId);

      await expect(actual).rejects.toMatchObject({ code: CHECK_VIOLATION });
    });

    it('rejects a second shared account with the same name', async () => {
      const name = randomHex();
      await insertBankAccount('shared', name, null);

      const actual = insertBankAccount('shared', name, null);

      await expect(actual).rejects.toMatchObject({ code: UNIQUE_VIOLATION });
    });

    it('allows several shared accounts with different names', async () => {
      await insertBankAccount('shared', randomHex(), null);

      const actual = insertBankAccount('shared', randomHex(), null);

      await expect(actual).resolves.toEqual(expect.any(String));
    });

    it('allows a personal account to share its name with a shared account', async () => {
      const ownerId = await insertUser();
      const name = randomHex();
      await insertBankAccount('shared', name, null);

      const actual = insertBankAccount('personal', name, ownerId);

      await expect(actual).resolves.toEqual(expect.any(String));
    });

    it('rejects deleting a user that owns a personal account', async () => {
      const ownerId = await insertUser();
      await insertBankAccount('personal', randomHex(), ownerId);

      const actual = client.query(`DELETE FROM ${USERS_TABLE} WHERE id = $1`, [ownerId]);

      await expect(actual).rejects.toMatchObject({ code: FOREIGN_KEY_VIOLATION });
    });
  });

  describe('bank account memberships', () => {
    it('rejects a duplicated membership', async () => {
      const userId = await insertUser();
      const bankAccountId = await insertBankAccount('shared', randomHex(), null);
      await insertMembership(userId, bankAccountId);

      const actual = insertMembership(userId, bankAccountId);

      await expect(actual).rejects.toMatchObject({ code: UNIQUE_VIOLATION });
    });

    it('rejects a membership of an unknown bank account', async () => {
      const userId = await insertUser();

      const actual = insertMembership(userId, randomUUID());

      await expect(actual).rejects.toMatchObject({ code: FOREIGN_KEY_VIOLATION });
    });

    it('removes memberships together with the user', async () => {
      const userId = await insertUser();
      const bankAccountId = await insertBankAccount('shared', randomHex(), null);
      await insertMembership(userId, bankAccountId);

      await client.query(`DELETE FROM ${USERS_TABLE} WHERE id = $1`, [userId]);
      const actual = await client.query(
        `SELECT 1 FROM ${BANK_ACCOUNT_MEMBERSHIPS_TABLE} WHERE user_id = $1`,
        [userId],
      );

      expect(actual.rowCount).toBe(0);
    });

    it('removes memberships together with the bank account', async () => {
      const userId = await insertUser();
      const bankAccountId = await insertBankAccount('shared', randomHex(), null);
      await insertMembership(userId, bankAccountId);

      await client.query(`DELETE FROM ${BANK_ACCOUNTS_TABLE} WHERE id = $1`, [bankAccountId]);
      const actual = await client.query(
        `SELECT 1 FROM ${BANK_ACCOUNT_MEMBERSHIPS_TABLE} WHERE bank_account_id = $1`,
        [bankAccountId],
      );

      expect(actual.rowCount).toBe(0);
    });
  });

  describe('sessions', () => {
    it('removes sessions together with the user', async () => {
      const userId = await insertUser();
      await insertSession(userId);

      await client.query(`DELETE FROM ${USERS_TABLE} WHERE id = $1`, [userId]);
      const actual = await client.query(`SELECT 1 FROM ${SESSIONS_TABLE} WHERE user_id = $1`, [
        userId,
      ]);

      expect(actual.rowCount).toBe(0);
    });

    it('rejects a duplicated token hash', async () => {
      const userId = await insertUser();
      const tokenHash = randomHex();
      const insert = (): Promise<unknown> =>
        client.query(
          `INSERT INTO ${SESSIONS_TABLE} (id, created_at, updated_at, user_id, token_hash, expires_at, absolute_expires_at)
           VALUES ($1, now(), now(), $2, $3, now(), now())`,
          [randomUUID(), userId, tokenHash],
        );
      await insert();

      const actual = insert();

      await expect(actual).rejects.toMatchObject({ code: UNIQUE_VIOLATION });
    });
  });

  describe('login throttles', () => {
    it('defaults failures to zero and rejects a duplicated key hash', async () => {
      const keyHash = randomHex();
      const insert = (): Promise<unknown> =>
        client.query(
          `INSERT INTO ${LOGIN_THROTTLES_TABLE} (id, created_at, updated_at, key_hash, window_started_at)
           VALUES ($1, now(), now(), $2, now())`,
          [randomUUID(), keyHash],
        );
      await insert();

      const stored = await client.query<{ failures: number }>(
        `SELECT failures FROM ${LOGIN_THROTTLES_TABLE} WHERE key_hash = $1`,
        [keyHash],
      );
      const actual = insert();

      expect(stored.rows[0]?.failures).toBe(0);
      await expect(actual).rejects.toMatchObject({ code: UNIQUE_VIOLATION });
    });
  });

  describe('login throttle failures check', () => {
    it('rejects a negative failure count', async () => {
      const actual = client.query(
        `INSERT INTO ${LOGIN_THROTTLES_TABLE} (id, created_at, updated_at, key_hash, failures, window_started_at)
         VALUES ($1, now(), now(), $2, -1, now())`,
        [randomUUID(), randomHex()],
      );

      await expect(actual).rejects.toMatchObject({ code: CHECK_VIOLATION });
    });
  });

  it('reverts the auth migration and applies it again', async () => {
    const migrator = orm.migrator;
    const expected = [...AUTH_TABLES].sort();

    const revertedChecks = await migrator.down();
    const reverted = await migrator.down();
    const tablesAfterDown = await listExistingAuthTables();
    await migrator.up();
    const tablesAfterUp = await listExistingAuthTables();
    const rowsAfterUp = await countRows(USERS_TABLE);

    expect(revertedChecks).toHaveLength(1);
    expect(reverted).toHaveLength(1);
    expect(tablesAfterDown).toEqual([]);
    expect(tablesAfterUp).toEqual(expected);
    expect(rowsAfterUp).toBe(0);
  });
});
