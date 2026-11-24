import type { FieldErrors, FieldValues, SubmitResult } from '../../backend/forms/use-form-validation';

type EntryFailureKind = 'validation' | 'conflict' | 'network' | 'limit';

interface EntryActionFailure<Field extends string = string> {
  ok: false;
  kind: EntryFailureKind;
  fieldErrors?: Partial<Record<Field, string>>;
}

type EntryActionResult<Field extends string = string> = { ok: true } | EntryActionFailure<Field>;

type EntryFailureMessages = Record<EntryFailureKind, string>;

const NETWORK_FAILURE: EntryActionFailure = { ok: false, kind: 'network' };

async function settleEntryAction<Field extends string>(
  run: () => Promise<EntryActionResult<Field>>,
): Promise<EntryActionResult<Field>> {
  try {
    return await run();
  } catch {
    return NETWORK_FAILURE;
  }
}

function toSubmitResult<Values extends FieldValues>(
  failure: EntryActionFailure,
  fields: readonly (keyof Values & string)[],
  messages: EntryFailureMessages,
): SubmitResult<Values> {
  const fieldErrors: FieldErrors<Values> = {};
  if (failure.kind === 'validation') {
    for (const name of fields) {
      const message = failure.fieldErrors?.[name];
      if (message) {
        fieldErrors[name] = message;
      }
    }
  }

  return Object.keys(fieldErrors).length > 0 ? { ok: false, fieldErrors } : { ok: false, formError: messages[failure.kind] };
}

export { settleEntryAction, toSubmitResult };
export type { EntryActionFailure, EntryActionResult, EntryFailureKind, EntryFailureMessages };
