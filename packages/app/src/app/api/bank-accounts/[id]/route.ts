import {
  INVALID_BANK_ACCOUNT_ID_MESSAGE,
  ValidationError,
  assertMemberOfBankAccount,
  bankAccountIdSchema,
  requireSession,
  type ApiRouteParams,
} from '@aitl/core';
import { apiHandler } from '../../../../http/api-handler';
import { readSessionToken } from '../../../../http/session-cookie';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (_request, scope, { params }: ApiRouteParams<{ id: string }>) => {
  const { sessionResolver, bankAccountMembershipRepository, bankAccountService } = scope.cradle;
  const parsedId = bankAccountIdSchema.safeParse((await params).id);

  const session = await requireSession(await readSessionToken(), sessionResolver);

  if (!parsedId.success) {
    throw new ValidationError(INVALID_BANK_ACCOUNT_ID_MESSAGE);
  }

  await assertMemberOfBankAccount(session, parsedId.data, bankAccountMembershipRepository);

  return bankAccountService.getSummary(parsedId.data);
});
