export type ThrottleCounter = Readonly<{
  keyHash: string;
  limit: number;
  windowMs: number;
  lockMs: number;
}>;

export type ThrottleReservation = Readonly<{
  failures: number;
  lockedUntil: Date | null;
}>;

export interface LoginThrottleRepository {
  reserveAttempt(counter: ThrottleCounter, now: Date): Promise<ThrottleReservation>;
  deleteByKeyHashes(keyHashes: readonly string[]): Promise<void>;
}
