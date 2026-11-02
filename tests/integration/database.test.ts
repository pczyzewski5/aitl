import { Client } from 'pg';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';

describe('PostgreSQL started by testcontainers', () => {
  const client = new Client({ connectionString: inject('databaseUrl') });

  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it('accepts connections and runs queries', async () => {
    const result = await client.query<{ answer: number }>('SELECT 1 AS answer');

    expect(result.rows[0]?.answer).toBe(1);
  });
});
