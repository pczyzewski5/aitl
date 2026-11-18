import { useId } from 'react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { EmptyState } from '../ui/empty-state';
import type { EmptyStateAction } from '../ui/empty-state';
import { ErrorState } from '../ui/error-state';
import { Skeleton } from '../ui/skeleton';
import { TextLink } from '../ui/text-link';
import { DEFAULT_BANK_ACCOUNT_LIST_MESSAGES } from './messages';
import type { BankAccountListMessages } from './messages';

const SKELETON_ROW_COUNT = 2;

type BankAccountType = 'shared' | 'personal';
type BankAccountListHeadingLevel = 'h1' | 'h2';
type StateHeadingLevel = 'h2' | 'h3';

interface BankAccountListItem {
  id: string;
  name: string;
  type: BankAccountType;
  href: string;
}

type BankAccountListStatus = 'loading' | 'error' | 'loaded';

interface BankAccountListProps {
  status: BankAccountListStatus;
  accounts?: readonly BankAccountListItem[];
  onRetry: () => void;
  retrying?: boolean;
  emptyAction?: EmptyStateAction;
  messages?: Partial<BankAccountListMessages>;
  headingLevel?: BankAccountListHeadingLevel;
  className?: string;
}

const STATE_HEADING_LEVELS: Record<BankAccountListHeadingLevel, StateHeadingLevel> = {
  h1: 'h2',
  h2: 'h3',
};

const ROW_CLASS_NAME =
  'flex flex-wrap items-center justify-between gap-x-(--space-between-groups) gap-y-(--space-within-group) rounded-card border border-border bg-card p-(--space-panel)';

function BankAccountList({
  status,
  accounts = [],
  onRetry,
  retrying = false,
  emptyAction,
  messages,
  headingLevel: Heading = 'h2',
  className,
}: BankAccountListProps) {
  const text: BankAccountListMessages = { ...DEFAULT_BANK_ACCOUNT_LIST_MESSAGES, ...messages };
  const headingId = useId();
  const stateHeadingLevel = STATE_HEADING_LEVELS[Heading];
  const badgeLabels: Record<BankAccountType, string> = { shared: text.sharedLabel, personal: text.personalLabel };

  return (
    <section
      data-slot="bank-account-list"
      aria-labelledby={headingId}
      aria-busy={status === 'loading' ? true : undefined}
      className={cn('flex flex-col gap-(--space-between-groups)', className)}
    >
      <Heading id={headingId} className="min-w-0 text-xl font-semibold leading-base wrap-anywhere">
        {text.title}
      </Heading>
      {status === 'loading' && (
        <div data-slot="bank-account-list-skeleton" className="flex flex-col gap-(--space-between-fields)">
          {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-card" />
          ))}
        </div>
      )}
      {status === 'error' && (
        <ErrorState
          title={text.errorTitle}
          description={text.errorDescription}
          retryLabel={text.retryLabel}
          onRetry={onRetry}
          retrying={retrying}
          announce
          titleLevel={stateHeadingLevel}
        />
      )}
      {status === 'loaded' && accounts.length === 0 && (
        <EmptyState
          title={text.emptyTitle}
          description={text.emptyDescription}
          action={emptyAction}
          titleLevel={stateHeadingLevel}
        />
      )}
      {status === 'loaded' && accounts.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-(--space-between-fields) p-0">
          {accounts.map((account) => (
            <li key={account.id} data-slot="bank-account-list-item" className={ROW_CLASS_NAME}>
              <TextLink href={account.href} className="inline-flex min-h-control min-w-0 items-center font-semibold wrap-anywhere">
                {account.name}
              </TextLink>
              <Badge variant={account.type}>{badgeLabels[account.type]}</Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export { BankAccountList };
export type {
  BankAccountListHeadingLevel,
  BankAccountListItem,
  BankAccountListProps,
  BankAccountListStatus,
  BankAccountType,
};
