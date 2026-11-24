export const FORWARDED_FOR_HEADER = 'X-Forwarded-For';
export const UNKNOWN_CLIENT_IP = 'unknown';

export function resolveClientIp(headers: Headers, trustedProxyHops: number): string {
  if (trustedProxyHops === 0) {
    return UNKNOWN_CLIENT_IP;
  }

  const forwardedFor = (headers.get(FORWARDED_FOR_HEADER) ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');

  return forwardedFor[forwardedFor.length - trustedProxyHops] ?? UNKNOWN_CLIENT_IP;
}
