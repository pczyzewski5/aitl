export type ThrottleCounter = Readonly<{
  keyHash: string;
  limit: number;
  windowMs: number;
  lockMs: number;
}>;

export interface LoginThrottleRepository {
  findActiveLockUntil(keyHashes: readonly string[], now: Date): Promise<Date | null>;
  recordFailure(counter: ThrottleCounter, now: Date): Promise<void>;
  deleteByKeyHashes(keyHashes: readonly string[]): Promise<void>;
}
