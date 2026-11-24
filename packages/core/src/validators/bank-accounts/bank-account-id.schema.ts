import { z } from 'zod';

export const INVALID_BANK_ACCOUNT_ID_MESSAGE = 'Invalid bank account id';

export const bankAccountIdSchema = z.uuid();
