import { randomBytes, randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { container } from '../../../../container/container';
import { GET } from './route';

const sessionCookie = vi.hoisted(() => ({ readSessionToken: vi.fn() }));

vi.mock('../../../../http/session-cookie', () => sessionCookie);

const randomText = (): string => randomBytes(8).toString('hex');

const callGet = (id: string): Promise<Response> =>
  GET(new Request(`http://localhost/api/bank-accounts/${id}`), { params: Promise.resolve({ id }) });

describe('GET /api/bank-accounts/{id}', () => {
  const resolve = vi.fn();
  const isMember = vi.fn();
  const getSummary = vi.fn();

  beforeEach(() => {
    resolve.mockReset();
    isMember.mockReset();
    getSummary.mockReset();
    sessionCookie.readSessionToken.mockReset();
    sessionCookie.readSessionToken.mockResolvedValue(randomText());
    vi.spyOn(container, 'createScope').mockReturnValue({
      cradle: {
        sessionResolver: { resolve },
        bankAccountMembershipRepository: { isMember },
        bankAccountService: { getSummary },
      },
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the account to a member', async () => {
    const userId = randomText();
    const id = randomUUID();
    const summary = { id, type: 'shared', name: randomText() };
    resolve.mockResolvedValue({ userId });
    isMember.mockResolvedValue(true);
    getSummary.mockResolvedValue(summary);

    const actual = await callGet(id);

    expect(actual.status).toBe(200);
    expect(await actual.json()).toEqual({ ok: true, data: summary });
    expect(isMember).toHaveBeenCalledWith(userId, id);
  });

  it('answers 403 to a user who is not a member and does not read the account', async () => {
    resolve.mockResolvedValue({ userId: randomText() });
    isMember.mockResolvedValue(false);

    const actual = await callGet(randomUUID());

    expect(actual.status).toBe(403);
    expect((await actual.json()).error.code).toBe('forbidden');
    expect(getSummary).not.toHaveBeenCalled();
  });

  it('answers 401 without a session before looking at the id', async () => {
    resolve.mockResolvedValue(null);

    const actual = await callGet('not-a-uuid');

    expect(actual.status).toBe(401);
    expect(isMember).not.toHaveBeenCalled();
  });

  it('answers 400 for an id that is not a UUID without querying the membership', async () => {
    resolve.mockResolvedValue({ userId: randomText() });

    const actual = await callGet('not-a-uuid');

    expect(actual.status).toBe(400);
    expect((await actual.json()).error.code).toBe('validation_error');
    expect(isMember).not.toHaveBeenCalled();
  });
});
