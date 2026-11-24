const ACCOUNT_QUERY_PARAM = 'account';

function buildAccountHref(accountId: string): string {
  const query = new URLSearchParams({ [ACCOUNT_QUERY_PARAM]: accountId });

  return `/?${query.toString()}`;
}

export { ACCOUNT_QUERY_PARAM, buildAccountHref };
