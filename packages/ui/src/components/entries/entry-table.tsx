'use client';

import { type ReactNode, useId } from 'react';
import { cn } from '../../lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { EmptyState } from '../ui/empty-state';
import type { EmptyStateAction, StateTitleLevel } from '../ui/empty-state';
import { ErrorState } from '../ui/error-state';
import { Skeleton } from '../ui/skeleton';
import { EntryRow, type EntryRowData } from './entry-row';
import { DEFAULT_ENTRY_TABLE_MESSAGES, ENTRY_LIST_LIMIT, type EntryTableMessages } from './entry-table.messages';

const SKELETON_ROW_COUNT = 5;

type EntryTableStatus = 'loading' | 'error' | 'loaded' | 'limit-exceeded';

interface EntryTableProps {
  status: EntryTableStatus;
  caption: string;
  entries?: readonly EntryRowData[];
  onPaidChange: (entryId: string, paid: boolean) => void;
  savingEntryIds?: readonly string[];
  actions?: (entry: EntryRowData) => ReactNode;
  captionVisible?: boolean;
  onRetry: () => void;
  retrying?: boolean;
  emptyAction?: EmptyStateAction;
  limit?: number;
  headingLevel?: StateTitleLevel;
  messages?: Partial<EntryTableMessages>;
  className?: string;
}

const HEADER_CLASS_NAME = 'px-(--space-within-group) py-(--space-1) text-sm font-semibold';

function EntryTable({
  status,
  caption,
  entries = [],
  onPaidChange,
  savingEntryIds = [],
  actions,
  captionVisible = false,
  onRetry,
  retrying = false,
  emptyAction,
  limit = ENTRY_LIST_LIMIT,
  headingLevel = 'h3',
  messages,
  className,
}: EntryTableProps) {
  const text: EntryTableMessages = { ...DEFAULT_ENTRY_TABLE_MESSAGES, ...messages };
  const hintId = useId();
  const captionId = useId();
  const showActions = actions !== undefined;
  const hasRows = (status === 'loaded' || status === 'limit-exceeded') && entries.length > 0;

  return (
    <div
      data-slot="entry-table"
      aria-busy={status === 'loading' ? true : undefined}
      className={cn('@container flex min-w-0 max-w-full flex-col gap-(--space-between-groups)', className)}
    >
      {status === 'limit-exceeded' && (
        <Alert variant="error">
          <AlertTitle>{text.limitExceededTitle}</AlertTitle>
          <AlertDescription className="wrap-anywhere">{text.limitExceededDescription(limit)}</AlertDescription>
        </Alert>
      )}
      {status === 'loading' && (
        <div data-slot="entry-table-skeleton" className="flex flex-col gap-(--space-within-group)">
          <p className="sr-only">{text.loadingLabel}</p>
          {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
            <Skeleton key={index} className="h-10" />
          ))}
        </div>
      )}
      {status === 'error' && (
        <ErrorState
          announce
          title={text.errorTitle}
          description={text.errorDescription}
          retryLabel={text.retryLabel}
          retrying={retrying}
          onRetry={onRetry}
          titleLevel={headingLevel}
        />
      )}
      {status === 'loaded' && entries.length === 0 && (
        <EmptyState
          title={text.emptyTitle}
          description={text.emptyDescription}
          action={emptyAction}
          titleLevel={headingLevel}
        />
      )}
      {hasRows && (
        <>
          <p id={hintId} data-slot="entry-table-hint" className="text-sm leading-base text-muted-foreground @xl:hidden">
            {text.scrollHint}
          </p>
          <div
            data-slot="entry-table-scroll"
            role="region"
            aria-labelledby={captionId}
            aria-describedby={hintId}
            tabIndex={0}
            className="relative max-w-full overflow-x-auto rounded-card border border-border bg-card"
          >
            <table data-slot="entry-table-table" className="w-full min-w-xl border-collapse text-sm leading-base">
              <caption id={captionId} className={captionVisible ? 'p-(--space-panel) text-left text-base font-semibold' : 'sr-only'}>
                {caption}
              </caption>
              <thead>
                <tr>
                  <th scope="col" className={cn(HEADER_CLASS_NAME, 'text-left')}>
                    {text.descriptionHeader}
                  </th>
                  <th scope="col" className={cn(HEADER_CLASS_NAME, 'text-right')}>
                    {text.amountHeader}
                  </th>
                  <th scope="col" className={cn(HEADER_CLASS_NAME, 'text-left')}>
                    {text.dateHeader}
                  </th>
                  <th scope="col" className={cn(HEADER_CLASS_NAME, 'text-center')}>
                    {text.paidHeader}
                  </th>
                  {showActions && (
                    <th scope="col" className={HEADER_CLASS_NAME}>
                      <span className="sr-only">{text.actionsHeader}</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    onPaidChange={onPaidChange}
                    saving={savingEntryIds.includes(entry.id)}
                    showActions={showActions}
                    actions={actions?.(entry)}
                    messages={messages}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export { EntryTable };
export type { EntryTableProps, EntryTableStatus };
