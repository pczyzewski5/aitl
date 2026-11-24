'use client';

import { ErrorSummary } from '../../backend/forms/error-summary';
import { parseAmountToMinor } from '../../backend/forms/parse-amount';
import { type FieldErrors, type SubmitResult, useFormValidation } from '../../backend/forms/use-form-validation';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Field } from '../ui/field';
import { Select, type SelectOption } from '../ui/select';
import { AmountInput } from './amount-input';
import { type EntryActionResult, settleEntryAction, toSubmitResult } from './entry-failure';
import { validateAmountText } from './entry-validation';
import type { SeriesActionsMessages } from './series-actions.messages';

type SeriesChangeField = 'month' | 'amount';
type SeriesChangeKind = 'end' | 'change-amount';

type SeriesChangeValues = { month: string; amount: string };

interface SeriesChangeSubmission {
  month: string;
  amountMinor?: number;
}

interface SeriesChangeDialogProps {
  kind: SeriesChangeKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description: string;
  currentAmount: string;
  monthOptions: readonly SelectOption[];
  text: SeriesActionsMessages;
  onSubmit: (submission: SeriesChangeSubmission) => Promise<EntryActionResult<SeriesChangeField>>;
  onDone?: () => void;
}

interface SeriesChangeFormProps extends Omit<SeriesChangeDialogProps, 'open' | 'description'> {
  onCancel: () => void;
}

function validateChange(
  values: SeriesChangeValues,
  kind: SeriesChangeKind,
  text: SeriesActionsMessages,
): FieldErrors<SeriesChangeValues> {
  const monthRequired = kind === 'end' ? text.endMonthRequired : text.changeAmountMonthRequired;

  return {
    month: values.month === '' ? monthRequired : undefined,
    amount: kind === 'change-amount' ? validateAmountText(values.amount, text.amountFailures) : undefined,
  };
}

function SeriesChangeForm({
  kind,
  onOpenChange,
  currentAmount,
  monthOptions,
  text,
  onSubmit,
  onDone,
  onCancel,
}: SeriesChangeFormProps) {
  const isAmountChange = kind === 'change-amount';
  const fields: readonly SeriesChangeField[] = isAmountChange ? ['month', 'amount'] : ['month'];
  const form = useFormValidation<SeriesChangeValues>({
    initialValues: { month: '', amount: '' },
    validate: (values) => validateChange(values, kind, text),
    onSubmit: async (values): Promise<SubmitResult<SeriesChangeValues>> => {
      const submission: SeriesChangeSubmission = isAmountChange
        ? { month: values.month, amountMinor: (parseAmountToMinor(values.amount) as { ok: true; minor: number }).minor }
        : { month: values.month };
      const result = await settleEntryAction(() => onSubmit(submission));
      if (result.ok) {
        onOpenChange(false);
        onDone?.();

        return { ok: true };
      }

      return toSubmitResult<SeriesChangeValues>(result, fields, text);
    },
  });

  return (
    <form {...form.formProps} data-slot="series-change-form" className="flex flex-col gap-(--space-between-fields)">
      <ErrorSummary title={text.summaryTitle} errors={form.summary} onSelect={form.focusField} />
      <Field label={isAmountChange ? text.changeAmountMonthLabel : text.endMonthLabel} {...form.getFieldProps('month')}>
        <Select options={monthOptions} placeholder={text.monthPlaceholder} {...form.getInputProps('month')} />
      </Field>
      {isAmountChange && (
        <Field label={text.amountLabel} hint={text.currentAmountHint(currentAmount)} {...form.getFieldProps('amount')}>
          <AmountInput suffix={text.amountSuffix} {...form.getInputProps('amount')} />
        </Field>
      )}
      {form.formError && (
        <Alert variant="error">
          <AlertDescription>{form.formError}</AlertDescription>
        </Alert>
      )}
      <DialogFooter>
        <Button type="button" variant="secondary" disabled={form.submitting} onClick={onCancel}>
          {text.cancelLabel}
        </Button>
        <Button type="submit" variant={isAmountChange ? 'default' : 'destructive'} loading={form.submitting}>
          {isAmountChange ? text.changeAmountConfirm : text.endConfirm}
        </Button>
      </DialogFooter>
    </form>
  );
}

function SeriesChangeDialog({ open, onOpenChange, description, ...formProps }: SeriesChangeDialogProps) {
  const { kind, text } = formProps;
  const isAmountChange = kind === 'change-amount';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dismissOnOverlayClick={false}>
        <DialogHeader>
          <DialogTitle>{isAmountChange ? text.changeAmountTitle(description) : text.endTitle(description)}</DialogTitle>
          <DialogDescription className="text-base text-foreground">
            {isAmountChange ? text.changeAmountDescription : text.endDescription}
          </DialogDescription>
        </DialogHeader>
        <SeriesChangeForm {...formProps} onOpenChange={onOpenChange} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

export { SeriesChangeDialog };
export type { SeriesChangeDialogProps, SeriesChangeField, SeriesChangeKind, SeriesChangeSubmission };
