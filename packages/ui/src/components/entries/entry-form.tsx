'use client';

import { type ReactNode, useRef } from 'react';
import { ErrorSummary } from '../../backend/forms/error-summary';
import { parseAmountToMinor } from '../../backend/forms/parse-amount';
import { type FieldErrors, type SubmitResult, useFormValidation } from '../../backend/forms/use-form-validation';
import { formatMoneyMinor } from '../../lib/format-money-minor';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Field } from '../ui/field';
import { Input } from '../ui/input';
import { RadioGroup } from '../ui/radio-group';
import { Select } from '../ui/select';
import { AmountInput } from './amount-input';
import { DEFAULT_ENTRY_FORM_MESSAGES, type EntryFormMessages } from './entry-form.messages';
import { type EntryActionResult, settleEntryAction, toSubmitResult } from './entry-failure';
import type { EntryRowData, EntryType } from './entry-row';
import { MAX_DESCRIPTION_LENGTH, validateAmountText, validateDateText } from './entry-validation';
import { formatAmountInput } from './format-amount-input';

type EntryFormField = 'type' | 'description' | 'amount' | 'date' | 'recurrence';
type EntryRecurrence = 'none' | 'monthly';

type EntryFormValues = {
  type: string;
  description: string;
  amount: string;
  date: string;
  recurrence: string;
  paid: boolean;
};

interface EntryDraft {
  type: EntryType;
  description: string;
  amountMinor: number;
  occurredOn: string;
  recurrence: EntryRecurrence;
}

type EntrySubmission =
  | { kind: 'create'; draft: EntryDraft; paid: boolean }
  | { kind: 'update-one-off'; entryId: string; draft: EntryDraft }
  | { kind: 'update-series-description'; entryId: string; description: string };

type EntryFormMode = { kind: 'create'; defaultDate?: string } | { kind: 'edit'; entry: EntryRowData };

interface EntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: EntryFormMode;
  onSubmit: (submission: EntrySubmission) => Promise<EntryActionResult<EntryFormField>>;
  onSaved?: () => void;
  messages?: Partial<EntryFormMessages>;
}

type FormShape = 'create' | 'one-off' | 'series';

const FIELDS_BY_SHAPE: Record<FormShape, readonly EntryFormField[]> = {
  create: ['type', 'description', 'amount', 'date', 'recurrence'],
  'one-off': ['description', 'amount', 'date'],
  series: ['description'],
};

function shapeOf(mode: EntryFormMode): FormShape {
  if (mode.kind === 'create') {
    return 'create';
  }

  return mode.entry.recurrence === 'monthly' ? 'series' : 'one-off';
}

function initialValuesOf(mode: EntryFormMode): EntryFormValues {
  if (mode.kind === 'create') {
    return { type: 'expense', description: '', amount: '', date: mode.defaultDate ?? '', recurrence: 'none', paid: false };
  }

  const { entry } = mode;

  return {
    type: entry.type,
    description: entry.description,
    amount: formatAmountInput(entry.amountMinor),
    date: entry.occurredOn,
    recurrence: entry.recurrence,
    paid: entry.paid === true,
  };
}

function validateEntry(
  values: EntryFormValues,
  fields: readonly EntryFormField[],
  text: EntryFormMessages,
): FieldErrors<EntryFormValues> {
  const description = values.description.trim();
  let descriptionError: string | undefined;
  if (description === '') {
    descriptionError = text.descriptionRequired;
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    descriptionError = text.descriptionTooLong;
  }

  return {
    description: descriptionError,
    amount: fields.includes('amount') ? validateAmountText(values.amount, text.amountFailures) : undefined,
    date: fields.includes('date') ? validateDateText(values.date, text) : undefined,
  };
}

function buildSubmission(mode: EntryFormMode, values: EntryFormValues): EntrySubmission {
  const description = values.description.trim();
  if (mode.kind === 'edit' && mode.entry.recurrence === 'monthly') {
    return { kind: 'update-series-description', entryId: mode.entry.id, description };
  }

  const draft: EntryDraft = {
    type: values.type as EntryType,
    description,
    amountMinor: (parseAmountToMinor(values.amount) as { ok: true; minor: number }).minor,
    occurredOn: values.date.trim(),
    recurrence: values.recurrence as EntryRecurrence,
  };

  return mode.kind === 'create'
    ? { kind: 'create', draft, paid: values.type === 'expense' && values.paid }
    : { kind: 'update-one-off', entryId: mode.entry.id, draft };
}

interface ReadOnlyRow {
  label: string;
  value: ReactNode;
}

function ReadOnlySummary({ rows }: { rows: readonly ReadOnlyRow[] }) {
  return (
    <dl data-slot="entry-form-summary" className="m-0 flex flex-col gap-(--space-label-field) text-sm leading-base">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-wrap gap-x-(--space-within-group)">
          <dt className="font-semibold">{row.label}:</dt>
          <dd className="m-0 min-w-0 wrap-anywhere">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface EntryFormBodyProps {
  mode: EntryFormMode;
  text: EntryFormMessages;
  submit: (submission: EntrySubmission) => Promise<EntryActionResult<EntryFormField>>;
  onClose: () => void;
  onCancel: () => void;
}

function EntryFormBody({ mode, text, submit, onClose, onCancel }: EntryFormBodyProps) {
  const shape = shapeOf(mode);
  const fields = FIELDS_BY_SHAPE[shape];
  const form = useFormValidation<EntryFormValues>({
    initialValues: initialValuesOf(mode),
    validate: (values) => validateEntry(values, fields, text),
    onSubmit: async (values): Promise<SubmitResult<EntryFormValues>> => {
      const result = await settleEntryAction(() => submit(buildSubmission(mode, values)));
      if (result.ok) {
        onClose();

        return { ok: true };
      }

      return toSubmitResult<EntryFormValues>(result, fields, text);
    },
  });

  const typeOptions = [
    { value: 'income', label: text.incomeLabel },
    { value: 'expense', label: text.expenseLabel },
  ];
  const recurrenceOptions = [
    { value: 'none', label: text.recurrenceOnce },
    { value: 'monthly', label: text.recurrenceMonthly },
  ];
  const editedEntry = mode.kind === 'edit' ? mode.entry : undefined;
  const readOnlyRows: ReadOnlyRow[] = [];
  if (editedEntry) {
    readOnlyRows.push(
      { label: text.typeLegend, value: editedEntry.type === 'income' ? text.incomeLabel : text.expenseLabel },
      {
        label: text.recurrenceLabel,
        value: editedEntry.recurrence === 'monthly' ? text.recurrenceMonthly : text.recurrenceOnce,
      },
    );
  }
  if (editedEntry?.recurrence === 'monthly') {
    readOnlyRows.push(
      { label: text.dayOfMonthLabel, value: editedEntry.dayOfMonth },
      { label: text.amountLabel, value: formatMoneyMinor(editedEntry.amountMinor) },
    );
  }

  return (
    <form {...form.formProps} data-slot="entry-form" className="flex flex-col gap-(--space-between-fields)">
      <ErrorSummary title={text.summaryTitle} errors={form.summary} onSelect={form.focusField} />
      {readOnlyRows.length > 0 && <ReadOnlySummary rows={readOnlyRows} />}
      {shape === 'series' && (
        <p data-slot="entry-form-hint" className="text-sm leading-base text-muted-foreground wrap-anywhere">
          {text.recurringReadOnlyHint}
        </p>
      )}
      {shape === 'create' && (
        <RadioGroup
          legend={text.typeLegend}
          name="type"
          options={typeOptions}
          value={form.values.type}
          onValueChange={(value) => form.setValue('type', value)}
          onBlur={() => form.touch('type')}
          {...form.getFieldProps('type')}
        />
      )}
      <Field label={text.descriptionLabel} hint={text.descriptionHint} {...form.getFieldProps('description')}>
        <Input type="text" autoComplete="off" {...form.getInputProps('description')} />
      </Field>
      {shape !== 'series' && (
        <Field label={text.amountLabel} hint={text.amountHint} {...form.getFieldProps('amount')}>
          <AmountInput suffix={text.amountSuffix} {...form.getInputProps('amount')} />
        </Field>
      )}
      {shape !== 'series' && (
        <Field
          label={text.dateLabel}
          hint={form.values.recurrence === 'monthly' ? text.dateHintMonthly : text.dateHint}
          {...form.getFieldProps('date')}
        >
          <Input type="text" inputMode="numeric" autoComplete="off" {...form.getInputProps('date')} />
        </Field>
      )}
      {shape === 'create' && (
        <Field label={text.recurrenceLabel} {...form.getFieldProps('recurrence')}>
          <Select options={recurrenceOptions} {...form.getInputProps('recurrence')} />
        </Field>
      )}
      {shape === 'create' && form.values.type === 'expense' && (
        <Checkbox
          label={text.paidLabel}
          checked={form.values.paid}
          onCheckedChange={(checked) => form.setValue('paid', checked === true)}
        />
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
        <Button type="submit" loading={form.submitting}>
          {form.submitting ? text.submittingLabel : text.submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

function titleOf(shape: FormShape, text: EntryFormMessages): string {
  if (shape === 'create') {
    return text.createTitle;
  }

  return shape === 'series' ? text.editSeriesTitle : text.editTitle;
}

function descriptionOf(shape: FormShape, text: EntryFormMessages): string {
  if (shape === 'create') {
    return text.createDescription;
  }

  return shape === 'series' ? text.editSeriesDescription : text.editDescription;
}

function EntryForm({ open, onOpenChange, mode, onSubmit, onSaved, messages }: EntryFormProps) {
  const text: EntryFormMessages = { ...DEFAULT_ENTRY_FORM_MESSAGES, ...messages };
  const busyRef = useRef(false);
  const shape = shapeOf(mode);

  const submit = async (submission: EntrySubmission) => {
    busyRef.current = true;
    try {
      return await onSubmit(submission);
    } finally {
      busyRef.current = false;
    }
  };

  const requestOpenChange = (next: boolean) => {
    if (!busyRef.current) {
      onOpenChange(next);
    }
  };

  const close = () => {
    onOpenChange(false);
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={requestOpenChange}>
      <DialogContent dismissOnOverlayClick={false}>
        <DialogHeader>
          <DialogTitle>{titleOf(shape, text)}</DialogTitle>
          <DialogDescription>{descriptionOf(shape, text)}</DialogDescription>
        </DialogHeader>
        <EntryFormBody
          mode={mode}
          text={text}
          submit={submit}
          onClose={close}
          onCancel={() => requestOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export { EntryForm };
export type { EntryDraft, EntryFormField, EntryFormMode, EntryFormProps, EntryFormValues, EntryRecurrence, EntrySubmission };
