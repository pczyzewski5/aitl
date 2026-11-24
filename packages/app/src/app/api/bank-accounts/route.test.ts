import { randomBytes } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { container } from '../../../container/container';
import { GET } from './route';

const sessionCookie = vi.hoisted(() => ({ readSessionToken: vi.fn() }));

vi.mock('../../../http/session-cookie', () => sessionCookie);

const randomText = (): string => randomBytes(8).toString('hex');

describe('GET /api/bank-accounts', () => {
  const resolve = vi.fn();
  const listForUser = vi.fn();

  beforeEach(() => {
    resolve.mockReset();
    listForUser.mockReset();
    sessionCookie.readSessionToken.mockReset();
    vi.spyOn(container, 'createScope').mockReturnValue({
      cradle: { sessionResolver: { resolve }, bankAccountService: { listForUser } },
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists the accounts of the user of the session', async () => {
    const userId = randomText();
    const token = randomText();
    const bankAccounts = [{ id: randomText(), type: 'shared', name: randomText() }];
    sessionCookie.readSessionToken.mockResolvedValue(token);
    resolve.mockResolvedValue({ userId });
    listForUser.mockResolvedValue(bankAccounts);

    const actual = await GET(new Request('http://localhost/api/bank-accounts'), undefined);

    expect(actual.status).toBe(200);
    expect(await actual.json()).toEqual({ ok: true, data: { bankAccounts } });
    expect(resolve).toHaveBeenCalledWith(token);
    expect(listForUser).toHaveBeenCalledWith(userId);
  });

  it.each([
    { name: 'without a cookie', token: null },
    { name: 'with a token of no live session', token: randomText() },
  ])('answers 401 $name and lists nothing', async ({ token }) => {
    sessionCookie.readSessionToken.mockResolvedValue(token);
    resolve.mockResolvedValue(null);

    const actual = await GET(new Request('http://localhost/api/bank-accounts'), undefined);

    expect(actual.status).toBe(401);
    expect((await actual.json()).error.code).toBe('unauthorized');
    expect(listForUser).not.toHaveBeenCalled();
  });
});
