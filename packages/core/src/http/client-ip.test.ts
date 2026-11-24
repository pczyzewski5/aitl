import { describe, expect, it } from 'vitest';
import { FORWARDED_FOR_HEADER, UNKNOWN_CLIENT_IP, resolveClientIp } from './client-ip';

const headersWith = (forwardedFor?: string): Headers =>
  new Headers(forwardedFor === undefined ? {} : { [FORWARDED_FOR_HEADER]: forwardedFor });

describe('resolveClientIp', () => {
  it.each([
    { name: 'ignores the header without trusted proxies', forwardedFor: '1.1.1.1', hops: 0, expected: UNKNOWN_CLIENT_IP },
    { name: 'takes the last entry for one hop', forwardedFor: '9.9.9.9, 1.1.1.1', hops: 1, expected: '1.1.1.1' },
    { name: 'takes the second entry from the right for two hops', forwardedFor: '9.9.9.9,1.1.1.1, 2.2.2.2', hops: 2, expected: '1.1.1.1' },
    { name: 'falls back when the header is missing', forwardedFor: undefined, hops: 1, expected: UNKNOWN_CLIENT_IP },
    { name: 'falls back when there are fewer entries than hops', forwardedFor: '1.1.1.1', hops: 2, expected: UNKNOWN_CLIENT_IP },
    { name: 'skips empty entries', forwardedFor: '1.1.1.1, ,', hops: 1, expected: '1.1.1.1' },
  ])('$name', ({ forwardedFor, hops, expected }) => {
    const actual = resolveClientIp(headersWith(forwardedFor), hops);

    expect(actual).toBe(expected);
  });
});
