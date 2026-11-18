'use client';

import { useState } from 'react';
import { formatMoneyMinor } from '../../lib/format-money-minor';
import { type MonthKey, formatMonthLabel } from '../months/month';
import { Menu, type MenuItem } from '../ui/menu';
import { ActionConfirmDialog } from './action-confirm-dialog';
import type { EntryActionResult } from './entry-failure';
import type { EntryRowData, OneOffEntry, RecurringEntry } from './entry-row';
import { DEFAULT_SERIES_ACTIONS_MESSAGES, type SeriesActionsMessages } from './series-actions.messages';
import { SeriesChangeDialog, type SeriesChangeField } from './series-change-dialog';

type SeriesDialog = 'delete' | 'end' | 'change-amount';
type SeriesCompletedAction = 'delete' | 'end' | 'change-amount';

interface SeriesControls {
  deletable: boolean;
  endMonthOptions: readonly MonthKey[];
  amountMonthOptions: readonly MonthKey[];
  onEnd: (entryId: string, fromMonth: MonthKey) => Promise<EntryActionResult<SeriesChangeField>>;
  onChangeAmount: (
    entryId: string,
    fromMonth: MonthKey,
    amountMinor: number,
  ) => Promise<EntryActionResult<SeriesChangeField>>;
}

interface SeriesActionsBaseProps {
  onEdit: (entry: EntryRowData) => void;
  onDelete: (entryId: string) => Promise<EntryActionResult>;
  onCompleted?: (action: SeriesCompletedAction) => void;
  messages?: Partial<SeriesActionsMessages>;
}

interface OneOffActionsProps extends SeriesActionsBaseProps {
  entry: OneOffEntry;
  series?: undefined;
}

interface RecurringActionsProps extends SeriesActionsBaseProps {
  entry: RecurringEntry;
  series: SeriesControls;
}

type SeriesActionsProps = OneOffActionsProps | RecurringActionsProps;

function monthItem(
  id: string,
  label: string,
  options: readonly MonthKey[],
  noMonthsReason: string,
  open: () => void,
): MenuItem {
  return options.length > 0 ? { id, label, onSelect: open } : { id, label, disabled: true, disabledReason: noMonthsReason };
}

function SeriesActions({ entry, series, onEdit, onDelete, onCompleted, messages }: SeriesActionsProps) {
  const text: SeriesActionsMessages = { ...DEFAULT_SERIES_ACTIONS_MESSAGES, ...messages };
  const [dialog, setDialog] = useState<SeriesDialog>();

  const openDialog = (next: SeriesDialog) => () => setDialog(next);
  const closeDialog = () => setDialog(undefined);
  const toMonthOptions = (months: readonly MonthKey[]) =>
    months.map((month) => ({ value: month, label: formatMonthLabel(month, text.monthNames) }));

  const items: MenuItem[] = [
    { id: 'edit', label: series ? text.editDescriptionItem : text.editItem, onSelect: () => onEdit(entry) },
  ];
  if (series) {
    items.push(
      monthItem('end', text.endItem, series.endMonthOptions, text.noMonthsReason, openDialog('end')),
      monthItem('change-amount', text.changeAmountItem, series.amountMonthOptions, text.noMonthsReason, openDialog('change-amount')),
      series.deletable
        ? { id: 'delete-series', label: text.deleteSeriesItem, destructive: true, onSelect: openDialog('delete') }
        : {
            id: 'delete-series',
            label: text.deleteSeriesItem,
            destructive: true,
            disabled: true,
            disabledReason: text.deleteSeriesDisabledReason,
          },
    );
  } else {
    items.push({ id: 'delete', label: text.deleteItem, destructive: true, onSelect: openDialog('delete') });
  }

  return (
    <>
      <Menu triggerLabel={text.triggerLabel(entry.description)} items={items} align="end" />
      <ActionConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={closeDialog}
        title={series ? text.deleteSeriesTitle(entry.description) : text.deleteTitle(entry.description)}
        description={series ? text.deleteSeriesDescription : text.deleteDescription}
        confirmLabel={series ? text.deleteSeriesConfirm : text.deleteConfirm}
        cancelLabel={text.cancelLabel}
        failures={text}
        onConfirm={() => onDelete(entry.id)}
        onDone={() => onCompleted?.('delete')}
      />
      {series && (
        <>
          <SeriesChangeDialog
            kind="end"
            open={dialog === 'end'}
            onOpenChange={closeDialog}
            description={entry.description}
            currentAmount={formatMoneyMinor(entry.amountMinor)}
            monthOptions={toMonthOptions(series.endMonthOptions)}
            text={text}
            onSubmit={({ month }) => series.onEnd(entry.id, month)}
            onDone={() => onCompleted?.('end')}
          />
          <SeriesChangeDialog
            kind="change-amount"
            open={dialog === 'change-amount'}
            onOpenChange={closeDialog}
            description={entry.description}
            currentAmount={formatMoneyMinor(entry.amountMinor)}
            monthOptions={toMonthOptions(series.amountMonthOptions)}
            text={text}
            onSubmit={({ month, amountMinor }) => series.onChangeAmount(entry.id, month, amountMinor as number)}
            onDone={() => onCompleted?.('change-amount')}
          />
        </>
      )}
    </>
  );
}

export { SeriesActions };
export type { OneOffActionsProps, RecurringActionsProps, SeriesActionsProps, SeriesCompletedAction, SeriesControls };
