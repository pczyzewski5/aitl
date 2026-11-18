'use client';

import type { ReactNode } from 'react';
import { formatMoneyMinor } from '../../lib/format-money-minor';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { DEFAULT_ENTRY_TABLE_MESSAGES, type EntryTableMessages } from './entry-table.messages';
import { formatEntryDate } from './format-entry-date';

type EntryType = 'income' | 'expense';

interface EntryBase {
  id: string;
  type: EntryType;
  description: string;
  amountMinor: number;
  occurredOn: string;
  paid: boolean | null;
}

interface OneOffEntry extends EntryBase {
  recurrence: 'none';
}

interface RecurringEntry extends EntryBase {
  recurrence: 'monthly';
  dayOfMonth: number;
}

type EntryRowData = OneOffEntry | RecurringEntry;

interface EntryRowProps {
  entry: EntryRowData;
  onPaidChange: (entryId: string, paid: boolean) => void;
  saving?: boolean;
  actions?: ReactNode;
  showActions?: boolean;
  messages?: Partial<EntryTableMessages>;
}

const CELL_CLASS_NAME = 'px-(--space-within-group) py-(--space-1) align-middle';
const AMOUNT_TONES: Record<EntryType, string> = { income: 'text-income', expense: 'text-expense' };
const SAVING_CHECKBOX_CLASS_NAME =
  'aria-busy:cursor-progress aria-busy:border-muted-foreground aria-busy:bg-muted data-[state=checked]:aria-busy:bg-muted-foreground';

function signedAmount(entry: EntryRowData): string {
  const magnitude = Math.abs(entry.amountMinor);

  return formatMoneyMinor(entry.type === 'income' ? magnitude : -magnitude, { sign: 'always' });
}

function EntryRow({ entry, onPaidChange, saving = false, actions, showActions = false, messages }: EntryRowProps) {
  const text = { ...DEFAULT_ENTRY_TABLE_MESSAGES, ...messages };
  const typeLabel = entry.type === 'income' ? text.incomeLabel : text.expenseLabel;

  const handlePaidChange = (checked: boolean | 'indeterminate') => {
    if (!saving) {
      onPaidChange(entry.id, checked === true);
    }
  };

  return (
    <tr data-slot="entry-row" data-type={entry.type} data-recurrence={entry.recurrence} className="border-t border-border">
      <th scope="row" className={cn(CELL_CLASS_NAME, 'text-left font-normal')}>
        <span className="flex flex-wrap items-center gap-x-(--space-within-group) gap-y-(--space-label-field)">
          <span data-slot="entry-description" className="min-w-0 wrap-anywhere">
            {entry.description}
          </span>
          {entry.recurrence === 'monthly' && (
            <Badge data-slot="entry-recurrence" variant="neutral">
              {text.recurringBadge}
            </Badge>
          )}
        </span>
      </th>
      <td className={cn(CELL_CLASS_NAME, 'text-right whitespace-nowrap tabular-nums')}>
        <span data-slot="entry-amount" className={cn('font-semibold', AMOUNT_TONES[entry.type])}>
          <span className="sr-only">{typeLabel}: </span>
          {signedAmount(entry)}
        </span>
      </td>
      <td className={cn(CELL_CLASS_NAME, 'whitespace-nowrap text-muted-foreground')}>
        {entry.recurrence === 'monthly' ? (
          <span data-slot="entry-date">{text.recurringDay(entry.dayOfMonth)}</span>
        ) : (
          <time data-slot="entry-date" dateTime={entry.occurredOn}>
            {formatEntryDate(entry.occurredOn)}
          </time>
        )}
      </td>
      <td data-slot="entry-paid" className={cn(CELL_CLASS_NAME, 'text-center')}>
        {entry.type === 'expense' ? (
          <Checkbox
            aria-label={text.paidLabel(entry.description)}
            checked={entry.paid === true}
            aria-busy={saving || undefined}
            aria-disabled={saving || undefined}
            className={SAVING_CHECKBOX_CLASS_NAME}
            onCheckedChange={handlePaidChange}
          />
        ) : (
          <span className="sr-only">{text.paidNotApplicable}</span>
        )}
      </td>
      {showActions && (
        <td data-slot="entry-actions" className={cn(CELL_CLASS_NAME, 'text-right')}>
          {actions}
        </td>
      )}
    </tr>
  );
}

export { EntryRow };
export type { EntryRowData, EntryRowProps, EntryType, OneOffEntry, RecurringEntry };
